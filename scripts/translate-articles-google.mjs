#!/usr/bin/env node
/**
 * Uebersetzt Artikel (content/articles/**\/en.json) in die uebrigen Content-Locales
 * ueber den keylosen Google-Translate-Endpunkt (wie translate-holiday-labels.mjs).
 *
 * Idempotent: pro Locale werden nur Slugs uebersetzt, die in <locale>.json noch
 * FEHLEN — handgeschriebene Texte (z. B. de) werden nie ueberschrieben. Ein
 * Cache (nicht eingecheckt) verhindert Doppelanfragen.
 *
 * Usage:
 *   node scripts/translate-articles-google.mjs [--only=fr,es] [--dir=IL,GLOBAL] [--delay-ms=800]
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { CONTENT_LOCALES } from '../content/key-map.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ARTICLES = join(ROOT, 'content', 'articles');
const CACHE = join(__dirname, '.article-translation-cache.json');

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
const FIELDS = ['intro', 'history', 'traditions'];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hash(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const pick = (name) => {
    const arg = args.find((a) => a.startsWith(`--${name}=`));
    return arg ? arg.slice(name.length + 3) : null;
  };
  const only = pick('only');
  const dir = pick('dir');
  const delay = pick('delay-ms');
  return {
    onlyLocales: only ? new Set(only.split(',').map((s) => s.trim())) : null,
    onlyDirs: dir ? new Set(dir.split(',').map((s) => s.trim())) : null,
    delayMs: delay ? Math.max(0, Number.parseInt(delay, 10) || 0) : 800,
  };
}

/** Alle Artikelverzeichnisse: GLOBAL (content/articles selbst) + <CC>/. */
async function listArticleDirs() {
  const dirs = [{ key: 'GLOBAL', path: ARTICLES }];
  for (const entry of await readdir(ARTICLES, { withFileTypes: true })) {
    if (entry.isDirectory() && /^[A-Z]{2}$/.test(entry.name)) {
      dirs.push({ key: entry.name, path: join(ARTICLES, entry.name) });
    }
  }
  return dirs;
}

/** Zerlegt Artikel in flache Textsegmente (Feld oder funFacts[i]). */
function segmentsOf(slug, article) {
  const out = [];
  for (const field of FIELDS) {
    if (typeof article[field] === 'string' && article[field].trim()) {
      out.push({ slug, path: [field], text: article[field] });
    }
  }
  (article.funFacts ?? []).forEach((fact, i) => {
    if (typeof fact === 'string' && fact.trim()) out.push({ slug, path: ['funFacts', i], text: fact });
  });
  return out;
}

function chunk(segments) {
  const batches = [];
  let current = [];
  let length = 0;
  for (const seg of segments) {
    const l = seg.text.length + 16;
    if (current.length > 0 && (current.length >= 25 || length + l > 4000)) {
      batches.push(current);
      current = [];
      length = 0;
    }
    current.push(seg);
    length += l;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

async function translateBatch(batch, targetLang, delayMs) {
  const source = batch.map((seg, i) => `@@WB_${i}@@ ${seg.text}`).join('\n');
  const params = new URLSearchParams({ client: 'gtx', sl: 'en', tl: targetLang, dt: 't', q: source });
  await sleep(delayMs);
  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`);
  if (!response.ok) throw new Error(`Google ${response.status}: ${await response.text()}`);
  const data = await response.json();
  const text = (data?.[0] ?? []).map((part) => part?.[0] ?? '').join('');
  const byIndex = new Map();
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(MARKER_RE);
    if (m) byIndex.set(Number.parseInt(m[1], 10), line.replace(MARKER_RE, '').trim());
  }
  return batch.map((seg, i) => byIndex.get(i) || null);
}

async function main() {
  const { onlyLocales, onlyDirs, delayMs } = parseArgs();
  const cache = existsSync(CACHE) ? await readJson(CACHE) : {};
  const targets = CONTENT_LOCALES.filter(
    (l) => l !== 'en' && TARGET_LANG[l] && (!onlyLocales || onlyLocales.has(l)),
  );

  for (const dir of await listArticleDirs()) {
    if (onlyDirs && !onlyDirs.has(dir.key)) continue;
    const enPath = join(dir.path, 'en.json');
    if (!existsSync(enPath)) continue;
    const english = await readJson(enPath);

    for (const locale of targets) {
      const outPath = join(dir.path, `${locale}.json`);
      const existing = existsSync(outPath) ? await readJson(outPath) : {};
      const missing = Object.keys(english).filter((slug) => !existing[slug]);
      if (missing.length === 0) continue;

      const segments = missing.flatMap((slug) => segmentsOf(slug, english[slug]));
      const todo = segments.filter((s) => cache[`${locale}::${hash(s.text)}`] == null);
      let failed = 0;
      for (const batch of chunk(todo)) {
        let translated;
        try {
          translated = await translateBatch(batch, TARGET_LANG[locale], delayMs);
        } catch (err) {
          console.warn(`  ${dir.key}/${locale}: ${err.message}`);
          failed += batch.length;
          continue;
        }
        translated.forEach((value, i) => {
          if (value) cache[`${locale}::${hash(batch[i].text)}`] = value;
          else failed += 1;
        });
        await mkdir(dirname(CACHE), { recursive: true });
        await writeFile(CACHE, JSON.stringify(cache), 'utf8');
      }

      // Nur vollstaendig uebersetzte Artikel schreiben — halbe Artikel waeren
      // schlimmer als gar keine (Mischtext in der App).
      let written = 0;
      for (const slug of missing) {
        const src = english[slug];
        const out = { ...src, funFacts: [...(src.funFacts ?? [])] };
        let complete = true;
        for (const seg of segmentsOf(slug, src)) {
          const value = cache[`${locale}::${hash(seg.text)}`];
          if (!value) {
            complete = false;
            break;
          }
          if (seg.path[0] === 'funFacts') out.funFacts[seg.path[1]] = value;
          else out[seg.path[0]] = value;
        }
        // imageCredit bleibt englisch (Eigennamen/Lizenz), wie in den bestehenden Dateien.
        if (complete) {
          existing[slug] = out;
          written += 1;
        }
      }
      if (written > 0) {
        await writeFile(outPath, `${JSON.stringify(existing, null, 2)}\n`, 'utf8');
      }
      console.log(
        `  ${dir.key}/${locale}: ${written}/${missing.length} Artikel geschrieben${failed ? ` (${failed} Segmente fehlgeschlagen)` : ''}`,
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
