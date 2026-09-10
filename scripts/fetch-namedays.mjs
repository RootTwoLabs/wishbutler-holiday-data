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
import { fetchWithTimeout, FailureBudget } from './lib/httpClient.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGES = join(__dirname, '..', 'data', 'packages');

/** Strings abalin returns that are not personal names. */
const NON_NAME = /^(n\/a|support ukraine)/i;

// abalin drosselt auf 60 Requests/Minute (Header x-ratelimit-limit: 60). Ohne
// Pacing liefert der Endpoint ab Tag 61 nur noch 429 — die Run vom 2026-09-01
// hat so Namenstags-Tabellen mit 60 statt 366 Tagen veroeffentlicht.
const PACE_MS = Number(process.env.NAMEDAY_PACE_MS ?? 1050);
const RATE_LIMIT_WAIT_MS = 61_000;
const MAX_429_RETRIES = 3;
// Harter Abbruch, wenn zu viele Tage fehlen (wie fetch-holidays.mjs) — lieber
// ein roter Build als stille Luecken im Release.
const fetchBudget = new FailureBudget({ maxFailureRate: 0.1, minSamples: 30 });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// #130: Timeout + Retry/Backoff statt nacktem fetch; 429 wartet das
// Rate-Limit-Fenster ab (Retry-After, sonst 61 s) statt sofort aufzugeben.
async function fetchJson(url) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetchWithTimeout(url, { timeoutMs: 15000, retries: 2, backoffMs: 500 });
    if (res.status === 429 && attempt < MAX_429_RETRIES) {
      const retryAfter = Number(res.headers.get('retry-after'));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : RATE_LIMIT_WAIT_MS;
      console.warn(`  429 rate limit — warte ${Math.round(waitMs / 1000)} s (Versuch ${attempt + 1}/${MAX_429_RETRIES})`);
      await sleep(waitMs);
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
  }
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
        fetchBudget.success();
      } catch (err) {
        fetchBudget.failure();
        console.warn(`  ${pad(month)}-${pad(day)}: ${err.message}`);
        fetchBudget.assertWithinBudget('fetch-namedays');
        continue;
      } finally {
        await sleep(PACE_MS);
      }
      const data = json?.data ?? {};
      const mmdd = `${pad(month)}-${pad(day)}`;
      for (const cc of wanted) {
        const names = parseNames(data[cc.toLowerCase()]);
        if (names.length > 0) maps[cc][mmdd] = names;
      }
    }
  }
  fetchBudget.assertWithinBudget('fetch-namedays');

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
    // Nie eine vollstaendigere Tabelle durch eine lueckenhaftere ersetzen
    // (Teil-Ausfall der Quelle) — die vorhandene bleibt dann stehen.
    const existing = Object.keys(pkg.namedays ?? {}).length;
    if (entries < existing) {
      console.warn(`  ${cc}: nur ${entries} Tage geholt, behalte vorhandene ${existing}`);
      continue;
    }
    pkg.namedays = maps[cc];
    await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    console.log(`  ${cc}: ${entries} nameday entries`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
