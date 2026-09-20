#!/usr/bin/env node
/**
 * Generates / refreshes public-holiday definitions per country.
 *
 * Strategy:
 *   1. Pull Nager.Date for a span of years (keyless, ~110 countries).
 *   2. Detect closed-form rules where possible (fixed date, Easter-relative)
 *      so the client can compute any year offline.
 *   3. Fall back to `precomputed` (year -> MM-DD) tables for everything else
 *      (movable feasts Nager doesn't tie to Easter, regional specials, …).
 *
 * Writes/updates data/packages/<CC>/v<next>/package.json, preserving any
 * hand-curated i18n/images already present in the latest version.
 *
 * NOTE: This is the Phase 4b generator skeleton. The rule-detection heuristics
 * (Easter offset detection, dedupe vs. global set) are intentionally minimal
 * here and are expanded in the data repo's own iteration.
 */
import {
  HOLIDAY_COUNTRIES,
  SOURCES,
  PRECOMPUTE_FROM_YEAR,
  PRECOMPUTE_YEARS,
  localeForCountry,
  GLOBAL_RULES,
  HOLIDAY_SLUG_ALIASES,
  NAGER_FULL_REGION_SETS,
  NAGER_REGIONAL_SPLITS,
  canonicalNagerName,
} from './config.mjs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { detectRule, pickHolidayStart, rulesEqual } from './lib/ruleDetection.mjs';
import { fetchJsonWithTimeout, FailureBudget } from './lib/httpClient.mjs';
import { holidayDefinition, writePackage } from './lib/packageWriter.mjs';
import { isSelectedHoliday } from './lib/holidaySelection.mjs';
import { slugify, stripTentativeSuffix } from './lib/nagerSlug.mjs';
import { newScope, collectScope, resolveScope, regionalSplitFor } from './lib/nagerScope.mjs';

/**
 * Optionaler Antwort-Cache fuer Reproduktion ohne Netz (`NAGER_CACHE_DIR=<dir>`):
 * jede Jahresantwort wird einmal geholt und danach aus dem Verzeichnis gelesen.
 * Nur fuer lokale Wiederholungslaeufe gedacht (z. B. nach einer Aenderung an
 * der Ausschlussliste) — CI setzt die Variable nicht und holt immer frisch.
 */
const NAGER_CACHE_DIR = process.env.NAGER_CACHE_DIR || null;

// #130: Timeout + Retry/Backoff statt nacktem fetch (kein unbegrenztes Haengen).
async function fetchJson(url) {
  const cacheFile = NAGER_CACHE_DIR ? join(NAGER_CACHE_DIR, `${encodeURIComponent(url)}.json`) : null;
  if (cacheFile && existsSync(cacheFile)) return JSON.parse(await readFile(cacheFile, 'utf8'));
  const json = await fetchJsonWithTimeout(url, { timeoutMs: 15000, retries: 2, backoffMs: 500 });
  if (cacheFile) {
    await mkdir(NAGER_CACHE_DIR, { recursive: true });
    await writeFile(cacheFile, JSON.stringify(json), 'utf8');
  }
  return json;
}

// #130: Fehlerquote ueber den gesamten Lauf budgetieren — bei zu vielen
// fehlgeschlagenen Fetches scheitert der Build hart statt stille Luecken zu schreiben.
const fetchBudget = new FailureBudget({ maxFailureRate: 0.25, minSamples: 10 });

async function buildCountry(cc) {
  const years = Array.from({ length: PRECOMPUTE_YEARS }, (_, i) => PRECOMPUTE_FROM_YEAR + i);
  // name -> { mmdd per year, isFixed, easterOffsets }
  const byName = new Map();
  const matchedSplits = new Set();

  for (const year of years) {
    let holidays;
    try {
      holidays = await fetchJson(SOURCES.nagerDate(year, cc));
      fetchBudget.success();
    } catch (err) {
      fetchBudget.failure();
      console.warn(`  ${cc} ${year}: ${err.message}`);
      continue;
    }
    for (const h of holidays) {
      // English `name` is the stable key seed across years; `localName` is the
      // native-language label we surface to users in their locale.
      // G-6: "(tentative date)" ist kein eigener Anlass — Suffix weg, damit
      // bestaetigte und vorlaeufige Jahre in EINER Definition landen.
      // NAGER_NAME_ALIASES: jahrweise Umbenennungen (PE) auf den etablierten
      // Namen zurueckfuehren, sonst zerfaellt der Anlass in zwei Definitionen.
      const baseName = canonicalNagerName(cc, stripTentativeSuffix(h.name));
      // NAGER_REGIONAL_SPLITS: gleicher Name, aber je Landesteil ein anderer
      // Termin (GB Summer Bank Holiday: Schottland erster, Rest letzter Montag
      // im August) -> die regionale Zeile wird eine eigene Definition.
      const split = regionalSplitFor(NAGER_REGIONAL_SPLITS[cc], baseName, h);
      if (split) matchedSplits.add(split.name);
      const name = split ? split.name : baseName;
      const key = name;
      const mmdd = h.date.slice(5);
      const entry =
        byName.get(key) ??
        {
          years: {},
          observed: {},
          slug: slugify(name),
          name,
          // Der Split traegt seinen eigenen Namen auch als natives Label (GB: en).
          localName: split ? split.name : stripTentativeSuffix(h.localName),
          expectedRule: split?.rule,
          scope: newScope(),
        };
      // Gleicher Name kann pro Jahr mehrfach kommen (mehrtaegiges Fest ODER
      // regionale Varianten) — erst alle Tage sammeln, unten aufloesen.
      (entry.observed[year] ??= []).push(mmdd);
      // G-5: global/counties/types ueber alle Jahre und Zeilen sammeln
      // (landesweit gewinnt, Regionen werden vereinigt, Public gewinnt).
      collectScope(entry.scope, h);
      if (!entry.localName && h.localName) entry.localName = stripTentativeSuffix(h.localName);
      byName.set(key, entry);
    }
  }
  // Mehrtaegige Feste (Eid al-Adha, Chuseok, Karneval …) -> ERSTER Tag;
  // regionale Varianten an verschiedenen Tagen -> unveraendert letzter Eintrag.
  for (const entry of byName.values()) {
    for (const [year, mmdds] of Object.entries(entry.observed)) {
      entry.years[year] = pickHolidayStart(Number(year), mmdds);
    }
  }

  // Ein konfigurierter Split, den keine Zeile mehr trifft, heisst: Nager hat die
  // Struktur geaendert — die Split-ID wuerde still aus dem Paket verschwinden.
  for (const splits of Object.values(NAGER_REGIONAL_SPLITS[cc] ?? {})) {
    for (const split of splits) {
      if (!matchedSplits.has(split.name)) {
        console.warn(`  ${cc}: NAGER_REGIONAL_SPLITS „${split.name}" ohne Treffer — Nager-Struktur geaendert?`);
      }
    }
  }

  const nativeLocale = localeForCountry(cc);
  const enLabels = {};
  const nativeLabels = {};

  const definitions = [];
  for (const [, entry] of byName) {
    const id = `${cc}_${entry.slug}`;
    if (!isSelectedHoliday(id)) continue;
    const rule = detectRule(entry, { expectedYears: years });
    // Bewusst Wortvergleich statt rulesEqual: das kennt (fuer den Global-Merge)
    // nur fixed/easter_relative und wuerde nth_weekday immer als ungleich melden.
    if (entry.expectedRule && JSON.stringify(rule) !== JSON.stringify(entry.expectedRule)) {
      console.warn(`  ${id}: Regel ${JSON.stringify(rule)} weicht von NAGER_REGIONAL_SPLITS ab (${JSON.stringify(entry.expectedRule)}) — Nager-Daten pruefen`);
    }

    // Merge onto a bundled global holiday only when an alias AND the exact rule
    // match (so e.g. NZ "Labour Day" in October never collapses onto May 1st).
    const canonical = HOLIDAY_SLUG_ALIASES[entry.slug] ?? entry.slug;
    const isGlobal =
      GLOBAL_RULES[canonical] && rulesEqual(rule, GLOBAL_RULES[canonical]);

    let labelSlug;
    if (isGlobal) {
      labelSlug = canonical;
    } else if (GLOBAL_RULES[entry.slug]) {
      // Same name as a global holiday but a different rule (e.g. NZ "Labour Day"
      // in October): use a country-scoped key so the app doesn't dedupe it onto
      // the global one.
      labelSlug = `${entry.slug}_${cc.toLowerCase()}`;
    } else {
      labelSlug = entry.slug;
    }

    // G-5: Regionale Feiertage bekommen `regions` (Nager counties) und die
    // Kategorie folgt den Nager-Typen. Der labelKey-Merge oben bleibt davon
    // unberuehrt — ein regionaler Fronleichnam nutzt weiter die gebuendelte
    // Uebersetzung `holidays.corpus_christi`, traegt aber `regions`.
    const { category, regions } = resolveScope(entry.scope, {
      warn: (msg) => console.warn(`  ${id}: ${msg}`),
      fullSet: NAGER_FULL_REGION_SETS[cc], // alle Regionen des Landes = landesweit
    });
    definitions.push(holidayDefinition({ id, countryCode: cc, slug: labelSlug, rule, category, regions }));

    // Global holidays reuse the app's bundled (fully translated) labels/articles,
    // so we only emit package labels for genuinely country-specific holidays.
    // Labels are keyed by labelSlug so they line up with the labelKey/articleKey.
    if (!isGlobal) {
      if (entry.name) enLabels[labelSlug] = entry.name;
      if (nativeLocale !== 'en' && entry.localName) nativeLabels[labelSlug] = entry.localName;
    }
  }

  if (definitions.length === 0) {
    console.warn(`  ${cc}: no holidays returned, skipping`);
    return;
  }

  const labels = {};
  if (Object.keys(enLabels).length > 0) labels.en = enLabels;
  if (Object.keys(nativeLabels).length > 0) labels[nativeLocale] = nativeLabels;

  // G-4: writePackage legt nur bei Inhaltsaenderung eine neue Version an.
  const { version, changed } = await writePackage(cc, definitions, labels);
  console.log(
    `  ${cc}: v${version}${changed ? ' (neu)' : ' (unveraendert)'}, ${definitions.length} definitions, labels: ${Object.keys(labels).join('+') || 'none'}`,
  );
}

// detectRule, rulesEqual + Helfer (inkl. #134-Rueckverprobung und G-1
// Ersatztag-Toleranz) liegen in lib/ruleDetection.mjs — geteilt mit
// migrate-observed-rules.mjs. slugify/stripTentativeSuffix (G-6) liegen in
// lib/nagerSlug.mjs — geteilt mit migrate-tentative-rules.mjs.

// holidayDefinition + writePackage (inkl. Uebernahme von Namenstagen/Bildern/
// Artikeln aus der Vorversion) liegen in lib/packageWriter.mjs — geteilt mit
// dem Hebcal-Generator (fetch-holidays-hebcal.mjs, Israel).

async function main() {
  const only = process.argv.slice(2);
  const countries = only.length > 0 ? only : HOLIDAY_COUNTRIES;
  console.log(`Building holidays for ${countries.length} countries...`);
  for (const cc of countries) {
    await buildCountry(cc);
  }
  // #130: Bei zu hoher Fetch-Fehlerquote hart abbrechen statt stiller Datenluecken.
  fetchBudget.assertWithinBudget('fetch-holidays');
  console.log(`Fetched ${fetchBudget.ok}/${fetchBudget.total} year-requests OK.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
