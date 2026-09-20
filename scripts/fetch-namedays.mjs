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
import { pathToFileURL } from 'node:url';
import { NAMEDAY_COUNTRIES, SOURCES } from './config.mjs';
import { fetchWithTimeout, FailureBudget } from './lib/httpClient.mjs';
import { readLatestPackage, writePackageIfChanged } from './lib/packageWriter.mjs';
// G-11: Nicht-Namen-Filter (Festtage, Rollenbeschreibungen, Muell) liegt in
// lib/namedayFilter.mjs — geteilt mit prune-namedays.mjs (Offline-Nachzug).
import { parseNames } from './lib/namedayFilter.mjs';

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

const pad = (n) => String(n).padStart(2, '0');

/**
 * Paket-Inhalt (ohne `version`, kanonische Feldreihenfolge wie packageWriter)
 * mit ersetzter Namenstags-Tabelle.
 */
export function withNamedays(pkg, namedays) {
  return {
    countryCode: pkg.countryCode,
    schemaVersion: pkg.schemaVersion,
    definitions: pkg.definitions,
    namedays,
    i18n: pkg.i18n ?? { holidays: {} },
    ...(pkg.images ? { images: pkg.images } : {}),
  };
}

/**
 * G-7 (a): Namenstage landen als NEUE Paketversion (writePackageIfChanged),
 * nicht mehr in-place in der letzten — eine verteilte Version aendert ihren
 * Inhalt nie. Die Regel "nie eine lueckenhaftere Tabelle uebernehmen" bleibt.
 *
 * @returns {{ status: 'no-package' | 'kept' | 'unchanged' | 'written', version?: number, prev?: number }}
 */
export async function applyNamedays(cc, namedays, { packagesDir } = {}) {
  const latest = await readLatestPackage(cc, packagesDir ? { packagesDir } : {});
  if (!latest) return { status: 'no-package' };
  const entries = Object.keys(namedays).length;
  const existing = Object.keys(latest.pkg.namedays ?? {}).length;
  // Nie eine vollstaendigere Tabelle durch eine lueckenhaftere ersetzen
  // (Teil-Ausfall der Quelle) — die vorhandene bleibt dann stehen.
  if (entries < existing) return { status: 'kept', version: latest.version, existing, entries };
  const { version, changed } = await writePackageIfChanged(
    cc,
    withNamedays(latest.pkg, namedays),
    packagesDir ? { packagesDir } : {},
  );
  return { status: changed ? 'written' : 'unchanged', version, prev: latest.version };
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
    const result = await applyNamedays(cc, maps[cc]);
    if (result.status === 'no-package') {
      console.warn(`  ${cc}: no package yet, run fetch-holidays first`);
    } else if (result.status === 'kept') {
      console.warn(`  ${cc}: nur ${entries} Tage geholt, behalte vorhandene ${result.existing}`);
    } else if (result.status === 'unchanged') {
      console.log(`  ${cc}: ${entries} nameday entries (unveraendert, v${result.version})`);
    } else {
      console.log(`  ${cc}: ${entries} nameday entries -> v${result.prev} -> v${result.version}`);
    }
  }
}

// Nur als Skript ausfuehren — beim Import (Tests) nicht.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
