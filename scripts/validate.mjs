#!/usr/bin/env node
/**
 * Validates data/index.json and every country package against the JSON schemas.
 * Also runs cross-checks the schema cannot express (referential integrity).
 */
import { readFile, readdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { LOCALES, NAGER_FULL_REGION_SETS } from './config.mjs';
import { coversFullRegionSet } from './lib/nagerScope.mjs';
import { expectedFunDays, FUN_LOCALES } from './lib/funDays.mjs';
import { isCc0OrPd } from './lib/imageLicense.mjs';
import { loadCreditHints, duplicateCreditPaths } from './lib/imageCredits.mjs';
import { deliveredByteLength } from './lib/packageWriter.mjs';
import { countNamedayDays } from './lib/namedayFilter.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'data');
const SCHEMA = join(ROOT, 'schema');
const CREDITS = join(ROOT, 'CREDITS.md');

const INTRO_MAX = 280;
const FUNFACT_MAX = 160;
const FUNFACTS_RECOMMENDED_MIN = 3;
const FUNFACTS_RECOMMENDED_MAX = 5;

/**
 * FUN-Definitionen (echte HolidayDefinitions statt der reinen `funOccasions`-
 * Liste) gibt es erst ab Paketversion 5. Ältere Pakete bleiben ohne die
 * strengeren Checks unten gültig; diese Konstante kann entfernt werden,
 * sobald FUN v5 live ist und keine v<5-Pakete mehr im Umlauf sind.
 */
const FUN_DEFINITIONS_SINCE_VERSION = 5;

/**
 * Bewusst leere Kalendertage (content/fun-days/blackout.json, `{ "MM-DD": Grund }`),
 * z. B. der 27.01. (Holocaust-Gedenktag). Sie fallen aus der FUN-Erwartung
 * heraus; eine Definition an so einem Tag ist ein Fehler. Fehlt die Datei,
 * bleibt es bei allen 366 Kalendertagen.
 */
const FUN_BLACKOUT = (() => {
  const path = join(ROOT, 'content', 'fun-days', 'blackout.json');
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
})();
const FUN_EXPECTED_DAYS = new Set(expectedFunDays(FUN_BLACKOUT));

/**
 * G-6 (Audit 2026-09-20): Bewusste Einmaltermine — genau ein Jahr in der
 * `precomputed`-Tabelle, kein wiederkehrender Anlass (docs/holiday-relevance-
 * 2026-09-11.md). Sie loesen im Horizont-Check nur eine Warnung aus, damit ein
 * verstrichener Termin sichtbar bleibt, ohne CI rot zu faerben.
 */
export const ONE_OFF_HOLIDAY_IDS = new Set([
  'BG_currency_change_day', // Euro-Einfuehrung 2026 — einmalig
  'GB_world_cup_bank_holiday', // schottischer WM-Bankfeiertag 2026 (gov.scot) — einmalig
  'KR_local_election_day', // Kommunalwahl alle 4 Jahre; Nager listet nur den naechsten Termin (2026)
]);

/**
 * G-6: Wiederkehrende `precomputed`-Regeln, denen die Quelle das Folgejahr
 * (noch) nicht liefert. Befristet — nach `until` wird der Eintrag wieder zum
 * Fehler, damit die Nachbesserung nicht versandet. Nachholen per
 * `npm run build:holidays -- <CC>` (Netz, Nager.Date), nicht per Verlaengerung.
 */
export const STALE_PRECOMPUTED_ALLOWLIST = new Map([
  [
    'EG_eid_al_adha',
    {
      until: '2026-12-31',
      reason: 'Nager liefert fuer EG Eid al-Adha nur 2026 (kein tentative-Gegenstueck); build:holidays EG muss 2027+ nachholen',
    },
  ],
]);

/** Jahr/Tag fuer den Horizont-Check; per Env ueberschreibbar (Tests, Reproduktion). */
function validationClock() {
  const today = process.env.VALIDATE_TODAY ?? new Date().toISOString().slice(0, 10);
  const currentYear = Number(process.env.VALIDATE_YEAR) || Number(today.slice(0, 4));
  return { currentYear, today };
}

/**
 * G-6 / D-1: `precomputed`-Regeln muessen mindestens `currentYear + 1` tragen —
 * sonst verliert die App den Anlass ab Januar still (holidayScheduler faengt
 * den Wurf und ueberspringt). Bisher endeten 13 Regeln (TR ×7, EG ×2, AU, BG,
 * GB, KR) im laufenden Jahr, ohne dass CI es merkte.
 *
 *   - max(Jahr) >= currentYear + 1           -> ok
 *   - ID in ONE_OFF_HOLIDAY_IDS              -> Warnung (Einmaltermin, ggf. verstrichen)
 *   - ID in STALE_PRECOMPUTED_ALLOWLIST      -> Warnung bis `until`, danach Fehler
 *   - sonst                                  -> Fehler (auch bei genau einem Jahr:
 *     ein wiederkehrender Anlass mit nur einem Jahr ist genau die Luecke, die
 *     der Check finden soll; echte Einmaltermine gehoeren in ONE_OFF_HOLIDAY_IDS)
 */
export function checkPrecomputedHorizon(countryCode, pkg, errors, warnings, clock = validationClock()) {
  const { currentYear, today } = clock;
  const required = currentYear + 1;
  for (const def of pkg.definitions ?? []) {
    if (def.kind !== 'precomputed' || def.rule?.type !== 'precomputed') continue;
    const years = Object.keys(def.rule.dates ?? {}).map(Number).filter(Number.isFinite);
    if (years.length === 0) {
      errors.push(`${countryCode} ${def.id}: precomputed rule without dates`);
      continue;
    }
    const maxYear = Math.max(...years);
    if (maxYear >= required) continue;
    const span = years.length === 1 ? `nur ${maxYear}` : `${Math.min(...years)}–${maxYear}`;

    if (ONE_OFF_HOLIDAY_IDS.has(def.id)) {
      warnings.push(`${countryCode} ${def.id}: Einmaltermin (${span}), kein ${required} — entfernen, sobald verstrichen`);
      continue;
    }
    const allow = STALE_PRECOMPUTED_ALLOWLIST.get(def.id);
    if (allow && today <= allow.until) {
      warnings.push(`${countryCode} ${def.id}: precomputed endet ${maxYear} (Allowlist bis ${allow.until}: ${allow.reason})`);
      continue;
    }
    errors.push(
      `${countryCode} ${def.id}: precomputed rule ends ${maxYear} (${span}), needs ${required}` +
        (allow ? ` — Allowlist abgelaufen am ${allow.until} (${allow.reason})` : '') +
        ` — run build:holidays ${countryCode}, or list a genuine one-off in ONE_OFF_HOLIDAY_IDS`,
    );
  }
}

/**
 * G-5: `regions` (ISO-3166-2, z. B. DE-BY) muss zum Paketland gehoeren — ein
 * `DE-…` in einem AT-Paket ist ein Generatorfehler, kein Datenstand. Form
 * (Pattern, 1–64, unique) prueft das Schema; hier nur der Laenderbezug.
 */
export function checkRegions(countryCode, pkg, errors, fullSets = NAGER_FULL_REGION_SETS) {
  if (!/^[A-Z]{2}$/.test(countryCode)) return;
  const prefix = `${countryCode}-`;
  const fullSet = fullSets[countryCode];
  for (const def of pkg.definitions ?? []) {
    if (!Array.isArray(def.regions)) continue;
    const foreign = def.regions.filter((code) => typeof code !== 'string' || !code.startsWith(prefix));
    if (foreign.length > 0) {
      errors.push(`${countryCode} ${def.id}: regions ausserhalb des Pakets (${foreign.join(', ')}) — erwartet Praefix ${prefix}`);
    }
    // Sicherheitsnetz: alle Regionen des Landes = landesweit, darf kein
    // `regions` tragen (sonst in der App „regional" ohne Vorauswahl).
    if (coversFullRegionSet(def.regions, fullSet)) {
      errors.push(`${countryCode} ${def.id}: regions deckt alle ${fullSet.length} Regionen ab — landesweit, Feld weglassen (NAGER_FULL_REGION_SETS)`);
    }
  }
}

/**
 * G-11: Namenstags-Abdeckung. Unter NAMEDAY_MIN_DAYS Tagen nur eine Warnung
 * (eine Sammelzeile mit Laenderliste) — BG (101) und GR (176) sind bekannte
 * Quellenluecken bei abalin, kein Build-Fehler. `hasNamedays` bleibt ab
 * einem Tag true; die Zahl steht als `namedayDays` im Index.
 *
 * @param {Array<{code: string, days: number}>} coverage  je Land mit Namenstagen
 */
export const NAMEDAY_MIN_DAYS = 300;
export function checkNamedayCoverage(coverage, warnings) {
  const sparse = coverage
    .filter((c) => c.days > 0 && c.days < NAMEDAY_MIN_DAYS)
    .sort((a, b) => a.days - b.days || a.code.localeCompare(b.code));
  if (sparse.length === 0) return;
  warnings.push(
    `Namenstage unter ${NAMEDAY_MIN_DAYS}/366 Tagen: ${sparse.map((c) => `${c.code} ${c.days}`).join(', ')} — Quellenluecke (abalin), zweite Quelle noetig`,
  );
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function slugFromLabelKey(labelKey) {
  return labelKey.startsWith('holidays.') ? labelKey.slice('holidays.'.length) : labelKey;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function checkHolidayInfo(countryCode, pkg, errors, warnings) {
  const holidayInfo = pkg.i18n?.holidayInfo;
  if (!holidayInfo) return;

  const definedSlugs = new Set(pkg.definitions.map((d) => slugFromLabelKey(d.labelKey)));
  // The GLOBAL package intentionally ships articles without definitions (the
  // global holiday definitions are bundled in the app), so skip the
  // "slug not in definitions" cross-check when there are no definitions.
  const checkDefined = definedSlugs.size > 0;

  for (const [locale, articles] of Object.entries(holidayInfo)) {
    for (const [slug, article] of Object.entries(articles ?? {})) {
      const prefix = `${countryCode} holidayInfo.${locale}.${slug}`;

      if (checkDefined && !definedSlugs.has(slug)) {
        warnings.push(`${prefix}: article slug not in package definitions`);
      }

      if (countryCode !== 'FUN') {
        const hasHistory = typeof article.history === 'string' && article.history.trim() !== '';
        const hasTraditions =
          typeof article.traditions === 'string' && article.traditions.trim() !== '';
        if (!hasHistory || !hasTraditions) {
          errors.push(`${prefix}: full article required (history/traditions)`);
        }
      }

      if (typeof article.intro === 'string' && article.intro.length > INTRO_MAX) {
        warnings.push(`${prefix}.intro: ${article.intro.length} chars (recommended <= ${INTRO_MAX})`);
      }

      const facts = article.funFacts;
      if (Array.isArray(facts)) {
        if (facts.length < FUNFACTS_RECOMMENDED_MIN || facts.length > FUNFACTS_RECOMMENDED_MAX) {
          warnings.push(
            `${prefix}.funFacts: ${facts.length} items (recommended ${FUNFACTS_RECOMMENDED_MIN}-${FUNFACTS_RECOMMENDED_MAX})`,
          );
        }
        for (const [i, fact] of facts.entries()) {
          if (typeof fact === 'string' && fact.length > FUNFACT_MAX) {
            warnings.push(`${prefix}.funFacts[${i}]: ${fact.length} chars (recommended <= ${FUNFACT_MAX})`);
          }
        }
      }
    }
  }
}

function checkFunOccasions(pkg, errors, warnings) {
  const funOccasions = pkg.funOccasions;
  if (!funOccasions) return;

  const i18n = pkg.i18n?.funOccasions ?? {};
  const ids = new Set();

  for (const [date, list] of Object.entries(funOccasions)) {
    if ((list ?? []).length > 3) {
      errors.push(`FUN funOccasions.${date}: ${list.length} occasions (max 3)`);
    }
    for (const occ of list ?? []) {
      if (ids.has(occ.id)) errors.push(`FUN funOccasions.${date}: duplicate id ${occ.id}`);
      ids.add(occ.id);

      const slug = occ.labelKey.startsWith('funOccasions.')
        ? occ.labelKey.slice('funOccasions.'.length)
        : occ.labelKey;
      for (const locale of ['de', 'en']) {
        if (!i18n[locale]?.[slug]) {
          errors.push(`FUN funOccasions.${date}.${occ.id}: missing "${locale}" i18n for ${slug}`);
        }
      }
    }
  }
}

/**
 * FUN ab v5: jede Definition braucht Label + Artikel in allen FUN_LOCALES (ab
 * v6 alle 17 App-Sprachen, nicht nur die 12 aus LOCALES) und ein
 * Bild mit Lizenz; genau eine Definition pro erwartetem Kalendertag (366 minus
 * der Blackout-Tage aus content/fun-days/blackout.json), alle Regeln `fixed`,
 * iconName/category fest ("party-popper"/"observance").
 * Bilder ohne CC0/Public-Domain-Lizenz brauchen einen Credit.
 */
export function checkFunDefinitions(pkg, errors) {
  if (pkg.version < FUN_DEFINITIONS_SINCE_VERSION) return;
  const defs = pkg.definitions ?? [];
  const expectedCount = FUN_EXPECTED_DAYS.size;
  if (defs.length !== expectedCount) {
    errors.push(`FUN: expected ${expectedCount} definitions, got ${defs.length}`);
  }
  const expectedDays = FUN_EXPECTED_DAYS;
  const seenDays = new Set();
  const labels = pkg.i18n?.holidays ?? {};
  const info = pkg.i18n?.holidayInfo ?? {};
  for (const def of defs) {
    const key = slugFromLabelKey(def.labelKey);
    if (def.countryCode !== 'FUN') errors.push(`FUN ${def.id}: countryCode ${def.countryCode}`);
    if (def.iconName !== 'party-popper') errors.push(`FUN ${def.id}: iconName must be "party-popper"`);
    if (def.category !== 'observance') errors.push(`FUN ${def.id}: category must be "observance"`);
    if (def.rule?.type !== 'fixed') {
      errors.push(`FUN ${def.id}: rule must be fixed`);
    } else {
      const dayKey = `${pad2(def.rule.month)}-${pad2(def.rule.day)}`;
      if (FUN_BLACKOUT[dayKey] !== undefined) {
        errors.push(`FUN ${def.id}: day is blacked out (${dayKey}: ${FUN_BLACKOUT[dayKey]})`);
      } else if (!expectedDays.has(dayKey)) {
        errors.push(`FUN ${def.id}: kein gültiger Kalendertag (${dayKey})`);
      }
      if (seenDays.has(dayKey)) errors.push(`FUN ${def.id}: duplicate day ${dayKey}`);
      seenDays.add(dayKey);
    }
    for (const locale of FUN_LOCALES) {
      if (!labels[locale]?.[key]) errors.push(`FUN ${def.id}: missing "${locale}" label`);
      if (!info[locale]?.[key]) errors.push(`FUN ${def.id}: missing "${locale}" article`);
    }
    const imageList = pkg.images?.[key] ?? [];
    if (!imageList.length) errors.push(`FUN ${def.id}: missing image`);
    for (const ref of imageList) {
      const licenseIsFree = typeof ref.license === 'string' && isCc0OrPd(ref.license);
      const hasCredit = typeof ref.credit === 'string' && ref.credit.trim() !== '';
      if (!licenseIsFree && !hasCredit) {
        errors.push(`FUN ${def.id}: image credit missing for ${ref.path}`);
      }
      // Namensnennung muss beim Nutzer ankommen: Die App zeigt nur
      // `holidayInfo.<locale>.<key>.imageCredit` unter dem Bild — ein Credit,
      // der nur in CREDITS.md oder im Image-Ref steht, erfüllt CC BY/BY-SA nicht.
      if (!licenseIsFree) {
        for (const locale of FUN_LOCALES) {
          const article = info[locale]?.[key];
          if (!article) continue;
          // Ohne Credit im Ref kann der Artikel den Autor nicht nennen -> Fehler
          // (frueher: includes-Fallback mit literalem NUL-Byte, Git sah die Datei als Binaer).
          const creditShown =
            hasCredit && typeof article.imageCredit === 'string' && article.imageCredit.includes(ref.credit);
          if (!creditShown) {
            errors.push(`FUN ${def.id}: article imageCredit missing or without author in "${locale}"`);
          }
        }
      }
    }
  }
}

/**
 * G-2: CREDITS.md muss parsebar sein. Ein Zeilenende-Problem (CRLF) liess
 * loadCreditHints frueher 0 Hints liefern, worauf build-articles jedes Bild
 * stillschweigend als CC0 ohne Namensnennung schrieb. Deshalb: jede Zeile im
 * auto-generierten Block, die wie ein Credit aussieht, muss auch als Hint
 * angekommen sein — sonst Exit 1.
 */
export async function checkCreditsParsable(creditsPath, hints, errors) {
  if (!existsSync(creditsPath)) return;
  const md = await readFile(creditsPath, 'utf8');
  const block = md.match(
    /<!-- BEGIN:IMAGE-CREDITS \(auto-generated\) -->([\s\S]*?)<!-- END:IMAGE-CREDITS -->/,
  );
  if (!block) return;
  const creditLines = block[1].split(/\r?\n/).filter((line) => line.startsWith('- `'));
  if (creditLines.length > 0 && hints.size === 0) {
    errors.push(`CREDITS.md: ${creditLines.length} credit lines but 0 parsed (line endings? format?)`);
    return;
  }
  for (const line of creditLines) {
    const path = /^- `([^`]+)`/.exec(line)?.[1];
    if (!path || !hints.has(path)) errors.push(`CREDITS.md: unparsable credit line: ${line}`);
  }
}

/**
 * G-10: Bilddateien, deren Herkunft sich (noch) nicht belegen laesst. Beim
 * Nachtragen der CREDITS-Zeilen (2026-09-20) liessen sich 5 von 216 Dateien
 * ueber die Commons-API weder byte- noch bildgleich wiederfinden (vermutlich
 * Openverse-Treffer ausserhalb von Commons; der Fetcher schrieb damals fuer
 * CC0/PD keine Zeile). Lizenz und Urheber werden NICHT geraten: die Dateien
 * haben bewusst keine Zeile und loesen bis `until` nur eine Warnung aus, danach
 * wieder einen Fehler. Aufloesen = Quelle belegen und Zeile eintragen ODER das
 * Bild ersetzen/entfernen (`curate-images.mjs drop`), nicht die Frist schieben.
 */
export const UNVERIFIED_IMAGE_PROVENANCE = new Map(
  [
    'images/AU/melbourne_cup/01.jpg',
    'images/BR/independence_day/01.jpg',
    'images/GB/early_may_bank_holiday/03.jpg',
    'images/NZ/canterbury_anniversary_day/02.jpg',
    'images/TR/ataturk_commemoration_youth_day/01.jpg',
  ].map((path) => [path, { until: '2026-10-31', reason: 'Quelle ueber Commons nicht auffindbar (Audit G-10)' }]),
);

const IMAGE_FILE_RE = /\.(jpe?g|png|webp)$/i;
const THUMB_FILE_RE = /\.thumb\.jpe?g$/i;

/**
 * G-10: Jede Bilddatei unter data/images braucht GENAU EINE CREDITS-Zeile —
 * auch CC0/Public Domain. Vorher schrieben die Fetcher nur fuer CC BY/BY-SA
 * eine Zeile; eine verlorene Zeile war damit von „CC0" nicht zu unterscheiden
 * (22 der 216 zeilenlosen Dateien waren in Wahrheit CC BY/BY-SA). Umgekehrt
 * ist eine Zeile ohne Datei ein Ueberbleibsel (geloeschtes Bild).
 * Thumbnail-Sidecars (`NN.thumb.jpg`) sind abgeleitet und brauchen keine Zeile.
 */
export async function checkCreditsCoverage(imagesRoot, creditHints, errors, warnings, { allowlist = UNVERIFIED_IMAGE_PROVENANCE, today = validationClock().today, duplicates = [] } = {}) {
  for (const path of duplicates) errors.push(`CREDITS.md: mehrere Zeilen fuer ${path} — genau eine je Bilddatei`);
  if (!existsSync(imagesRoot)) return;
  const entries = await readdir(imagesRoot, { recursive: true });
  const files = new Set(
    entries
      .map((e) => `images/${e.split(sep).join('/')}`)
      .filter((f) => IMAGE_FILE_RE.test(f) && !THUMB_FILE_RE.test(f)),
  );
  for (const file of [...files].sort()) {
    if (creditHints.has(file)) {
      if (allowlist.has(file)) errors.push(`${file}: hat eine CREDITS-Zeile — aus UNVERIFIED_IMAGE_PROVENANCE streichen`);
      continue;
    }
    const allow = allowlist.get(file);
    if (allow && today <= allow.until) {
      warnings.push(`${file}: keine CREDITS-Zeile, Herkunft unbelegt (Frist ${allow.until}: ${allow.reason})`);
    } else {
      errors.push(
        `${file}: Bilddatei ohne CREDITS-Zeile (auch CC0/PD braucht eine)` +
          (allow ? ` — Frist ${allow.until} abgelaufen (${allow.reason})` : ''),
      );
    }
  }
  for (const path of [...creditHints.keys()].sort()) {
    if (!files.has(path)) errors.push(`CREDITS.md: Zeile ohne Bilddatei: ${path}`);
  }
  for (const path of allowlist.keys()) {
    if (!files.has(path)) errors.push(`UNVERIFIED_IMAGE_PROVENANCE: ${path} existiert nicht mehr — Eintrag streichen`);
  }
}

/**
 * G-2 (b): Ein Bild-Ref, dessen Datei eine CREDITS-Zeile hat, muss deren
 * Lizenz und Credit-Text tragen. MEMORIAL schreibt den Credit als
 * "<Autor> · <Lizenz>" (build-memorial.mjs), alle anderen Pakete 1:1.
 */
function checkImageCredit(countryCode, slug, ref, creditHints, errors) {
  const hint = creditHints.get(ref.path);
  if (!hint) return;
  if (ref.license !== hint.license) {
    errors.push(
      `${countryCode} images.${slug}: license "${ref.license}" != CREDITS.md "${hint.license}" for ${ref.path}`,
    );
  }
  const creditOk =
    typeof ref.credit === 'string' &&
    (ref.credit === hint.credit || ref.credit === `${hint.credit} · ${hint.license}`);
  if (!creditOk) {
    errors.push(
      `${countryCode} images.${slug}: credit "${ref.credit ?? ''}" != CREDITS.md "${hint.credit}" for ${ref.path}`,
    );
  }
}

function checkImages(countryCode, pkg, errors, creditHints = new Map()) {
  const images = pkg.images;
  if (!images) return;

  for (const [slug, refs] of Object.entries(images)) {
    const list = refs ?? [];
    for (const ref of list) {
      const abs = join(DATA, ref.path);
      // #129: Pfad-Traversal-Guard — der aufgeloeste Pfad MUSS unter data/ bleiben.
      const rel = relative(DATA, abs);
      if (rel.startsWith('..') || rel.startsWith(sep) || /(^|[/\\])\.\.([/\\]|$)/.test(ref.path)) {
        errors.push(`${countryCode} images.${slug}: unsafe path escapes data/ (${ref.path})`);
        continue;
      }
      if (!existsSync(abs)) {
        errors.push(`${countryCode} images.${slug}: missing file ${ref.path}`);
      }
      checkImageCredit(countryCode, slug, ref, creditHints, errors);
    }
    if (list.length > 1 && !list.some((r) => r.primary)) {
      errors.push(`${countryCode} images.${slug}: no primary image marked`);
    }
  }
}

async function main() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv); // #133: aktiviert format:uri / date-time (sonst no-op in AJV v8)
  const indexSchema = await readJson(join(SCHEMA, 'index.schema.json'));
  const packageSchema = await readJson(join(SCHEMA, 'package.schema.json'));
  const validateIndex = ajv.compile(indexSchema);
  const validatePackage = ajv.compile(packageSchema);

  const errors = [];
  const warnings = [];

  const creditHints = await loadCreditHints(CREDITS);
  await checkCreditsParsable(CREDITS, creditHints, errors);
  await checkCreditsCoverage(join(DATA, 'images'), creditHints, errors, warnings, {
    duplicates: await duplicateCreditPaths(CREDITS),
  });

  const index = await readJson(join(DATA, 'index.json'));
  if (!validateIndex(index)) {
    errors.push(`index.json: ${ajv.errorsText(validateIndex.errors)}`);
  }

  // G-9: sizeBytes im Manifest muss zur ausgelieferten Datei passen (LF-Bytes,
  // siehe deliveredByteLength) — die App plant damit ihr Disk-Budget.
  async function checkSizeBytes(code, entry) {
    const abs = join(DATA, entry.package);
    if (!existsSync(abs)) return;
    const actual = deliveredByteLength(await readFile(abs, 'utf8'));
    if (entry.sizeBytes !== actual) {
      errors.push(`${code}: index sizeBytes ${entry.sizeBytes} != ${actual} (${entry.package}) — run build:index`);
    }
  }

  const namedayCoverage = [];
  for (const country of index.countries ?? []) {
    const pkgPath = join(DATA, country.package);
    if (!existsSync(pkgPath)) {
      errors.push(`${country.code}: package missing at ${country.package}`);
      continue;
    }
    await checkSizeBytes(country.code, country);
    const pkg = await readJson(pkgPath);
    if (!validatePackage(pkg)) {
      errors.push(`${country.code}: ${ajv.errorsText(validatePackage.errors)}`);
      continue;
    }
    if (pkg.countryCode !== country.code) {
      errors.push(`${country.code}: countryCode mismatch (${pkg.countryCode})`);
    }
    if (pkg.version !== country.version) {
      errors.push(`${country.code}: version mismatch (index ${country.version} vs pkg ${pkg.version})`);
    }
    const ids = new Set();
    for (const def of pkg.definitions) {
      if (ids.has(def.id)) errors.push(`${country.code}: duplicate definition id ${def.id}`);
      ids.add(def.id);
    }

    // G-11: Index-Felder muessen zum Paket passen (sonst build:index vergessen).
    const namedayDays = countNamedayDays(pkg.namedays);
    if (country.namedayDays !== undefined && country.namedayDays !== namedayDays) {
      errors.push(`${country.code}: index namedayDays ${country.namedayDays} != ${namedayDays} — run build:index`);
    }
    if (country.hasNamedays !== undefined && country.hasNamedays !== namedayDays > 0) {
      errors.push(`${country.code}: index hasNamedays ${country.hasNamedays} != ${namedayDays > 0} — run build:index`);
    }
    if (namedayDays > 0) namedayCoverage.push({ code: country.code, days: namedayDays });

    checkRegions(country.code, pkg, errors);
    checkPrecomputedHorizon(country.code, pkg, errors, warnings);
    checkHolidayInfo(country.code, pkg, errors, warnings);
    checkImages(country.code, pkg, errors, creditHints);
  }
  checkNamedayCoverage(namedayCoverage, warnings);

  // The GLOBAL package (global holiday articles + hero images, no definitions)
  // lives outside `countries` under the top-level `global` field.
  if (index.global) {
    const g = index.global;
    const pkgPath = join(DATA, g.package);
    if (!existsSync(pkgPath)) {
      errors.push(`GLOBAL: package missing at ${g.package}`);
    } else {
      await checkSizeBytes('GLOBAL', g);
      const pkg = await readJson(pkgPath);
      if (!validatePackage(pkg)) {
        errors.push(`GLOBAL: ${ajv.errorsText(validatePackage.errors)}`);
      } else {
        if (pkg.countryCode !== 'GLOBAL') {
          errors.push(`GLOBAL: countryCode mismatch (${pkg.countryCode})`);
        }
        if (pkg.version !== g.version) {
          errors.push(`GLOBAL: version mismatch (index ${g.version} vs pkg ${pkg.version})`);
        }
        checkHolidayInfo('GLOBAL', pkg, errors, warnings);
        checkImages('GLOBAL', pkg, errors, creditHints);
      }
    }
  }

  // Das MEMORIAL-Paket (Gedenktage) lebt unter `memorial`; bisher lief es nur
  // durch die Schema-Inventur unten — jetzt auch Version/sizeBytes/Bild-Credits.
  if (index.memorial) {
    const m = index.memorial;
    const pkgPath = join(DATA, m.package);
    if (!existsSync(pkgPath)) {
      errors.push(`MEMORIAL: package missing at ${m.package}`);
    } else {
      await checkSizeBytes('MEMORIAL', m);
      const pkg = await readJson(pkgPath);
      if (!validatePackage(pkg)) {
        errors.push(`MEMORIAL: ${ajv.errorsText(validatePackage.errors)}`);
      } else {
        if (pkg.countryCode !== 'MEMORIAL') {
          errors.push(`MEMORIAL: countryCode mismatch (${pkg.countryCode})`);
        }
        if (pkg.version !== m.version) {
          errors.push(`MEMORIAL: version mismatch (index ${m.version} vs pkg ${pkg.version})`);
        }
        checkPrecomputedHorizon('MEMORIAL', pkg, errors, warnings);
        checkImages('MEMORIAL', pkg, errors, creditHints);
      }
    }
  }

  // The FUN package (global "quirky occasions" calendar, no definitions) lives
  // outside `countries` under the top-level `funOccasions` field.
  if (index.funOccasions) {
    const f = index.funOccasions;
    const pkgPath = join(DATA, f.package);
    if (!existsSync(pkgPath)) {
      errors.push(`FUN: package missing at ${f.package}`);
    } else {
      await checkSizeBytes('FUN', f);
      const pkg = await readJson(pkgPath);
      if (!validatePackage(pkg)) {
        errors.push(`FUN: ${ajv.errorsText(validatePackage.errors)}`);
      } else {
        if (pkg.countryCode !== 'FUN') {
          errors.push(`FUN: countryCode mismatch (${pkg.countryCode})`);
        }
        if (pkg.version !== f.version) {
          errors.push(`FUN: version mismatch (index ${f.version} vs pkg ${pkg.version})`);
        }
        checkFunOccasions(pkg, errors, warnings);
        checkFunDefinitions(pkg, errors);
        checkHolidayInfo('FUN', pkg, errors, warnings);
        checkImages('FUN', pkg, errors, creditHints);
      }
    }
  }

  // #132: Bisher validierte nur, was index.json referenziert. Hier zusaetzlich
  // JEDES Paket auf dem Dateisystem (inkl. aufbewahrter aelterer v<N>-Versionen,
  // die der Client per Pfad noch erreichen koennte) gegen das Schema pruefen —
  // damit keine Schema-Verstoesse unbemerkt im Repo liegen.
  const PKG_ROOT = join(DATA, 'packages');
  if (existsSync(PKG_ROOT)) {
    const entries = await readdir(PKG_ROOT, { recursive: true });
    const pkgFiles = entries.filter((e) => e.endsWith('package.json'));
    for (const relPath of pkgFiles) {
      let pkg;
      try {
        pkg = await readJson(join(PKG_ROOT, relPath));
      } catch (e) {
        errors.push(`FS packages/${relPath}: invalid JSON (${e.message})`);
        continue;
      }
      if (!validatePackage(pkg)) {
        errors.push(`FS packages/${relPath}: ${ajv.errorsText(validatePackage.errors)}`);
      }
    }
    console.log(`Filesystem inventory: ${pkgFiles.length} package(s) schema-checked.`);
  }

  if (warnings.length > 0) {
    console.warn('Validation warnings:\n' + warnings.map((w) => `  - ${w}`).join('\n'));
  }

  if (errors.length > 0) {
    console.error('Validation failed:\n' + errors.map((e) => `  - ${e}`).join('\n'));
    process.exit(1);
  }
  console.log('All packages valid.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
