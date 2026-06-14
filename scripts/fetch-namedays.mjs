#!/usr/bin/env node
/**
 * Generates nameday calendars (MM-DD -> [names]) and merges them into the
 * latest package per country.
 *
 * Source: abalin (https://nameday.abalin.net). The V2/date endpoint returns the
 * namedays of *all* countries for a single day, so we walk every day of a leap
 * year once and bucket the results per country in a single pass.
 *
 * Usage: node scripts/fetch-namedays.mjs [CC ...]
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NAMEDAY_COUNTRIES, SOURCES } from './config.mjs';
import { fetchJsonWithTimeout } from './lib/httpClient.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGES = join(__dirname, '..', 'data', 'packages');

/** Strings abalin returns that are not personal names. */
const NON_NAME = /^(n\/a|support ukraine)/i;

// #130: Timeout + Retry/Backoff statt nacktem fetch.
async function fetchJson(url) {
  return fetchJsonWithTimeout(url, { timeoutMs: 15000, retries: 2, backoffMs: 500 });
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

const pad = (n) => String(n).padStart(2, '0');

/** Splits abalin's comma-separated string into clean personal names. */
function parseNames(raw) {
  if (typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !NON_NAME.test(s));
}

async function main() {
  const only = process.argv.slice(2);
  const wanted = (only.length > 0 ? only : NAMEDAY_COUNTRIES).map((c) => c.toUpperCase());
  console.log(`Building namedays for ${wanted.length} countries...`);

  const maps = Object.fromEntries(wanted.map((cc) => [cc, {}]));

  // Walk every day of a leap year so 02-29 is covered.
  for (let month = 1; month <= 12; month += 1) {
    const daysInMonth = new Date(Date.UTC(2024, month, 0)).getUTCDate();
    for (let day = 1; day <= daysInMonth; day += 1) {
      let json;
      try {
        json = await fetchJson(SOURCES.abalinDate(day, month));
      } catch (err) {
        console.warn(`  ${pad(month)}-${pad(day)}: ${err.message}`);
        continue;
      }
      const data = json?.data ?? {};
      const mmdd = `${pad(month)}-${pad(day)}`;
      for (const cc of wanted) {
        const names = parseNames(data[cc.toLowerCase()]);
        if (names.length > 0) maps[cc][mmdd] = names;
      }
    }
  }

  for (const cc of wanted) {
    const entries = Object.keys(maps[cc]).length;
    if (entries === 0) {
      console.warn(`  ${cc}: no namedays parsed`);
      continue;
    }
    const pkgPath = await latestPackagePath(cc);
    if (!pkgPath) {
      console.warn(`  ${cc}: no package yet, run fetch-holidays first`);
      continue;
    }
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
    pkg.namedays = maps[cc];
    await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    console.log(`  ${cc}: ${entries} nameday entries`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
