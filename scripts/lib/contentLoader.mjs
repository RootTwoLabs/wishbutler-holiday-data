import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  CONTENT_LOCALES,
  NAMESPACED_SLUGS,
  countriesForNamespacedSlug,
} from '../../content/key-map.mjs';

export { CONTENT_LOCALES, NAMESPACED_SLUGS };

export function slugFromLabelKey(labelKey) {
  return labelKey.startsWith('holidays.') ? labelKey.slice('holidays.'.length) : labelKey;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

/** Loads all global articles: locale -> slug -> article */
export async function loadGlobalArticles(contentRoot) {
  const articlesDir = join(contentRoot, 'articles');
  const byLocale = {};
  for (const locale of CONTENT_LOCALES) {
    const path = join(articlesDir, `${locale}.json`);
    if (!existsSync(path)) continue;
    byLocale[locale] = await readJson(path);
  }
  return byLocale;
}

/** Loads country-specific articles: CC -> locale -> slug -> article */
export async function loadCountryArticles(contentRoot) {
  const articlesDir = join(contentRoot, 'articles');
  const byCountry = {};
  if (!existsSync(articlesDir)) return byCountry;

  for (const entry of await readdir(articlesDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^[A-Z]{2}$/.test(entry.name)) continue;
    const cc = entry.name;
    byCountry[cc] = {};
    for (const locale of CONTENT_LOCALES) {
      const path = join(articlesDir, cc, `${locale}.json`);
      if (!existsSync(path)) continue;
      byCountry[cc][locale] = await readJson(path);
    }
  }
  return byCountry;
}

/**
 * Resolves article for a slug in a given country/locale.
 * Namespaced slugs prefer country content; globals use shared content.
 */
export function resolveArticle(slug, countryCode, locale, globalArticles, countryArticles) {
  const isNamespaced = NAMESPACED_SLUGS.has(slug);
  const owners = countriesForNamespacedSlug(slug);

  if (isNamespaced) {
    const countryEntry = countryArticles[countryCode]?.[locale]?.[slug];
    if (countryEntry) return countryEntry;
    if (owners.includes(countryCode)) return null;
  }

  return globalArticles[locale]?.[slug] ?? null;
}

/** Builds image refs from files on disk for a slug. */
export async function buildImageRefs(dataRoot, slug, countryCode) {
  const dir = countryCode
    ? join(dataRoot, 'images', countryCode, slug)
    : join(dataRoot, 'images', slug);

  if (!existsSync(dir)) return [];

  const files = (await readdir(dir)).filter((f) => /\.jpe?g$/i.test(f)).sort();
  return files.map((file, i) => {
    const path = countryCode
      ? `images/${countryCode}/${slug}/${file}`
      : `images/${slug}/${file}`;
    return { path, primary: i === 0 };
  });
}

/** Whether a slug's images should be read from a country subfolder. */
export function imageNamespaceForSlug(slug, countryCode) {
  if (!NAMESPACED_SLUGS.has(slug)) return null;
  const owners = countriesForNamespacedSlug(slug);
  return owners.includes(countryCode) ? countryCode : null;
}
