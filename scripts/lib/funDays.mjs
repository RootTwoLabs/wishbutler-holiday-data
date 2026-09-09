/**
 * Kuratierte kuriose Feiertage ("FUN"-Paket): Loader, Validator, Builder.
 *
 * Content-Layout (content/fun-days/):
 *   days/<MM>.json        -> { days: [ { date: "MM-DD", slug, imageQueries: [] } ] }
 *   <locale>/<MM>.json    -> { <slug>: { label, intro, funFacts: [3..5] } }
 *
 * Alle Funktionen sind rein bzw. nur lesend, damit Tests ohne Netz laufen.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { LOCALES } from '../config.mjs';

export const FUN_LOCALES = LOCALES;
export const FUN_COUNTRY_CODE = 'FUN';
export const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
/** Februar mit 29 Tagen: der Schalttag ist ein regulärer Eintrag. */
export const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const SLUG_RE = /^[a-z0-9_]+$/;
export const INTRO_MAX = 280;
export const FUNFACT_MAX = 160;
export const FUNFACTS_MIN = 3;
export const FUNFACTS_MAX = 5;

const pad2 = (n) => String(n).padStart(2, '0');

/** Alle 366 Kalendertage als "MM-DD", chronologisch. */
export function allCalendarDays() {
  const out = [];
  DAYS_IN_MONTH.forEach((count, i) => {
    for (let d = 1; d <= count; d += 1) out.push(`${pad2(i + 1)}-${pad2(d)}`);
  });
  return out;
}

async function readJsonIfExists(path, fallback) {
  if (!existsSync(path)) return fallback;
  const raw = await readFile(path, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`${path}: ${e.message}`);
  }
}

/**
 * Lädt alle Monatsdateien. Rückgabe:
 *   { days: [...] (nach Datum sortiert, mit `month`),
 *     texts: { [locale]: { [slug]: {label,intro,funFacts} } },
 *     textsByMonth: { [locale]: { [MM]: {...} } },
 *     locales: [...] (die tatsächlich geladenen Locales, Default für validateFunDays/buildFunPackage) }
 */
export async function loadFunDays(contentRoot, locales = FUN_LOCALES) {
  const days = [];
  for (const mm of MONTHS) {
    const doc = await readJsonIfExists(join(contentRoot, 'days', `${mm}.json`), { days: [] });
    for (const d of doc.days ?? []) days.push({ ...d, month: mm });
  }
  days.sort((a, b) => String(a.date ?? '').localeCompare(String(b.date ?? '')));

  const texts = {};
  const textsByMonth = {};
  for (const loc of locales) {
    texts[loc] = {};
    textsByMonth[loc] = {};
    for (const mm of MONTHS) {
      const map = await readJsonIfExists(join(contentRoot, loc, `${mm}.json`), null);
      if (!map) continue;
      textsByMonth[loc][mm] = map;
      Object.assign(texts[loc], map);
    }
  }
  return { days, texts, textsByMonth, locales };
}

function checkText(prefix, entry, errors) {
  if (!entry || typeof entry !== 'object') {
    errors.push(`${prefix}: missing text`);
    return;
  }
  if (typeof entry.label !== 'string' || entry.label.trim() === '') errors.push(`${prefix}: empty label`);
  if (typeof entry.intro !== 'string' || entry.intro.trim() === '') errors.push(`${prefix}: empty intro`);
  else if (entry.intro.length > INTRO_MAX) errors.push(`${prefix}: intro too long (${entry.intro.length} > ${INTRO_MAX})`);
  const facts = entry.funFacts;
  if (!Array.isArray(facts) || facts.length < FUNFACTS_MIN || facts.length > FUNFACTS_MAX) {
    errors.push(`${prefix}: funFacts count ${Array.isArray(facts) ? facts.length : 'n/a'} (expected ${FUNFACTS_MIN}-${FUNFACTS_MAX})`);
    return;
  }
  facts.forEach((f, i) => {
    if (typeof f !== 'string' || f.trim() === '') errors.push(`${prefix}: funFacts[${i}] empty`);
    else if (f.length > FUNFACT_MAX) errors.push(`${prefix}: funFact too long [${i}] (${f.length} > ${FUNFACT_MAX})`);
  });
}

/**
 * Prüft Vollständigkeit und Form. Gibt eine Fehlerliste zurück (leer = ok).
 * `locales` schränkt die Text-Prüfung ein (Autoren-Modus, überschreibt
 * `data.locales`), `requireImages` verlangt data/images/FUN/<slug>/01.jpg
 * und dann auch `imagesRoot`.
 */
export function validateFunDays(data, { imagesRoot, requireImages = true, locales } = {}) {
  if (requireImages && !imagesRoot) throw new Error('imagesRoot required when requireImages is true');
  const errors = [];
  const { days, textsByMonth } = data;
  const effectiveLocales = locales ?? data.locales ?? FUN_LOCALES;

  const expected = new Set(allCalendarDays());
  const seenDates = new Set();
  const seenSlugs = new Set();
  for (const d of days) {
    const monthPrefix = `days/${d.month}`;
    const prefix = `${monthPrefix} ${d.date}`;
    const hasDate = typeof d.date === 'string' && /^[0-1][0-9]-[0-3][0-9]$/.test(d.date);
    if (!hasDate) errors.push(`${monthPrefix}: invalid date "${d.date}"`);

    // Slug- und imageQueries-Checks sind datumsunabhängig und laufen auch bei kaputtem `date`.
    if (typeof d.slug !== 'string' || !SLUG_RE.test(d.slug)) errors.push(`${prefix}: invalid slug "${d.slug}"`);
    else if (seenSlugs.has(d.slug)) errors.push(`${prefix}: duplicate slug "${d.slug}"`);
    seenSlugs.add(d.slug);
    if (!Array.isArray(d.imageQueries) || d.imageQueries.length === 0 || d.imageQueries.some((q) => typeof q !== 'string' || !q.trim())) {
      errors.push(`${prefix}: imageQueries must be a non-empty string array`);
    }

    if (!hasDate) continue; // datumsabhängige Folgechecks brauchen ein valides "MM-DD"
    if (!expected.has(d.date)) errors.push(`${prefix}: invalid date`);
    if (seenDates.has(d.date)) errors.push(`${prefix}: duplicate day ${d.date}`);
    seenDates.add(d.date);
    if (d.date.slice(0, 2) !== d.month) errors.push(`${prefix}: date belongs to another month file`);
  }
  for (const date of expected) {
    if (!seenDates.has(date)) errors.push(`days: missing day ${date}`);
  }

  const slugByMonth = {};
  for (const d of days) (slugByMonth[d.month] ??= new Set()).add(d.slug);

  for (const loc of effectiveLocales) {
    for (const mm of MONTHS) {
      const map = textsByMonth[loc]?.[mm] ?? {};
      for (const slug of slugByMonth[mm] ?? []) {
        checkText(`${loc}/${mm} ${slug}`, map[slug], errors);
      }
      for (const slug of Object.keys(map)) {
        if (!slugByMonth[mm]?.has(slug)) errors.push(`${loc}/${mm}: unknown slug "${slug}"`);
      }
    }
  }

  if (requireImages) {
    for (const d of days) {
      const file = join(imagesRoot, FUN_COUNTRY_CODE, d.slug, '01.jpg');
      if (!existsSync(file)) errors.push(`images: missing image for ${d.slug} (${file})`);
    }
  }
  return errors;
}

/** Package-Key eines Slugs (`holidays.fun_<slug>`, `images.fun_<slug>`). */
export function funKey(slug) {
  return `fun_${slug}`;
}

/**
 * Baut das FUN-Paket. `imageRefs`: { [slug]: RemoteImageRef[] }.
 * Enthält zusätzlich die Legacy-Felder `funOccasions` + `i18n.funOccasions`,
 * die installierte App-Versionen (Heute-Karte) noch lesen — eine Paketgeneration
 * lang, danach entfernen.
 */
export function buildFunPackage(data, { version, imageRefs = {} }) {
  if (!Number.isInteger(version) || version < 1) throw new Error('version must be a positive integer');
  const { days, texts } = data;
  const locales = data.locales ?? FUN_LOCALES;
  const definitions = [];
  const holidays = {};
  const holidayInfo = {};
  const funOccasions = {};
  const legacyLabels = {};
  const images = {};

  for (const d of [...days].sort((a, b) => a.date.localeCompare(b.date))) {
    const key = funKey(d.slug);
    const [mm, dd] = d.date.split('-').map(Number);
    definitions.push({
      id: `FUN_${d.slug}`,
      countryCode: FUN_COUNTRY_CODE,
      kind: 'fixed',
      labelKey: `holidays.${key}`,
      iconName: 'party-popper',
      category: 'observance',
      rule: { type: 'fixed', month: mm, day: dd },
    });
    for (const loc of locales) {
      const entry = texts[loc]?.[d.slug];
      if (!entry) continue;
      (holidays[loc] ??= {})[key] = entry.label;
      (holidayInfo[loc] ??= {})[key] = { intro: entry.intro, funFacts: [...entry.funFacts] };
      (legacyLabels[loc] ??= {})[d.slug] = entry.label;
    }
    funOccasions[d.date] = [{ id: key, labelKey: `funOccasions.${d.slug}` }];
    if (imageRefs[d.slug]?.length) images[key] = imageRefs[d.slug];
  }

  return {
    countryCode: FUN_COUNTRY_CODE,
    version,
    schemaVersion: 1,
    definitions,
    funOccasions,
    i18n: { holidays, holidayInfo, funOccasions: legacyLabels },
    ...(Object.keys(images).length > 0 ? { images } : {}),
  };
}

/**
 * Bild-Targets der kuratierten kuriosen Feiertage für `fetch-images.mjs --fun`:
 * 1 Bild, 1024 px, Terms aus `days/<MM>.json`. Nur `days` wird gebraucht, daher
 * genügt eine einzelne Locale ('en') beim Laden. Tage mit ungültigem Slug
 * werden übersprungen (gewarnt statt geworfen — ein einzelner kaputter Tag soll
 * den restlichen Bild-Fetch nicht blockieren).
 */
export async function funImageTargets(contentRoot) {
  const { days } = await loadFunDays(contentRoot, ['en']);
  const targets = [];
  for (const d of days) {
    if (typeof d.slug !== 'string' || !SLUG_RE.test(d.slug)) {
      console.warn(`funImageTargets: skipping day with invalid slug "${d.slug}" (${d.date})`);
      continue;
    }
    targets.push({
      slug: d.slug,
      countryCode: FUN_COUNTRY_CODE,
      terms: d.imageQueries ?? [],
      maxImages: 1,
      thumbWidth: 1024,
      maxBytes: 1_500_000,
    });
  }
  return targets;
}
