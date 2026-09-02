#!/usr/bin/env node
/**
 * Builds content/holiday-labels/<locale>.json from the English labels found in
 * the latest packages. The generated catalogs are committed and later merged by
 * build-labels.mjs, so GitHub Actions do not need translation API access.
 *
 * Usage:
 *   node scripts/translate-holiday-labels.mjs --provider=google --delay-ms=1000
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { LOCALES } from './config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PACKAGES = join(ROOT, 'data', 'packages');
const LABELS = join(ROOT, 'content', 'holiday-labels');
const CACHE = join(__dirname, '.holiday-label-translation-cache.json');

const TARGET_LANG = {
  de: 'de',
  fr: 'fr',
  es: 'es',
  pt: 'pt-PT',
  it: 'it',
  pl: 'pl',
  nl: 'nl',
  sv: 'sv',
  ja: 'ja',
  ko: 'ko',
  'zh-Hant': 'zh-TW',
};

const MARKER_RE = /^@@WB_(\d+)@@\s*/;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hash(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function listDirs(path) {
  if (!existsSync(path)) return [];
  const entries = await readdir(path, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

function versionFromDir(name) {
  const match = /^v(\d+)$/.exec(name);
  return match ? Number.parseInt(match[1], 10) : null;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const onlyArg = args.find((arg) => arg.startsWith('--only='));
  const only = onlyArg
    ? new Set(onlyArg.slice('--only='.length).split(',').map((value) => value.trim()))
    : null;
  const delayArg = args.find((arg) => arg.startsWith('--delay-ms='));
  const delayMs = delayArg ? Math.max(0, Number.parseInt(delayArg.slice('--delay-ms='.length), 10) || 0) : 1000;
  return { only, delayMs };
}

async function latestPackagePath(cc) {
  const countryDir = join(PACKAGES, cc);
  const versions = (await listDirs(countryDir))
    .map(versionFromDir)
    .filter((version) => version != null)
    .sort((a, b) => a - b);
  const latest = versions.at(-1);
  return latest == null ? null : join(countryDir, `v${latest}`, 'package.json');
}

async function collectEnglishLabels() {
  const labels = {};
  for (const cc of await listDirs(PACKAGES)) {
    if (!/^[A-Z]{2}$/.test(cc)) continue;
    const packagePath = await latestPackagePath(cc);
    if (!packagePath) continue;
    const pkg = await readJson(packagePath);
    Object.assign(labels, pkg.i18n?.holidays?.en ?? {});
  }
  return Object.fromEntries(Object.entries(labels).sort(([a], [b]) => a.localeCompare(b)));
}

function chunkEntries(entries) {
  const batches = [];
  let current = [];
  let currentLength = 0;
  for (const entry of entries) {
    const length = entry.value.length + 16;
    if (current.length > 0 && (current.length >= 50 || currentLength + length > 3500)) {
      batches.push(current);
      current = [];
      currentLength = 0;
    }
    current.push(entry);
    currentLength += length;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

async function translateGoogleBatch(batch, targetLang, delayMs) {
  const source = batch
    .map((entry, index) => `@@WB_${index}@@ ${entry.value}`)
    .join('\n');
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'en',
    tl: targetLang,
    dt: 't',
    q: source,
  });

  await sleep(delayMs);
  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`);
  if (!response.ok) {
    throw new Error(`Google ${response.status}: ${await response.text()}`);
  }
  const data = await response.json();
  const text = (data?.[0] ?? []).map((part) => part?.[0] ?? '').join('');
  const translatedByIndex = new Map();

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(MARKER_RE);
    if (!match) continue;
    translatedByIndex.set(Number.parseInt(match[1], 10), line.replace(MARKER_RE, '').trim());
  }

  return batch.map((entry, index) => translatedByIndex.get(index) || entry.value);
}

async function main() {
  const { only, delayMs } = parseArgs();
  const english = await collectEnglishLabels();
  const targets = LOCALES.filter((locale) => locale !== 'en' && TARGET_LANG[locale] && (!only || only.has(locale)));
  const cache = existsSync(CACHE) ? JSON.parse(await readFile(CACHE, 'utf8')) : {};

  await mkdir(LABELS, { recursive: true });
  await writeFile(join(LABELS, 'en.json'), `${JSON.stringify(english, null, 2)}\n`, 'utf8');
  console.log(`English labels: ${Object.keys(english).length}`);

  for (const locale of targets) {
    const entries = Object.entries(english).map(([key, value]) => ({
      key,
      value,
      cacheKey: `${locale}::${hash(value)}`,
    }));
    const missing = entries.filter((entry) => cache[entry.cacheKey] == null);
    const batches = chunkEntries(missing);
    let done = 0;

    console.log(`\n=== ${locale} (${TARGET_LANG[locale]}) ===`);
    for (const batch of batches) {
      const translated = await translateGoogleBatch(batch, TARGET_LANG[locale], delayMs);
      translated.forEach((value, index) => {
        cache[batch[index].cacheKey] = value;
      });
      await writeFile(CACHE, JSON.stringify(cache), 'utf8');
      done += batch.length;
      console.log(`  ${done}/${missing.length} translated...`);
    }

    const out = {};
    for (const entry of entries) {
      out[entry.key] = cache[entry.cacheKey] ?? entry.value;
    }
    await writeFile(join(LABELS, `${locale}.json`), `${JSON.stringify(out, null, 2)}\n`, 'utf8');
    console.log(`Wrote ${locale}.json`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
