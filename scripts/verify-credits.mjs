#!/usr/bin/env node
/**
 * Prueft JEDE CREDITS.md-Zeile gegen den heutigen Stand auf Wikimedia Commons:
 * existiert die Datei noch, stimmt die Lizenz, steht sie auf der Allowlist
 * (CC0/PD/CC BY/CC BY-SA), stimmt bei attributionspflichtigen Lizenzen der
 * Urheber. Die Vergleichslogik liegt offline getestet in lib/creditVerification.mjs.
 *
 * NUR MANUELL (`npm run verify:credits`) — bewusst nicht in build-all/CI: der
 * Lauf braucht Netz (Commons-API, keyless, ~20 Requests fuer ~900 Zeilen) und
 * ein Befund verlangt eine menschliche Entscheidung (Zeile korrigieren vs. Bild
 * ersetzen). Sinnvoll vor jedem Daten-Tag, der Bilder anfasst, und sonst
 * gelegentlich — Lizenzen und Dateien aendern sich auf Commons nachtraeglich.
 *
 * Quelle je Zeile: die URL der Zeile; fehlt sie, der `sourceUrl` des Bild-Refs
 * im neuesten Paket (FUN traegt dort den kuratierten `imageFile`-Titel).
 * Zeilen ohne jede Quelle landen unter `no-source`.
 *
 * Antworten werden je Commons-Titel in `.cache/verify-credits/commons.json`
 * gecacht (`.cache/` ist gitignoriert); `--refresh` holt alles neu,
 * `--max-age-days=<n>` (Default 7) laesst aeltere Eintraege verfallen.
 *
 * Usage: node scripts/verify-credits.mjs [--refresh] [--max-age-days=7] [--only=<pfadpraefix>] [--json=<datei>] [--all]
 *   --only=images/DE/   nur Zeilen mit diesem Pfadpraefix
 *   --json=<datei>      vollstaendigen Befund als JSON schreiben
 *   --all               auch `ok`-Zeilen und reine Hinweise (`author-note`) ausgeben
 * Exit 1, sobald ein Befund der Schwere `error` vorliegt; `no-source` allein ist Exit 0.
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCreditHints } from './lib/imageCredits.mjs';
import { listVersions } from './lib/packageWriter.mjs';
import { fetchWithTimeout } from './lib/httpClient.mjs';
import { commonsTitleFromUrl, compareCredit } from './lib/creditVerification.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CREDITS = join(ROOT, 'CREDITS.md');
const PACKAGES = join(ROOT, 'data', 'packages');
const CACHE_DIR = join(ROOT, '.cache', 'verify-credits');
const CACHE_FILE = join(CACHE_DIR, 'commons.json');

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'wishbutler-holiday-data/1.0 (https://github.com/RootTwoLabs/wishbutler-holiday-data)';
const BATCH = 50; // API-Obergrenze fuer `titles` ohne Bot-Flag
const PAUSE_MS = 500;

const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const refresh = args.includes('--refresh');
const showAll = args.includes('--all');
const only = flag('only');
const jsonOut = flag('json');
const maxAgeMs = Number(flag('max-age-days') ?? 7) * 86_400_000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, attempt = 0) {
  const res = await fetchWithTimeout(url, { headers: { 'User-Agent': USER_AGENT }, timeoutMs: 30000, retries: 2, backoffMs: 800 });
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 4) throw new Error(`Commons HTTP ${res.status}`);
    const wait = Number(res.headers.get('retry-after')) * 1000 || 5000 * 2 ** attempt;
    console.warn(`  Commons HTTP ${res.status} — warte ${Math.round(wait / 1000)} s`);
    await sleep(wait);
    return getJson(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`Commons HTTP ${res.status}`);
  return res.json();
}

/** Holt extmetadata fuer bis zu BATCH Titel; folgt Normalisierung und Weiterleitungen. */
async function fetchBatch(titles) {
  const out = new Map();
  let cont = {};
  const pages = new Map();
  const alias = new Map(titles.map((t) => [t, t])); // angefragter Titel -> Seitentitel
  for (;;) {
    const params = new URLSearchParams({
      action: 'query', format: 'json', redirects: '1', titles: titles.join('|'),
      prop: 'imageinfo', iiprop: 'extmetadata|url', ...cont,
    });
    const json = await getJson(`${COMMONS_API}?${params}`);
    for (const step of [json?.query?.normalized ?? [], json?.query?.redirects ?? []]) {
      for (const { from, to } of step) {
        for (const [asked, current] of alias) if (current === from) alias.set(asked, to);
      }
    }
    for (const page of Object.values(json?.query?.pages ?? {})) {
      const prev = pages.get(page.title);
      pages.set(page.title, prev?.imageinfo ? prev : page);
    }
    if (!json?.continue) break;
    cont = json.continue;
    await sleep(PAUSE_MS);
  }
  for (const [asked, current] of alias) {
    const page = pages.get(current);
    const info = page?.imageinfo?.[0];
    const e = info?.extmetadata ?? {};
    out.set(asked, info
      ? {
          title: page.title,
          descriptionurl: info.descriptionurl,
          license: e.LicenseShortName?.value ?? '',
          artist: e.Artist?.value ?? '',
          attribution: e.Attribution?.value ?? '',
          credit: e.Credit?.value ?? '',
          usageTerms: e.UsageTerms?.value ?? '',
          attributionRequired: e.AttributionRequired?.value ?? '',
        }
      : { title: current, missing: true });
  }
  return out;
}

/** path -> sourceUrl aus den Bild-Refs der jeweils neuesten Paketversion. */
async function latestRefSources() {
  const byPath = new Map();
  for (const code of (await readdir(PACKAGES)).sort()) {
    const v = (await listVersions(join(PACKAGES, code))).at(-1);
    if (v == null) continue;
    const pkg = JSON.parse(await readFile(join(PACKAGES, code, `v${v}`, 'package.json'), 'utf8'));
    for (const ref of Object.values(pkg.images ?? {}).flat()) {
      if (typeof ref?.sourceUrl === 'string' && !byPath.has(ref.path)) byPath.set(ref.path, ref.sourceUrl);
    }
  }
  return byPath;
}

async function main() {
  const hints = await loadCreditHints(CREDITS);
  const refSources = await latestRefSources();
  const lines = [...hints.entries()]
    .filter(([path]) => !only || path.startsWith(only))
    .map(([path, h]) => {
      const lineTitle = commonsTitleFromUrl(h.sourceUrl);
      const refTitle = commonsTitleFromUrl(refSources.get(path));
      return { path, ...h, title: lineTitle ?? refTitle, titleFrom: lineTitle ? 'line' : refTitle ? 'ref' : null };
    });

  const cache = !refresh && existsSync(CACHE_FILE) ? JSON.parse(await readFile(CACHE_FILE, 'utf8')) : {};
  const now = Date.now();
  const wanted = [...new Set(lines.map((l) => l.title).filter(Boolean))];
  const stale = wanted.filter((t) => !cache[t] || now - Date.parse(cache[t].fetchedAt) > maxAgeMs);
  console.log(`${lines.length} Zeilen, ${wanted.length} Commons-Titel, ${stale.length} abzurufen (${Math.ceil(stale.length / BATCH)} Requests)…`);
  await mkdir(CACHE_DIR, { recursive: true });
  for (let i = 0; i < stale.length; i += BATCH) {
    const batch = await fetchBatch(stale.slice(i, i + BATCH));
    for (const [title, record] of batch) cache[title] = { fetchedAt: new Date().toISOString(), record };
    await writeFile(CACHE_FILE, JSON.stringify(cache, null, 1), 'utf8');
    if (i + BATCH < stale.length) await sleep(PAUSE_MS);
  }

  const findings = lines.map((l) => {
    const commons = l.title ? cache[l.title]?.record : null;
    return { path: l.path, credit: l.credit, license: l.license, title: l.title, titleFrom: l.titleFrom, commons, ...compareCredit(l, commons) };
  });

  const byStatus = {};
  for (const f of findings) (byStatus[f.status] ??= []).push(f);
  const order = ['missing-on-commons', 'license-not-allowed', 'license-mismatch', 'author-missing', 'author-mismatch', 'no-source', 'author-note', 'ok'];
  for (const status of order) {
    const list = byStatus[status] ?? [];
    if (list.length === 0) continue;
    console.log(`\n${status}: ${list.length}`);
    if (!showAll && (status === 'ok' || status === 'author-note')) continue;
    for (const f of list) console.log(`  ${f.path}${f.detail ? ` — ${f.detail}` : ''}${f.title ? ` [${f.title}]` : ''}`);
  }
  if (jsonOut) await writeFile(jsonOut, JSON.stringify(findings, null, 1), 'utf8');

  const errors = findings.filter((f) => f.severity === 'error').length;
  console.log(`\n${errors} Befund(e) mit Handlungsbedarf, ${(byStatus['no-source'] ?? []).length} Zeile(n) ohne Quelle.`);
  if (errors > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
