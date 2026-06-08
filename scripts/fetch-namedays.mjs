#!/usr/bin/env node
/**
 * Generates nameday calendars (MM-DD -> [names]) and merges them into the
 * latest package per country. Source: abalin (extend with country-specific
 * calendars where abalin coverage is weak).
 *
 * Usage: node scripts/fetch-namedays.mjs [CC ...]
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NAMEDAY_COUNTRIES, SOURCES } from './config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGES = join(__dirname, '..', 'data', 'packages');

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function latestPackagePath(cc) {
  const countryDir = join(PACKAGES, cc);
  if (!existsSync(countryDir)) return null;
  const versions = (await readdir(countryDir, { withFileTypes: true }))
    .filter((e) => e.isDirectory() && /^v\d+$/.test(e.name))
    .map((e) => parseInt(e.name.slice(1), 10))
    .sort((a, b) => b - a);
  if (versions.length === 0) return null;
  return join(countryDir, `v${versions[0]}`, 'package.json');
}

/**
 * Normalizes an abalin response into { "MM-DD": [names] }.
 * abalin returns per-day records; the exact shape is normalized defensively.
 */
function toNamedayMap(raw) {
  const map = {};
  const data = raw?.data ?? raw;
  if (!Array.isArray(data)) return map;
  for (const row of data) {
    const month = String(row.month ?? row.m).padStart(2, '0');
    const day = String(row.day ?? row.d).padStart(2, '0');
    const names = String(row.name ?? row.names ?? '')
      .split(/[,/]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length === 0) continue;
    map[`${month}-${day}`] = names;
  }
  return map;
}

async function buildCountry(cc) {
  const pkgPath = await latestPackagePath(cc);
  if (!pkgPath) {
    console.warn(`  ${cc}: no package yet, run fetch-holidays first`);
    return;
  }
  let namedays = {};
  try {
    namedays = toNamedayMap(await fetchJson(SOURCES.abalin(cc)));
  } catch (err) {
    console.warn(`  ${cc}: abalin failed (${err.message})`);
    return;
  }
  if (Object.keys(namedays).length === 0) {
    console.warn(`  ${cc}: no namedays parsed`);
    return;
  }
  const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
  pkg.namedays = namedays;
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log(`  ${cc}: ${Object.keys(namedays).length} nameday entries`);
}

async function main() {
  const only = process.argv.slice(2);
  const countries = only.length > 0 ? only : NAMEDAY_COUNTRIES;
  console.log(`Building namedays for ${countries.length} countries...`);
  for (const cc of countries) {
    await buildCountry(cc);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
