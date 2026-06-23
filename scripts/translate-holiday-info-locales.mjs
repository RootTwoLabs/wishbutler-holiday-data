import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const articlesRoot = path.join(root, 'content', 'articles');
const cachePath = path.join(__dirname, '.holiday-info-translation-cache.json');

const TARGETS = [
  { locale: 'nl', deeplTo: 'NL' },
  { locale: 'sv', deeplTo: 'SV' },
  { locale: 'ja', deeplTo: 'JA' },
  { locale: 'ko', deeplTo: 'KO' },
  { locale: 'zh-Hant', deeplTo: 'ZH-HANT' },
];

const BATCH_LIMITS = { maxChars: 30000, maxItems: 80 };
const PLACEHOLDER_RE = /\{\{\s*[\w.]+\s*\}\}|%@/g;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hash(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.writeFileSync(cachePath, JSON.stringify(cache), 'utf8');
}

function parseArgs() {
  const args = process.argv.slice(2);
  const onlyArg = args.find((arg) => arg.startsWith('--only='));
  const only = onlyArg
    ? new Set(onlyArg.slice('--only='.length).split(',').map((value) => value.trim()))
    : null;
  const delayArg = args.find((arg) => arg.startsWith('--delay-ms='));
  const delayMs = delayArg ? Math.max(0, Number.parseInt(delayArg.slice('--delay-ms='.length), 10) || 0) : 100;
  return { only, delayMs };
}

function walkEnglishArticleFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkEnglishArticleFiles(fullPath, out);
    } else if (entry.name === 'en.json') {
      out.push(fullPath);
    }
  }
  return out.sort();
}

function flattenStrings(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(flattenStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(flattenStrings);
  return [];
}

function mapStrings(value, translate) {
  if (typeof value === 'string') return translate(value);
  if (Array.isArray(value)) return value.map((item) => mapStrings(item, translate));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, mapStrings(item, translate)]),
    );
  }
  return value;
}

function protectPlaceholders(text) {
  const placeholders = [];
  const protectedText = text.replace(PLACEHOLDER_RE, (match) => {
    const token = `[[WBVAR${placeholders.length}]]`;
    placeholders.push([token, match]);
    return token;
  });
  return { protectedText, placeholders };
}

function restorePlaceholders(text, placeholders) {
  return placeholders.reduce((out, [token, value]) => out.replaceAll(token, value), text);
}

function chunkItems(items) {
  const batches = [];
  let current = [];
  let currentLength = 0;

  for (const item of items) {
    const nextLength = item.protectedText.length + 16;
    if (
      current.length > 0 &&
      (current.length >= BATCH_LIMITS.maxItems || currentLength + nextLength > BATCH_LIMITS.maxChars)
    ) {
      batches.push(current);
      current = [];
      currentLength = 0;
    }
    current.push(item);
    currentLength += nextLength;
  }

  if (current.length > 0) batches.push(current);
  return batches;
}

async function translateDeepLBatch(batch, targetLang, delayMs) {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPL_API_KEY is not set');
  }

  const defaultEndpoint = apiKey.endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';
  const endpoint = process.env.DEEPL_API_URL || defaultEndpoint;
  const body = new URLSearchParams();

  for (const item of batch) {
    body.append('text', item.protectedText);
  }
  body.set('source_lang', 'EN');
  body.set('target_lang', targetLang);
  body.set('preserve_formatting', '1');

  await sleep(delayMs);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`DeepL ${response.status}: ${JSON.stringify(data).slice(0, 300)}`);
  }

  return batch.map((item, index) => {
    const translated = data.translations?.[index]?.text;
    if (!translated) return item.value;
    return restorePlaceholders(translated, item.placeholders);
  });
}

function collectUniqueStrings(articleFiles) {
  const strings = new Set();
  for (const file of articleFiles) {
    const articleFile = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const value of flattenStrings(articleFile)) {
      strings.add(value);
    }
  }
  return [...strings];
}

async function ensureTranslations(strings, target, cache, delayMs) {
  const items = strings.map((value) => {
    const cacheKey = `${target.locale}::${hash(value)}`;
    return {
      value,
      cacheKey,
      ...protectPlaceholders(value),
    };
  });
  const uncached = items.filter((item) => cache[item.cacheKey] == null);
  const batches = chunkItems(uncached);
  let done = 0;

  for (const batch of batches) {
    const translated = await translateDeepLBatch(batch, target.deeplTo, delayMs);
    translated.forEach((value, index) => {
      cache[batch[index].cacheKey] = value;
    });
    saveCache(cache);
    done += batch.length;
    process.stderr.write(`  ${target.locale}: ${done}/${uncached.length} translated...\n`);
  }

  return new Map(items.map((item) => [item.value, cache[item.cacheKey] ?? item.value]));
}

function writeLocaleFiles(articleFiles, target, translations) {
  let written = 0;
  for (const file of articleFiles) {
    const english = JSON.parse(fs.readFileSync(file, 'utf8'));
    const translated = mapStrings(english, (value) => translations.get(value) ?? value);
    const outPath = path.join(path.dirname(file), `${target.locale}.json`);
    fs.writeFileSync(outPath, `${JSON.stringify(translated, null, 2)}\n`, 'utf8');
    written += 1;
  }
  return written;
}

async function main() {
  const { only, delayMs } = parseArgs();
  const targets = TARGETS.filter((target) => !only || only.has(target.locale));
  const articleFiles = walkEnglishArticleFiles(articlesRoot);
  const strings = collectUniqueStrings(articleFiles);
  const cache = loadCache();

  process.stderr.write(`Article sources: ${articleFiles.length}; unique strings: ${strings.length}\n`);

  for (const target of targets) {
    process.stderr.write(`\n=== ${target.locale} (${target.deeplTo}) ===\n`);
    const translations = await ensureTranslations(strings, target, cache, delayMs);
    const written = writeLocaleFiles(articleFiles, target, translations);
    process.stderr.write(`  ${target.locale}: wrote ${written} content article files.\n`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
