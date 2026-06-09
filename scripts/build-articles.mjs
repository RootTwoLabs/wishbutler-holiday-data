#!/usr/bin/env node
/**
 * Merges curated articles and image references from content/ into every
 * country's latest package.json.
 *
 * Usage: node scripts/build-articles.mjs [CC ...]
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONTENT_LOCALES,
  loadGlobalArticles,
  loadCountryArticles,
  resolveArticle,
  buildImageRefs,
  imageNamespaceForSlug,
  slugFromLabelKey,
} from './lib/contentLoader.mjs';
import { needsCredit } from './lib/imageLicense.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT = join(ROOT, 'content');
const DATA = join(ROOT, 'data');
const PACKAGES = join(DATA, 'packages');

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function listDirs(path) {
  if (!existsSync(path)) return [];
  const entries = await readdir(path, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

function versionFromDir(name) {
  const m = /^v(\d+)$/.exec(name);
  return m ? parseInt(m[1], 10) : null;
}

async function latestPackagePath(cc) {
  const countryDir = join(PACKAGES, cc);
  let best = null;
  for (const versionDir of await listDirs(countryDir)) {
    const version = versionFromDir(versionDir);
    if (version == null) continue;
    if (!best || version > best.version) best = { version, dir: versionDir };
  }
  if (!best) return null;
  return join(countryDir, best.dir, 'package.json');
}

/** Reads license/credit hints from CREDITS.md for attributed images. */
async function loadCreditHints() {
  const hints = new Map();
  const creditsPath = join(ROOT, 'CREDITS.md');
  if (!existsSync(creditsPath)) return hints;
  const md = await readFile(creditsPath, 'utf8');
  const block = md.match(
    /<!-- BEGIN:IMAGE-CREDITS \(auto-generated\) -->([\s\S]*?)<!-- END:IMAGE-CREDITS -->/,
  );
  if (!block) return hints;
  for (const line of block[1].split('\n')) {
    const m = line.match(/^- `([^`]+)` — (.+) \(([^)]+)\)$/);
    if (m) hints.set(m[1], { credit: m[2], license: m[3] });
  }
  return hints;
}

async function mergePackage(cc, pkgPath, globalArticles, countryArticles, creditHints) {
  const pkg = await readJson(pkgPath);
  const slugs = [...new Set(pkg.definitions.map((d) => slugFromLabelKey(d.labelKey)))];

  const holidayInfo = {};
  const images = {};

  for (const slug of slugs) {
    let hasAnyArticle = false;
    for (const locale of CONTENT_LOCALES) {
      const article = resolveArticle(slug, cc, locale, globalArticles, countryArticles);
      if (!article) continue;
      holidayInfo[locale] ??= {};
      holidayInfo[locale][slug] = article;
      hasAnyArticle = true;
    }

    const ns = imageNamespaceForSlug(slug, cc);
    const refs = await buildImageRefs(DATA, slug, ns);
    if (refs.length > 0) {
      images[slug] = refs.map((ref) => {
        const hint = creditHints.get(ref.path);
        const out = { ...ref };
        if (hint) {
          out.credit = hint.credit;
          out.license = hint.license;
        } else if (!needsCredit('CC0')) {
          out.license = 'CC0';
        }
        return out;
      });
    }

    if (hasAnyArticle) {
      /* articles merged above */
    }
  }

  const next = { ...pkg };
  next.i18n = { ...(pkg.i18n ?? {}), holidays: pkg.i18n?.holidays ?? {} };
  if (Object.keys(holidayInfo).length > 0) {
    next.i18n.holidayInfo = holidayInfo;
  }
  if (Object.keys(images).length > 0) {
    next.images = images;
  }

  await writeFile(pkgPath, JSON.stringify(next, null, 2) + '\n', 'utf8');

  const articleCount = Object.values(holidayInfo).reduce(
    (n, m) => n + Object.keys(m).length,
    0,
  );
  const imageCount = Object.keys(images).length;
  console.log(`  ${cc}: ${articleCount} article entries, ${imageCount} image slugs`);
}

async function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const globalArticles = await loadGlobalArticles(CONTENT);
  const countryArticles = await loadCountryArticles(CONTENT);
  const creditHints = await loadCreditHints();

  const countries =
    only.length > 0 ? only : (await listDirs(PACKAGES)).filter((c) => /^[A-Z]{2}$/.test(c));

  console.log(`Merging articles into ${countries.length} country packages...`);
  for (const cc of countries.sort()) {
    const pkgPath = await latestPackagePath(cc);
    if (!pkgPath) {
      console.warn(`  ${cc}: no package, skip`);
      continue;
    }
    await mergePackage(cc, pkgPath, globalArticles, countryArticles, creditHints);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
