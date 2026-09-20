#!/usr/bin/env node
/**
 * Holt je Gedenk-/Aktionstag EIN Bild von Wikimedia Commons nach
 * content/memorial/image-queries.mjs und schreibt
 *   data/images/MEMORIAL/<slug>/01.jpg     (1280 px breit)
 *   content/memorial/images.json           (Provenienz je Eintrag)
 *   CREDITS.md                             (eine Zeile je Bild, auch Public Domain/CC0 — G-10)
 *
 * Lizenzrang: Public Domain / CC0 > CC BY > CC BY-SA (alle frei weiterverteilbar;
 * `classifyLicense` verwirft alles andere). Quality Images und größere Bilder
 * werden bevorzugt. Idempotent: Einträge mit Bild auf Platte werden übersprungen
 * (`--force` erzwingt, `--only=<id,…>` beschränkt).
 *
 * Usage: node scripts/fetch-memorial-images.mjs [--force] [--only=MEMORIAL_X,…] [--dry-run]
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MEMORIAL_IMAGE_QUERIES } from '../content/memorial/image-queries.mjs';
import { classifyLicense, isCc0OrPd, stripHtml } from './lib/imageLicense.mjs';
import { fetchWithTimeout } from './lib/httpClient.mjs';
import { sniffImageType, isImageContentType, MAX_IMAGE_BYTES } from './lib/imageValidation.mjs';
import { commonsFileUrl, formatCreditLine } from './lib/imageCredits.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = join(ROOT, 'content', 'memorial', 'catalog.json');
const IMAGES_JSON = join(ROOT, 'content', 'memorial', 'images.json');
const CREDITS = join(ROOT, 'CREDITS.md');
const IMAGES_DIR = join(ROOT, 'data', 'images', 'MEMORIAL');

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'wishbutler-holiday-data/1.0 (https://github.com/RootTwoLabs/wishbutler-holiday-data)';
const THUMB_WIDTH = 1280;
const MIN_WIDTH = 900;
const MIN_HEIGHT = 500;
const SEARCH_LIMIT = 10;
/** Motive, die auf einer Gedenkkarte nichts verloren haben (Titel/Kategorien). */
const AVOID_RE = /corpse|dead body|execution|massacre photo|nude|porn|logo|map|flag of .* svg|\.svg$|coat of arms|stamp|banknote|coin|book cover|poster|screenshot|diagram|chart/i;

const args = process.argv.slice(2);
const force = args.includes('--force');
const dryRun = args.includes('--dry-run');
const onlyArg = args.find((a) => a.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice(7).split(',').map((s) => s.trim())) : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slugOf = (id) => id.replace(/^MEMORIAL_/, '').toLowerCase();

async function getJson(url) {
  const res = await fetchWithTimeout(url, { headers: { 'User-Agent': USER_AGENT }, timeoutMs: 20000, retries: 2, backoffMs: 800 });
  if (res.status === 429) {
    await sleep(30_000);
    return getJson(url);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

/** Suche + Bildinfo in einem Aufruf (generator=search), inkl. Kategorien für den Quality-Bonus. */
async function searchCommons(term) {
  const url =
    `${COMMONS_API}?action=query&format=json&generator=search` +
    `&gsrsearch=${encodeURIComponent(`${term} filetype:bitmap`)}&gsrnamespace=6&gsrlimit=${SEARCH_LIMIT}` +
    `&prop=imageinfo|categories&iiprop=url|size|mime|extmetadata&iiurlwidth=${THUMB_WIDTH}` +
    `&clshow=!hidden&cllimit=20`;
  const json = await getJson(url);
  return Object.values(json?.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
}

async function infoForFile(title) {
  const url =
    `${COMMONS_API}?action=query&format=json&titles=${encodeURIComponent(title)}` +
    `&prop=imageinfo|categories&iiprop=url|size|mime|extmetadata&iiurlwidth=${THUMB_WIDTH}&clshow=!hidden&cllimit=20`;
  const json = await getJson(url);
  return Object.values(json?.query?.pages ?? {})[0];
}

const STOPWORDS = new Set(['the', 'and', 'with', 'from', 'day', 'monument', 'memorial', 'statue', 'flag', 'view', 'city', 'national', 'square', 'park', 'people']);

/** Signifikante Suchwörter (≥ 4 Zeichen, keine Füllwörter), zum Abgleich mit Titel/Kategorien. */
function tokensOf(term) {
  return term
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]+/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

function candidateFrom(page, rank, avoid, term = '', curated = false) {
  const info = page?.imageinfo?.[0];
  if (!info?.thumburl || info.mime !== 'image/jpeg') return null;
  if (info.width < MIN_WIDTH || info.height < MIN_HEIGHT) return null;
  // Hochkant liest sich im 16:9-Hero schlecht — bei einer kuratierten Datei
  // hat der Mensch das bewusst entschieden.
  if (!curated && info.width < info.height * 0.9) return null;
  const licenseRaw = stripHtml(page.imageinfo[0].extmetadata?.LicenseShortName?.value ?? '');
  const license = classifyLicense(licenseRaw);
  if (!license) return null;
  const cats = (page.categories ?? []).map((c) => c.title.replace(/^Category:/, ''));
  const haystack = `${page.title} ${cats.join(' ')}`;
  if (AVOID_RE.test(haystack) || (avoid && avoid.test(haystack))) return null;
  const quality = cats.some((c) => /^(Quality images|Featured pictures|Valued images)/.test(c));
  const cc0 = isCc0OrPd(license);
  const byOnly = /^cc[ -]?by(?:[ -]\d|$)/i.test(license);
  // Stichwort-Abgleich: Jedes signifikante Suchwort im Titel zählt stark, in
  // den Kategorien schwächer — ein Public-Domain-Foto ohne jeden Bezug zum
  // Motiv (Flugzeugträger für „Lincoln") darf nicht gewinnen.
  const title = page.title.toLowerCase();
  const catText = cats.join(' ').toLowerCase();
  let overlap = 0;
  for (const tok of tokensOf(term)) {
    if (title.includes(tok)) overlap += 30;
    else if (catText.includes(tok)) overlap += 12;
  }
  // Score: Relevanz (Suchrang + Stichworte) dominiert; freie Lizenzen sind alle
  // zulässig und geben nur einen kleinen Bonus; Qualität und Größe dahinter.
  const score = overlap - rank * 8 + (quality ? 15 : 0) + (cc0 ? 10 : byOnly ? 6 : 0) + Math.min(10, Math.floor(info.width / 600));
  return {
    title: page.title,
    url: info.thumburl,
    width: info.width,
    height: info.height,
    license,
    author: stripHtml(info.extmetadata?.Artist?.value ?? '') || 'Wikimedia Commons',
    sourceUrl: commonsFileUrl(page.title) ?? info.descriptionurl,
    quality,
    cc0,
    score,
  };
}

async function download(url, dest) {
  const res = await fetchWithTimeout(url, { headers: { 'User-Agent': USER_AGENT }, timeoutMs: 30000, retries: 2, backoffMs: 800 });
  if (!res.ok) throw new Error(`download ${res.status}`);
  if (!isImageContentType(res.headers.get('content-type'))) throw new Error('not an image content-type');
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_IMAGE_BYTES) throw new Error('image too large');
  if (sniffImageType(buf) !== 'jpeg') throw new Error('not a JPEG');
  await writeFile(dest, buf);
  return buf.length;
}

async function pickFor(id, spec) {
  const avoid = spec.avoid ? new RegExp(spec.avoid.join('|'), 'i') : null;
  if (spec.file) {
    const page = await infoForFile(spec.file);
    const c = candidateFrom(page, 0, null, '', true);
    if (c) return { ...c, score: 100 };
    console.warn(`  ${id}: kuratierte Datei verworfen (${spec.file})`);
  }
  const candidates = new Map();
  for (const [t, term] of (spec.terms ?? []).entries()) {
    try {
      const pages = await searchCommons(term);
      pages.forEach((page, i) => {
        // Spätere Suchbegriffe sind Rückfall: Rangabschlag je Begriff.
        const c = candidateFrom(page, i + t * 4, avoid, term);
        if (c && !candidates.has(c.url)) candidates.set(c.url, c);
      });
    } catch (err) {
      console.warn(`  ${id}: Suche "${term}" fehlgeschlagen: ${err.message}`);
    }
    await sleep(250);
  }
  const best = [...candidates.values()].sort((a, b) => b.score - a.score)[0] ?? null;
  // Ohne jeden Stichwortbezug lieber kein Bild als ein falsches.
  if (best && best.score < 20) {
    console.warn(`  ${id}: bester Kandidat zu schwach (${best.score}): ${best.title}`);
    return null;
  }
  return best;
}

function creditLine(path, c) {
  return formatCreditLine({ path, credit: c.author, license: c.license, sourceUrl: c.sourceUrl });
}

async function updateCredits(entries) {
  let md = await readFile(CREDITS, 'utf8');
  const block = md.match(/<!-- BEGIN:IMAGE-CREDITS \(auto-generated\) -->([\s\S]*?)<!-- END:IMAGE-CREDITS -->/);
  if (!block) throw new Error('CREDITS.md: IMAGE-CREDITS-Block fehlt');
  const lines = new Map();
  for (const line of block[1].split('\n')) {
    const m = line.match(/^- `([^`]+)` — /);
    if (m) lines.set(m[1], line.trim());
  }
  // G-10: jede Datei bekommt eine Zeile, auch Public Domain/CC0 (frueher wurde
  // die Zeile dort geloescht — validate.mjs verlangt sie jetzt fuer jede Datei).
  for (const [path, c] of entries) lines.set(path, creditLine(path, c));
  const body = [...lines.entries()].sort((a, b) => a[0].localeCompare(b[0])).map((e) => e[1]).join('\n');
  md = md.replace(block[0], `<!-- BEGIN:IMAGE-CREDITS (auto-generated) -->\n${body}\n<!-- END:IMAGE-CREDITS -->`);
  await writeFile(CREDITS, md, 'utf8');
}

async function main() {
  const rows = JSON.parse(await readFile(CATALOG, 'utf8'));
  const images = existsSync(IMAGES_JSON) ? JSON.parse(await readFile(IMAGES_JSON, 'utf8')) : {};
  const credits = new Map();
  let fetched = 0;
  let missing = 0;
  for (const { definition } of rows) {
    const id = definition.id;
    if (only && !only.has(id)) continue;
    const spec = MEMORIAL_IMAGE_QUERIES[id];
    if (!spec) {
      console.warn(`  ${id}: keine Suchbegriffe`);
      missing += 1;
      continue;
    }
    const slug = slugOf(id);
    const relPath = `images/MEMORIAL/${slug}/01.jpg`;
    const dest = join(IMAGES_DIR, slug, '01.jpg');
    if (!force && existsSync(dest) && images[id]?.path === relPath) {
      console.log(`  ${id}: skip (auf Platte)`);
      continue;
    }
    const c = await pickFor(id, spec);
    if (!c) {
      console.warn(`  ${id}: KEIN TREFFER`);
      missing += 1;
      continue;
    }
    console.log(`  ${id}: ${c.license.padEnd(14)} ${c.quality ? 'QI ' : '   '}${c.width}x${c.height} ${c.title}`);
    if (dryRun) continue;
    await mkdir(dirname(dest), { recursive: true });
    try {
      await download(c.url, dest);
    } catch (err) {
      console.warn(`  ${id}: Download fehlgeschlagen: ${err.message}`);
      missing += 1;
      continue;
    }
    images[id] = {
      path: relPath,
      file: c.title,
      license: c.license,
      author: c.author,
      source: c.sourceUrl,
      downloadUrl: c.url,
      width: c.width,
      height: c.height,
      checkedAt: new Date().toISOString().slice(0, 10),
    };
    credits.set(relPath, c);
    fetched += 1;
    await sleep(200);
  }
  if (!dryRun) {
    // Alte Motivschlüssel (candle/flowers/books) bleiben erhalten, solange sie
    // im Bundle der App referenziert werden könnten — build-memorial nutzt sie
    // nur noch als Rückfall für Einträge ohne eigenes Bild.
    await writeFile(IMAGES_JSON, `${JSON.stringify(images, null, 2)}\n`, 'utf8');
    if (credits.size > 0) await updateCredits(credits);
  }
  console.log(`\n${fetched} Bilder geholt, ${missing} ohne Bild`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
