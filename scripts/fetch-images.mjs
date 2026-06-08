#!/usr/bin/env node
/**
 * Downloads holiday images from Wikimedia Commons into data/images/<articleKey>/
 * (multiple images per holiday) and records attribution in CREDITS.md.
 *
 * articleKey = the part of `holidays.<key>` after the prefix, shared across
 * countries that use the same labelKey (so Christmas resolves to one folder).
 *
 * This is the Phase 4b skeleton: it defines the search/attribution flow.
 * Wire concrete Commons search terms per articleKey before enabling in CI.
 *
 * Usage: node scripts/fetch-images.mjs
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const IMAGES = join(ROOT, 'data', 'images');
const CREDITS = join(ROOT, 'CREDITS.md');

/** Commons search seeds per articleKey; extend as countries are added. */
const IMAGE_QUERIES = {
  christmas: ['Christmas tree', 'Christmas decorations'],
  german_unity: ['German Unity Day', 'Reichstag building Berlin'],
  easter_monday: ['Easter eggs'],
  good_friday: ['Good Friday procession'],
};

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

async function searchCommons(term, limit = 2) {
  const url =
    `${COMMONS_API}?action=query&format=json&generator=search` +
    `&gsrsearch=${encodeURIComponent('filetype:bitmap ' + term)}` +
    `&gsrnamespace=6&gsrlimit=${limit}` +
    `&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1280`;
  const res = await fetch(url, { headers: { 'User-Agent': 'wishbutler-holiday-data/1.0' } });
  if (!res.ok) throw new Error(`Commons ${res.status}`);
  const json = await res.json();
  const pages = json?.query?.pages ?? {};
  return Object.values(pages)
    .map((p) => p.imageinfo?.[0])
    .filter(Boolean)
    .map((info) => ({
      url: info.thumburl ?? info.url,
      credit: info.extmetadata?.Artist?.value?.replace(/<[^>]+>/g, '') ?? 'Wikimedia Commons',
      license: info.extmetadata?.LicenseShortName?.value ?? 'see source',
    }));
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': 'wishbutler-holiday-data/1.0' } });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
}

async function main() {
  const credits = [];
  for (const [articleKey, terms] of Object.entries(IMAGE_QUERIES)) {
    const dir = join(IMAGES, articleKey);
    await mkdir(dir, { recursive: true });
    let n = 0;
    for (const term of terms) {
      let results = [];
      try {
        results = await searchCommons(term);
      } catch (err) {
        console.warn(`  ${articleKey} "${term}": ${err.message}`);
        continue;
      }
      for (const r of results) {
        n += 1;
        const file = `${String(n).padStart(2, '0')}.jpg`;
        try {
          await download(r.url, join(dir, file));
          credits.push(`- \`images/${articleKey}/${file}\` — ${r.credit} (${r.license})`);
          console.log(`  ${articleKey}/${file}`);
        } catch (err) {
          console.warn(`  ${articleKey}/${file}: ${err.message}`);
        }
      }
    }
  }

  // Update the auto-generated credits block.
  const md = await readFile(CREDITS, 'utf8');
  const block = credits.length > 0 ? credits.join('\n') : '_No images generated yet._';
  const updated = md.replace(
    /<!-- BEGIN:IMAGE-CREDITS \(auto-generated\) -->[\s\S]*?<!-- END:IMAGE-CREDITS -->/,
    `<!-- BEGIN:IMAGE-CREDITS (auto-generated) -->\n${block}\n<!-- END:IMAGE-CREDITS -->`,
  );
  await writeFile(CREDITS, updated, 'utf8');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
