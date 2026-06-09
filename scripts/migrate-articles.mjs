#!/usr/bin/env node
/**
 * One-time (re-runnable) migration: copies curated holidayInfo articles from
 * wishbutler_app into content/articles/ using content/key-map.mjs.
 *
 * Usage: node scripts/migrate-articles.mjs
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GLOBAL_ARTICLE_MAP,
  COUNTRY_ARTICLE_MAP,
  CONTENT_LOCALES,
  normalizeArticle,
} from '../content/key-map.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT = join(ROOT, 'content', 'articles');
const APP_INFO = join(ROOT, '..', 'wishbutler_app', 'src', 'i18n', 'holidayInfo');

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function writeJson(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

async function main() {
  if (!existsSync(APP_INFO)) {
    console.error(`App holidayInfo not found at ${APP_INFO}`);
    process.exit(1);
  }

  const globalByLocale = Object.fromEntries(CONTENT_LOCALES.map((l) => [l, {}]));
  const countryByLocale = {};

  for (const locale of CONTENT_LOCALES) {
    const srcPath = join(APP_INFO, `${locale}.json`);
    if (!existsSync(srcPath)) {
      console.warn(`  skip missing locale: ${locale}`);
      continue;
    }
    const src = await readJson(srcPath);

    for (const [articleKey, raw] of Object.entries(src)) {
      const article = normalizeArticle(raw);
      if (!article.intro || !article.history || !article.traditions || article.funFacts.length === 0) {
        console.warn(`  skip incomplete ${locale}/${articleKey}`);
        continue;
      }

      if (GLOBAL_ARTICLE_MAP[articleKey]) {
        const slug = GLOBAL_ARTICLE_MAP[articleKey];
        globalByLocale[locale][slug] = article;
        continue;
      }

      const countryEntry = COUNTRY_ARTICLE_MAP[articleKey];
      if (countryEntry) {
        const { slug, countryCode } = countryEntry;
        countryByLocale[countryCode] ??= Object.fromEntries(
          CONTENT_LOCALES.map((l) => [l, {}]),
        );
        countryByLocale[countryCode][locale][slug] = article;
        continue;
      }

      console.warn(`  unmapped article key: ${articleKey}`);
    }
  }

  for (const locale of CONTENT_LOCALES) {
    const out = join(CONTENT, `${locale}.json`);
    await writeJson(out, globalByLocale[locale]);
    console.log(`  global ${locale}: ${Object.keys(globalByLocale[locale]).length} articles`);
  }

  for (const [cc, byLocale] of Object.entries(countryByLocale)) {
    for (const locale of CONTENT_LOCALES) {
      const articles = byLocale[locale] ?? {};
      if (Object.keys(articles).length === 0) continue;
      const out = join(CONTENT, cc, `${locale}.json`);
      await writeJson(out, articles);
      console.log(`  ${cc}/${locale}: ${Object.keys(articles).length} articles`);
    }
  }

  console.log('Migration done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
