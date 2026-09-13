#!/usr/bin/env node
/**
 * Downloads holiday images into data/images/<slug>/ or data/images/<CC>/<slug>/.
 * Prefers CC0/Public Domain (Wikimedia Commons + Openverse), falls back to
 * CC-BY / CC-BY-SA with attribution recorded in CREDITS.md.
 *
 * Idempotent: skips targets that already have at least one image on disk.
 *
 * Usage: node scripts/fetch-images.mjs [--force] [--fun] [slug ...]
 *   - Pass one or more slugs to only (re)fetch those targets.
 *   - --fun  only the FUN targets (curated fun-days content)
 */
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listImageTargets, termsForSlug } from '../content/image-queries.mjs';
import { classifyLicense, isCc0OrPd, needsCredit, stripHtml } from './lib/imageLicense.mjs';
import { fetchWithTimeout } from './lib/httpClient.mjs';
import { sniffImageType, isImageContentType, MAX_IMAGE_BYTES } from './lib/imageValidation.mjs';
import { funImageTargets, expectedFunDays } from './lib/funDays.mjs';

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
// One curated occasion per calendar day (incl. leap day), minus the days that
// are deliberately left empty in content/fun-days/blackout.json.
const FUN_CONTENT = join(ROOT, 'content', 'fun-days');
const EXPECTED_FUN_TARGETS = expectedFunDays(
  existsSync(join(FUN_CONTENT, 'blackout.json'))
    ? JSON.parse(readFileSync(join(FUN_CONTENT, 'blackout.json'), 'utf8'))
    : {},
).length;

const force = process.argv.includes('--force');

// Rate-limit circuit breaker: a 429 (Openverse also 403 = daily quota) is
// treated as transient at first — warn, cool down 60s, retry once more — and
// only disables the source for the rest of this run after
// RATE_LIMIT_MAX_ATTEMPTS *consecutive* rate limits (a genuine outage/quota
// exhaustion, not a single blip). Any successful response resets the counter.
const RATE_LIMIT_COOLDOWN_MS = 60_000;
const RATE_LIMIT_MAX_ATTEMPTS = 3;
const disabledSources = new Set();
const rateLimitCounts = { commons: 0, openverse: 0 };

function isRateLimitStatus(source, status) {
  return status === 429 || (source === 'openverse' && status === 403);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetches `url` for `source`, retrying with a cooldown on a rate-limit
 * response. Returns `null` once the source has just been disabled (caller
 * treats that like "no results"); otherwise returns the (possibly non-ok)
 * response for the caller to handle.
 */
async function fetchRateLimitAware(source, url, opts) {
  if (disabledSources.has(source)) return null;
  for (;;) {
    const res = await fetchWithTimeout(url, opts);
    if (res.ok) {
      rateLimitCounts[source] = 0;
      return res;
    }
    if (!isRateLimitStatus(source, res.status)) return res;

    rateLimitCounts[source] += 1;
    console.warn(
      `  ${source}: rate limited (HTTP ${res.status}), ` +
        `consecutive=${rateLimitCounts[source]}/${RATE_LIMIT_MAX_ATTEMPTS}`,
    );
    if (rateLimitCounts[source] >= RATE_LIMIT_MAX_ATTEMPTS) {
      disabledSources.add(source);
      console.warn(
        `  ${source}: disabling for the rest of this run ` +
          `after ${RATE_LIMIT_MAX_ATTEMPTS} consecutive rate limits`,
      );
      return null;
    }
    await sleep(RATE_LIMIT_COOLDOWN_MS);
  }
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
  // `NN.thumb.jpg`-Sidecars (build-thumbnails.mjs) zaehlen nicht als Bild —
  // sonst wuerden sie im Skip-Pfad als Paket-Refs zurueckgegeben.
  return entries.filter((f) => /\.jpe?g$/i.test(f) && !/\.thumb\.jpe?g$/i.test(f)).sort();
}

async function searchCommonsTitles(term, limit = 12) {
  const url =
    `${COMMONS_API}?action=query&format=json&list=search` +
    `&srsearch=${encodeURIComponent('filetype:bitmap ' + term)}` +
    `&srnamespace=6&srlimit=${limit}`;
  const res = await fetchRateLimitAware('commons', url, {
    headers: { 'User-Agent': USER_AGENT },
    timeoutMs: 20000,
    retries: 1,
  });
  if (!res) return [];
  if (!res.ok) throw new Error(`Commons search ${res.status}`);
  const json = await res.json();
  return (json?.query?.search ?? []).map((r) => r.title);
}

async function getCommonsImageInfo(title, thumbWidth = THUMB_WIDTH) {
  const url =
    `${COMMONS_API}?action=query&format=json` +
    `&titles=${encodeURIComponent(title)}` +
    `&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=${thumbWidth}`;
  const res = await fetchRateLimitAware('commons', url, {
    headers: { 'User-Agent': USER_AGENT },
    timeoutMs: 20000,
    retries: 1,
  });
  if (!res) return undefined;
  if (!res.ok) throw new Error(`Commons info ${res.status}`);
  const json = await res.json();
  const pages = json?.query?.pages ?? {};
  const page = Object.values(pages)[0];
  return page?.imageinfo?.[0];
}

async function searchOpenverse(term, cc0Only, limit = 10) {
  // Openverse-Lizenzcodes: `pdm` = Public Domain Mark (`publicdomain` ergibt HTTP 400).
  const license = cc0Only ? 'cc0,pdm' : 'cc0,pdm,by,by-sa';
  const url =
    `${OPENVERSE_API}?q=${encodeURIComponent(term)}` +
    `&license=${license}&page_size=${limit}&format=json`;
  const res = await fetchRateLimitAware('openverse', url, {
    headers: { 'User-Agent': USER_AGENT },
    timeoutMs: 20000,
    retries: 1,
  });
  if (!res) return [];
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

/**
 * Openverse liefert Kurzcodes (`cc0`, `pdm`, `by`, `by-sa`) plus `license_version`;
 * `classifyLicense` erwartet die Commons-Schreibweise (`CC0`, `Public domain`,
 * `CC BY 2.0`). Ohne diese Abbildung wurden alle Openverse-Treffer verworfen.
 */
function openverseLicenseName(result) {
  const code = String(result.license ?? '').toLowerCase();
  const version = result.license_version ? ` ${result.license_version}` : '';
  if (code === 'cc0') return 'CC0';
  if (code === 'pdm') return 'Public domain';
  if (code === 'by') return `CC BY${version}`;
  if (code === 'by-sa') return `CC BY-SA${version}`;
  return '';
}

function openverseCandidate(result) {
  const url = result.url ?? result.thumbnail;
  if (!url) return null;
  if ((result.width ?? 0) < MIN_WIDTH || (result.height ?? 0) < MIN_HEIGHT) return null;
  const license = classifyLicense(openverseLicenseName(result));
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

async function collectCandidates(terms, { cc0Only, thumbWidth = THUMB_WIDTH }) {
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
          const info = await getCommonsImageInfo(title, thumbWidth);
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

// #131: Bild-Download gehaertet — https, Timeout/Retry, Content-Type image/*,
// Groessenobergrenze und Magic-Byte-Pruefung, bevor irgendetwas ins Repo geschrieben wird.
async function download(url, dest, maxBytes = MAX_IMAGE_BYTES) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('invalid image url');
  }
  if (parsed.protocol !== 'https:') throw new Error(`non-https image url (${parsed.protocol})`);

  const res = await fetchWithTimeout(url, {
    headers: { 'User-Agent': USER_AGENT },
    timeoutMs: 20000,
    retries: 2,
    backoffMs: 500,
  });
  if (!res.ok) throw new Error(`download ${res.status}`);
  if (!isImageContentType(res.headers.get('content-type'))) {
    throw new Error(`unexpected content-type ${res.headers.get('content-type') ?? 'none'}`);
  }
  const declaredLen = Number(res.headers.get('content-length') ?? 0);
  if (declaredLen && declaredLen > maxBytes) {
    throw new Error(`image too large (${declaredLen} bytes > ${maxBytes})`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > maxBytes) {
    throw new Error(`image too large (${buf.length} bytes > ${maxBytes})`);
  }
  if (!sniffImageType(buf)) throw new Error('not a recognized image (magic bytes)');
  await writeFile(dest, buf);
  return buf.length;
}

async function fetchTarget(target) {
  const { slug, countryCode } = target;
  const maxImages = target.maxImages ?? MAX_IMAGES;
  const thumbWidth = target.thumbWidth ?? THUMB_WIDTH;
  const maxBytes = target.maxBytes ?? MAX_IMAGE_BYTES;
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

  let candidates = [];
  if (target.file) {
    // Kuratierter Commons-Dateititel (content/fun-days: `imageFile`): kein
    // Suchlauf, genau diese Datei wird geprüft (Lizenz, Maße) und geholt.
    try {
      const info = await getCommonsImageInfo(target.file, thumbWidth);
      const c = commonsCandidate(info, target.file);
      if (c) candidates.push(c);
      else console.warn(`  ${label}: curated file rejected (missing, unfree licence or too small): ${target.file}`);
    } catch (err) {
      console.warn(`  ${label}: curated file lookup failed: ${err.message}`);
    }
  }

  const terms = target.terms ?? termsForSlug(slug, countryCode);
  if (candidates.length === 0 && terms.length === 0) {
    console.warn(`  ${label}: no search terms`);
    return [];
  }

  if (candidates.length === 0) candidates = await collectCandidates(terms, { cc0Only: true, thumbWidth });
  if (!target.file && candidates.length < maxImages) {
    const fallback = await collectCandidates(terms, { cc0Only: false, thumbWidth });
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

  // Kandidaten der Reihe nach probieren, bis maxImages gespeichert sind — ein
  // fehlgeschlagener Download (Timeout, zu groß, kein Bild) überspringt nur
  // diesen Kandidaten statt den Slug ohne Bild zu lassen. Nur VOR einem
  // weiteren Versuch schlafen, nicht mehr nach dem letzten erfolgreichen
  // Download (unnoetige Wartezeit, wenn maxImages schon erreicht ist).
  for (let i = 0; i < candidates.length; i++) {
    if (saved.length >= maxImages) break;
    const c = candidates[i];
    const file = `${String(saved.length + 1).padStart(2, '0')}.jpg`;
    const dest = join(dir, file);
    try {
      const bytes = await download(c.url, dest, maxBytes);
      saved.push({
        path: imageRelPath(slug, countryCode, file),
        file,
        credit: c.author || (c.source === 'wikimedia' ? 'Wikimedia Commons' : 'Openverse'),
        license: c.license,
        primary: saved.length === 0,
        cc0: c.cc0,
        bytes,
        title: c.title,
        sourceUrl: c.descriptionurl || '',
      });
      console.log(
        `  ${label}/${file}: ${c.license.padEnd(16)} ${(bytes / 1024).toFixed(0)} KB`,
      );
    } catch (err) {
      console.warn(`  ${label}/${file}: ${err.message}`);
    }
    const hasMoreWork = saved.length < maxImages && i + 1 < candidates.length;
    if (hasMoreWork) await sleep(150);
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
    // Quell-URL (Commons-Dateiseite) hinten anhängen, s. imageCredits.mjs.
    const source = /^https?:\/\/\S+$/.test(item.sourceUrl ?? '') ? ` — <${item.sourceUrl}>` : '';
    preserved.set(item.path, `- \`${item.path}\` — ${item.credit} (${item.license})${source}`);
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
  const args = process.argv.slice(2);
  const onlyFun = args.includes('--fun');
  // Ziel-Filter: `slug` (alle Laender mit diesem Slug) oder `CC/slug` (nur dieses
  // Land — wichtig bei --force, damit z. B. `EG/revolution_day` nicht auch die
  // kuratierten MX-Bilder ueberschreibt).
  const only = args.filter((a) => !a.startsWith('-'));

  // FUN targets only get pulled in on an explicit --fun run, never on the
  // unscoped monthly CI build (build-all.mjs calls fetch-images.mjs with no
  // arguments) — the curated fun-days content is authored/reviewed separately.
  let targets;
  if (onlyFun) {
    targets = await funImageTargets(FUN_CONTENT);
    // Refers to the full FUN set, before any slug filter narrows it down.
    if (targets.length !== EXPECTED_FUN_TARGETS) {
      console.warn(
        `fetch-images --fun: expected ${EXPECTED_FUN_TARGETS} targets, got ${targets.length}`,
      );
    }
  } else {
    targets = listImageTargets();
  }
  if (only.length > 0) {
    targets = targets.filter((t) =>
      only.some((arg) => arg === t.slug || arg === `${t.countryCode ?? ''}/${t.slug}`),
    );
  }

  // Checked AFTER the slug filter so `--fun <typo>` fails loudly (exit 1)
  // instead of silently doing nothing with exit 0.
  if (onlyFun && targets.length === 0) {
    const scope = only.length > 0 ? only.join(', ') : '(content/fun-days missing or empty)';
    console.error(`fetch-images --fun: no targets match ${scope}`);
    process.exit(1);
  }

  console.log(`Fetching images for ${targets.length} targets...`);
  const allSaved = [];
  const missing = [];

  for (const target of targets) {
    const saved = await fetchTarget(target);
    if (saved.length === 0) missing.push(target);
    allSaved.push(...saved);
  }

  await updateCredits(allSaved);
  const downloaded = allSaved.filter((s) => !s.skipped).length;
  const rateLimited =
    disabledSources.size > 0 ? ` RATE-LIMITED: ${[...disabledSources].join(', ')}.` : '';
  console.log(
    `\nDone. ${downloaded} images downloaded this run. ` +
      `${missing.length} targets without image.${rateLimited}`,
  );
  for (const t of missing) {
    console.log(`  MISSING ${t.countryCode ? `${t.countryCode}/` : ''}${t.slug}`);
  }

  // A run that got throttled mid-way must not look green — a 2h batch that
  // silently stopped fetching after a 429 would otherwise pass as success.
  if (disabledSources.size > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
