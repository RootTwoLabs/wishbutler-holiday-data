#!/usr/bin/env node
/**
 * Downloads holiday images into data/images/<slug>/ or data/images/<CC>/<slug>/.
 * Prefers CC0/Public Domain (Wikimedia Commons + Openverse), falls back to
 * CC-BY / CC-BY-SA with attribution recorded in CREDITS.md.
 *
 * Idempotent: skips targets that already have at least one image on disk.
 *
 * Usage: node scripts/fetch-images.mjs [--force] [slug ...]
 *   - Pass one or more slugs to only (re)fetch those targets.
 */
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listImageTargets, termsForSlug } from '../content/image-queries.mjs';
import { classifyLicense, isCc0OrPd, needsCredit, stripHtml } from './lib/imageLicense.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const IMAGES = join(ROOT, 'data', 'images');
const CREDITS = join(ROOT, 'CREDITS.md');

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const OPENVERSE_API = 'https://api.openverse.org/v1/images/';
const USER_AGENT = 'wishbutler-holiday-data/1.0 (https://github.com/RootTwoLabs/wishbutler-holiday-data)';
const MAX_IMAGES = 3;
const MIN_WIDTH = 800;
const MIN_HEIGHT = 500;
const THUMB_WIDTH = 1280;

const force = process.argv.includes('--force');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function imageDir(slug, countryCode) {
  return countryCode ? join(IMAGES, countryCode, slug) : join(IMAGES, slug);
}

function imageRelPath(slug, countryCode, file) {
  return countryCode
    ? `images/${countryCode}/${slug}/${file}`
    : `images/${slug}/${file}`;
}

async function listExistingJpegs(dir) {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir);
  return entries.filter((f) => /\.jpe?g$/i.test(f)).sort();
}

async function searchCommonsTitles(term, limit = 12) {
  const url =
    `${COMMONS_API}?action=query&format=json&list=search` +
    `&srsearch=${encodeURIComponent('filetype:bitmap ' + term)}` +
    `&srnamespace=6&srlimit=${limit}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Commons search ${res.status}`);
  const json = await res.json();
  return (json?.query?.search ?? []).map((r) => r.title);
}

async function getCommonsImageInfo(title) {
  const url =
    `${COMMONS_API}?action=query&format=json` +
    `&titles=${encodeURIComponent(title)}` +
    `&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=${THUMB_WIDTH}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Commons info ${res.status}`);
  const json = await res.json();
  const pages = json?.query?.pages ?? {};
  const page = Object.values(pages)[0];
  return page?.imageinfo?.[0];
}

async function searchOpenverse(term, cc0Only, limit = 10) {
  const license = cc0Only ? 'cc0,publicdomain' : 'cc0,publicdomain,by,by-sa';
  const url =
    `${OPENVERSE_API}?q=${encodeURIComponent(term)}` +
    `&license=${license}&page_size=${limit}&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Openverse ${res.status}`);
  const json = await res.json();
  return json?.results ?? [];
}

function commonsCandidate(info, title) {
  if (!info?.thumburl) return null;
  if (info.width < MIN_WIDTH || info.height < MIN_HEIGHT) return null;
  const license = classifyLicense(info.extmetadata?.LicenseShortName?.value);
  if (!license) return null;
  return {
    source: 'wikimedia',
    url: info.thumburl,
    title,
    descriptionurl: info.descriptionurl ?? '',
    author: stripHtml(info.extmetadata?.Artist?.value),
    license,
    width: info.width,
    height: info.height,
    cc0: isCc0OrPd(license),
  };
}

function openverseCandidate(result) {
  const url = result.url ?? result.thumbnail;
  if (!url) return null;
  if ((result.width ?? 0) < MIN_WIDTH || (result.height ?? 0) < MIN_HEIGHT) return null;
  const license = classifyLicense(result.license ?? '');
  if (!license) return null;
  return {
    source: 'openverse',
    url,
    title: result.title ?? result.id ?? 'Openverse',
    descriptionurl: result.foreign_landing_url ?? result.url ?? '',
    author: result.creator ?? result.creator_url ?? '',
    license,
    width: result.width,
    height: result.height,
    cc0: isCc0OrPd(license),
  };
}

async function collectCandidates(terms, { cc0Only }) {
  const seen = new Set();
  const candidates = [];

  const add = (c) => {
    if (!c || seen.has(c.url)) return;
    seen.add(c.url);
    candidates.push(c);
  };

  for (const term of terms) {
    try {
      const titles = await searchCommonsTitles(term);
      for (const title of titles) {
        if (!/\.(jpg|jpeg|png|webp)$/i.test(title)) continue;
        try {
          const info = await getCommonsImageInfo(title);
          const c = commonsCandidate(info, title);
          if (c && (!cc0Only || c.cc0)) add(c);
        } catch {
          /* skip */
        }
        await sleep(80);
      }
    } catch (err) {
      console.warn(`    Commons "${term}": ${err.message}`);
    }

    try {
      const results = await searchOpenverse(term, cc0Only);
      for (const r of results) add(openverseCandidate(r));
    } catch (err) {
      console.warn(`    Openverse "${term}": ${err.message}`);
    }

    await sleep(120);
  }

  candidates.sort((a, b) => Number(b.cc0) - Number(a.cc0));
  return candidates;
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf.length;
}

async function fetchTarget({ slug, countryCode }) {
  const dir = imageDir(slug, countryCode);
  const label = countryCode ? `${countryCode}/${slug}` : slug;

  const existing = await listExistingJpegs(dir);
  if (!force && existing.length > 0) {
    console.log(`  ${label}: skip (${existing.length} on disk)`);
    return existing.map((file) => ({
      path: imageRelPath(slug, countryCode, file),
      file,
      skipped: true,
    }));
  }

  const terms = termsForSlug(slug, countryCode);
  if (terms.length === 0) {
    console.warn(`  ${label}: no search terms`);
    return [];
  }

  let candidates = await collectCandidates(terms, { cc0Only: true });
  if (candidates.length < MAX_IMAGES) {
    const fallback = await collectCandidates(terms, { cc0Only: false });
    for (const c of fallback) {
      if (!candidates.some((x) => x.url === c.url)) candidates.push(c);
    }
    candidates.sort((a, b) => Number(b.cc0) - Number(a.cc0));
  }

  if (candidates.length === 0) {
    console.warn(`  ${label}: NO MATCH`);
    return [];
  }

  await mkdir(dir, { recursive: true });
  const saved = [];

  for (let i = 0; i < Math.min(MAX_IMAGES, candidates.length); i++) {
    const c = candidates[i];
    const file = `${String(i + 1).padStart(2, '0')}.jpg`;
    const dest = join(dir, file);
    try {
      const bytes = await download(c.url, dest);
      saved.push({
        path: imageRelPath(slug, countryCode, file),
        file,
        credit: c.author || (c.source === 'wikimedia' ? 'Wikimedia Commons' : 'Openverse'),
        license: c.license,
        primary: i === 0,
        cc0: c.cc0,
        bytes,
        title: c.title,
      });
      console.log(
        `  ${label}/${file}: ${c.license.padEnd(16)} ${(bytes / 1024).toFixed(0)} KB`,
      );
    } catch (err) {
      console.warn(`  ${label}/${file}: ${err.message}`);
    }
    await sleep(150);
  }

  return saved;
}

async function updateCredits(allSaved) {
  const md = await readFile(CREDITS, 'utf8');

  // Only freshly downloaded paths are re-derived from `allSaved`; every other
  // existing credit line is preserved. This keeps partial runs (a few slugs)
  // and skipped (already-on-disk) images from wiping unrelated attributions.
  const processedPaths = new Set(
    allSaved.filter((s) => !s.skipped).map((s) => s.path),
  );
  const preserved = new Map();
  const block = md.match(
    /<!-- BEGIN:IMAGE-CREDITS \(auto-generated\) -->([\s\S]*?)<!-- END:IMAGE-CREDITS -->/,
  );
  if (block) {
    for (const line of block[1].split('\n')) {
      const m = line.match(/^- `([^`]+)` — /);
      if (m && !processedPaths.has(m[1])) preserved.set(m[1], line.trim());
    }
  }

  for (const item of allSaved) {
    if (item.skipped) continue;
    if (!needsCredit(item.license)) continue;
    preserved.set(item.path, `- \`${item.path}\` — ${item.credit} (${item.license})`);
  }

  const lines = [...preserved.entries()].sort((a, b) => a[0].localeCompare(b[0])).map((e) => e[1]);
  const body =
    lines.length > 0
      ? lines.join('\n')
      : '_No attributed images (all CC0/Public Domain)._';
  const updated = md.replace(
    /<!-- BEGIN:IMAGE-CREDITS \(auto-generated\) -->[\s\S]*?<!-- END:IMAGE-CREDITS -->/,
    `<!-- BEGIN:IMAGE-CREDITS (auto-generated) -->\n${body}\n<!-- END:IMAGE-CREDITS -->`,
  );
  await writeFile(CREDITS, updated, 'utf8');
}

async function main() {
  const onlySlugs = new Set(process.argv.slice(2).filter((a) => !a.startsWith('-')));
  let targets = listImageTargets();
  if (onlySlugs.size > 0) targets = targets.filter((t) => onlySlugs.has(t.slug));
  console.log(`Fetching images for ${targets.length} targets...`);
  const allSaved = [];

  for (const target of targets) {
    const saved = await fetchTarget(target);
    allSaved.push(...saved);
  }

  await updateCredits(allSaved);
  const downloaded = allSaved.filter((s) => !s.skipped).length;
  console.log(`\nDone. ${downloaded} images downloaded this run.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
