#!/usr/bin/env node
/**
 * Merges curated articles and image references from content/ into every
 * country's latest package.json.
 *
 * Usage: node scripts/build-articles.mjs [CC ...]
 */
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
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

async function latestPackageInfo(cc) {
  const countryDir = join(PACKAGES, cc);
  let best = null;
  for (const versionDir of await listDirs(countryDir)) {
    const version = versionFromDir(versionDir);
    if (version == null) continue;
    if (!best || version > best.version) best = { version, dir: versionDir };
  }
  if (!best) return null;
  return {
    version: best.version,
    path: join(countryDir, best.dir, 'package.json'),
  };
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

async function mergePackage(cc, globalArticles, countryArticles, creditHints) {
  const info = await latestPackageInfo(cc);
  if (!info) {
    console.warn(`  ${cc}: no package, skip`);
    return;
  }
  const pkg = await readJson(info.path);
  const slugs = [...new Set(pkg.definitions.map((d) => slugFromLabelKey(d.labelKey)))];

  const holidayInfo = {};
  const images = {};

  for (const slug of slugs) {
    for (const locale of CONTENT_LOCALES) {
      const article = resolveArticle(slug, cc, locale, globalArticles, countryArticles);
      if (!article) continue;
      holidayInfo[locale] ??= {};
      holidayInfo[locale][slug] = article;
    }

    const ns = imageNamespaceForSlug(slug, cc);
    const refs = await buildImageRefs(DATA, slug, ns);
    if (refs.length > 0) {
      images[slug] = refs.map((ref) => decorateImageRef(ref, creditHints));
    }
  }

  // Rebuild the package with a deterministic field order (mirroring the order
  // emitted by fetch-holidays) so the content comparison below is stable across
  // runs. The version is intentionally left off here and decided afterwards.
  const i18n = { holidays: pkg.i18n?.holidays ?? {} };
  if (Object.keys(holidayInfo).length > 0) i18n.holidayInfo = holidayInfo;

  const base = {
    countryCode: pkg.countryCode,
    schemaVersion: pkg.schemaVersion,
    definitions: pkg.definitions,
    ...(pkg.namedays ? { namedays: pkg.namedays } : {}),
    i18n,
    ...(Object.keys(images).length > 0 ? { images } : {}),
  };

  // Data discipline: a content change (e.g. newly added articles/images) MUST
  // bump the version into a new v<N> dir so the generated index advertises a
  // higher version and clients reliably re-download. Editing the existing
  // version in place (the previous behaviour) left stale copies on devices that
  // had already cached that version. Reuse the version only when nothing moved.
  let version = info.version;
  let outPath = info.path;
  if (packageContentKey(pkg) !== packageContentKey({ ...base, version: info.version })) {
    version = info.version + 1;
    const dir = join(PACKAGES, cc, `v${version}`);
    await mkdir(dir, { recursive: true });
    outPath = join(dir, 'package.json');
  }

  const out = { ...base, version };
  await writeFile(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');

  const articleCount = Object.values(holidayInfo).reduce(
    (n, m) => n + Object.keys(m).length,
    0,
  );
  const imageCount = Object.keys(images).length;
  const bumped = version !== info.version ? ` -> v${version}` : '';
  console.log(
    `  ${cc}${bumped}: ${articleCount} article entries, ${imageCount} image slugs`,
  );
}

/** Applies CREDITS.md hints to an image ref (or marks it CC0). */
function decorateImageRef(ref, creditHints) {
  const hint = creditHints.get(ref.path);
  const out = { ...ref };
  if (hint) {
    out.credit = hint.credit;
    out.license = hint.license;
  } else if (!needsCredit('CC0')) {
    out.license = 'CC0';
  }
  return out;
}

/** Content of a package without the (auto-incrementing) version field. */
function packageContentKey(pkg) {
  const { version, ...rest } = pkg;
  return JSON.stringify(rest);
}

/**
 * Builds the GLOBAL package: all global articles (7 locales) plus hero images
 * for every global (non country-namespaced) slug. It carries no definitions —
 * the global holiday definitions are bundled in the app; this package only
 * supplies the article text + imagery the app loads on first launch so global
 * holidays show artwork without any country package downloaded.
 *
 * Versioned like country packages (new v<N> dir), but only bumps when the
 * resolved content actually changes, to avoid needless re-downloads.
 */
async function buildGlobalPackage(globalArticles, creditHints) {
  const holidayInfo = {};
  for (const locale of CONTENT_LOCALES) {
    const bySlug = globalArticles[locale];
    if (!bySlug) continue;
    for (const [slug, article] of Object.entries(bySlug)) {
      holidayInfo[locale] ??= {};
      holidayInfo[locale][slug] = article;
    }
  }

  // Global slug image folders are the top-level dirs under data/images that are
  // NOT country folders (country-namespaced images live under data/images/<CC>/).
  const imagesRoot = join(DATA, 'images');
  const images = {};
  for (const name of (await listDirs(imagesRoot)).sort()) {
    if (/^[A-Z]{2}$/.test(name)) continue; // country folder, skip
    const refs = await buildImageRefs(DATA, name, null);
    if (refs.length > 0) {
      images[name] = refs.map((ref) => decorateImageRef(ref, creditHints));
    }
  }

  const globalDir = join(PACKAGES, 'GLOBAL');
  const versions = (await listDirs(globalDir))
    .map(versionFromDir)
    .filter((v) => v != null)
    .sort((a, b) => a - b);
  const prevVersion = versions.at(-1) ?? null;

  const i18n = { holidays: {} };
  if (Object.keys(holidayInfo).length > 0) i18n.holidayInfo = holidayInfo;

  const base = {
    countryCode: 'GLOBAL',
    schemaVersion: 1,
    definitions: [],
    i18n,
    ...(Object.keys(images).length > 0 ? { images } : {}),
  };

  // Reuse the previous version when nothing changed; otherwise bump.
  let version = prevVersion ?? 1;
  if (prevVersion != null) {
    try {
      const prevPkg = await readJson(
        join(globalDir, `v${prevVersion}`, 'package.json'),
      );
      if (packageContentKey({ ...prevPkg }) !== packageContentKey({ ...base, version: prevVersion })) {
        version = prevVersion + 1;
      }
    } catch {
      version = prevVersion + 1;
    }
  }

  const pkg = { ...base, version };
  const dir = join(globalDir, `v${version}`);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  const articleCount = Object.values(holidayInfo).reduce(
    (n, m) => n + Object.keys(m).length,
    0,
  );
  console.log(
    `  GLOBAL v${version}: ${articleCount} article entries, ${Object.keys(images).length} image slugs`,
  );
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
    await mergePackage(cc, globalArticles, countryArticles, creditHints);
  }

  // The GLOBAL package is independent of the per-country build above and is only
  // (re)built on a full run (no specific countries requested).
  if (only.length === 0) {
    console.log('Building GLOBAL package...');
    await buildGlobalPackage(globalArticles, creditHints);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
