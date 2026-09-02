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
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  HOLIDAY_COUNTRIES,
  SOURCES,
  PRECOMPUTE_FROM_YEAR,
  PRECOMPUTE_YEARS,
  localeForCountry,
  GLOBAL_RULES,
  HOLIDAY_SLUG_ALIASES,
} from './config.mjs';
import { detectRule } from './lib/ruleDetection.mjs';
import { fetchJsonWithTimeout, FailureBudget } from './lib/httpClient.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'data');
const PACKAGES = join(DATA, 'packages');

async function listVersions(countryDir) {
  if (!existsSync(countryDir)) return [];
  const entries = await readdir(countryDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && /^v\d+$/.test(e.name))
    .map((e) => parseInt(e.name.slice(1), 10))
    .sort((a, b) => a - b);
}

// #130: Timeout + Retry/Backoff statt nacktem fetch (kein unbegrenztes Haengen).
async function fetchJson(url) {
  return fetchJsonWithTimeout(url, { timeoutMs: 15000, retries: 2, backoffMs: 500 });
}

// #130: Fehlerquote ueber den gesamten Lauf budgetieren — bei zu vielen
// fehlgeschlagenen Fetches scheitert der Build hart statt stille Luecken zu schreiben.
const fetchBudget = new FailureBudget({ maxFailureRate: 0.25, minSamples: 10 });

async function buildCountry(cc) {
  const years = Array.from({ length: PRECOMPUTE_YEARS }, (_, i) => PRECOMPUTE_FROM_YEAR + i);
  // name -> { mmdd per year, isFixed, easterOffsets }
  const byName = new Map();

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
      const key = h.name;
      const mmdd = h.date.slice(5);
      const entry =
        byName.get(key) ??
        { years: {}, slug: slugify(h.name), name: h.name, localName: h.localName };
      entry.years[year] = mmdd;
      if (!entry.localName && h.localName) entry.localName = h.localName;
      byName.set(key, entry);
    }
  }

  const nativeLocale = localeForCountry(cc);
  const enLabels = {};
  const nativeLabels = {};

  const definitions = [];
  for (const [, entry] of byName) {
    const rule = detectRule(entry);
    const id = `${cc}_${entry.slug}`;

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

    definitions.push(def(id, cc, labelSlug, rule));

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

  await writePackage(cc, definitions, labels);
  console.log(
    `  ${cc}: ${definitions.length} definitions, labels: ${Object.keys(labels).join('+') || 'none'}`,
  );
}

function rulesEqual(a, b) {
  if (a.type !== b.type) return false;
  if (a.type === 'fixed') return a.month === b.month && a.day === b.day;
  if (a.type === 'easter_relative') return a.offsetDays === b.offsetDays;
  return false;
}

// detectRule + Helfer (inkl. #134-Rueckverprobung) liegen jetzt in lib/ruleDetection.mjs.

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/['\u2019\u2018]/g, '') // drop apostrophes so "New Year's" -> "new_years"
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function kindForRule(rule) {
  // rule.type is one of: fixed | easter_relative | nth_weekday | precomputed,
  // which maps 1:1 onto the HolidayKind used by the app.
  return rule.type;
}

function def(id, cc, slug, rule) {
  return {
    id,
    countryCode: cc,
    kind: kindForRule(rule),
    labelKey: `holidays.${slug}`,
    iconName: 'event',
    category: 'public',
    rule,
  };
}

async function writePackage(cc, definitions, labels) {
  const countryDir = join(PACKAGES, cc);
  const versions = await listVersions(countryDir);
  const prev = versions.at(-1);
  // Editorial content that the generator cannot derive is carried forward from
  // the latest version: namedays, curated images, and hand-written articles
  // (`i18n.holidayInfo`). Holiday *labels* (`i18n.holidays`) are always
  // regenerated from Nager so they stay in sync with the (slug) labelKeys.
  let preserved = {};
  if (prev != null) {
    const prevPkg = JSON.parse(
      await readFile(join(countryDir, `v${prev}`, 'package.json'), 'utf8'),
    );
    preserved = {
      namedays: prevPkg.namedays,
      images: prevPkg.images,
      holidayInfo: prevPkg.i18n?.holidayInfo,
    };
  }
  const next = (prev ?? 0) + 1;
  const dir = join(countryDir, `v${next}`);
  await mkdir(dir, { recursive: true });

  const i18n = { holidays: labels };
  if (preserved.holidayInfo) i18n.holidayInfo = preserved.holidayInfo;

  const pkg = {
    countryCode: cc,
    version: next,
    schemaVersion: 1,
    definitions,
    ...(preserved.namedays ? { namedays: preserved.namedays } : {}),
    i18n,
    ...(preserved.images ? { images: preserved.images } : {}),
  };
  await writeFile(join(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

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
