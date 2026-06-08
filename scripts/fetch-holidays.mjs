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
import { HOLIDAY_COUNTRIES, SOURCES, PRECOMPUTE_FROM_YEAR, PRECOMPUTE_YEARS } from './config.mjs';
import { computeEasterSunday } from './lib/easter.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'data');
const PACKAGES = join(DATA, 'packages');

function ymd(date) {
  return `${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function easterOffsetForDate(year, mmdd) {
  const easter = computeEasterSunday(year);
  const [m, d] = mmdd.split('-').map(Number);
  const target = Date.UTC(year, m - 1, d);
  const base = Date.UTC(year, easter.getUTCMonth(), easter.getUTCDate());
  return Math.round((target - base) / 86400000);
}

async function listVersions(countryDir) {
  if (!existsSync(countryDir)) return [];
  const entries = await readdir(countryDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && /^v\d+$/.test(e.name))
    .map((e) => parseInt(e.name.slice(1), 10))
    .sort((a, b) => a - b);
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function buildCountry(cc) {
  const years = Array.from({ length: PRECOMPUTE_YEARS }, (_, i) => PRECOMPUTE_FROM_YEAR + i);
  // name -> { mmdd per year, isFixed, easterOffsets }
  const byName = new Map();

  for (const year of years) {
    let holidays;
    try {
      holidays = await fetchJson(SOURCES.nagerDate(year, cc));
    } catch (err) {
      console.warn(`  ${cc} ${year}: ${err.message}`);
      continue;
    }
    for (const h of holidays) {
      const key = h.name; // local name; English `name` from Nager is stable enough as a key seed
      const mmdd = h.date.slice(5);
      const entry = byName.get(key) ?? { years: {}, slug: slugify(h.name) };
      entry.years[year] = mmdd;
      byName.set(key, entry);
    }
  }

  const definitions = [];
  for (const [name, entry] of byName) {
    const id = `${cc}_${entry.slug}`;
    const yearsPresent = Object.keys(entry.years).map(Number);
    const allSameMmdd = new Set(Object.values(entry.years)).size === 1;

    if (allSameMmdd) {
      const [m, d] = Object.values(entry.years)[0].split('-').map(Number);
      definitions.push(def(id, cc, entry.slug, { type: 'fixed', month: m, day: d }));
      continue;
    }

    // Try Easter-relative: constant offset across years?
    const offsets = new Set(yearsPresent.map((y) => easterOffsetForDate(y, entry.years[y])));
    if (offsets.size === 1) {
      definitions.push(def(id, cc, entry.slug, { type: 'easter_relative', offsetDays: [...offsets][0] }));
      continue;
    }

    // Fallback: precomputed table.
    definitions.push(def(id, cc, entry.slug, { type: 'precomputed', dates: entry.years }));
  }

  await writePackage(cc, definitions);
  console.log(`  ${cc}: ${definitions.length} definitions`);
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function kindForRule(rule) {
  return rule.type === 'easter_relative'
    ? 'easter_relative'
    : rule.type === 'precomputed'
      ? 'precomputed'
      : 'fixed';
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

async function writePackage(cc, definitions) {
  const countryDir = join(PACKAGES, cc);
  const versions = await listVersions(countryDir);
  const prev = versions.at(-1);
  let preserved = {};
  if (prev != null) {
    const prevPkg = JSON.parse(
      await readFile(join(countryDir, `v${prev}`, 'package.json'), 'utf8'),
    );
    preserved = { namedays: prevPkg.namedays, i18n: prevPkg.i18n, images: prevPkg.images };
  }
  const next = (prev ?? 0) + 1;
  const dir = join(countryDir, `v${next}`);
  await mkdir(dir, { recursive: true });

  const pkg = {
    countryCode: cc,
    version: next,
    schemaVersion: 1,
    definitions,
    ...(preserved.namedays ? { namedays: preserved.namedays } : {}),
    ...(preserved.i18n ? { i18n: preserved.i18n } : {}),
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
