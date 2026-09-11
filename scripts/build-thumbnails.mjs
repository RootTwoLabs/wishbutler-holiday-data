#!/usr/bin/env node
/**
 * Thumbnails für die Bildordner unter data/images/ (Konvention, kein Paketinhalt).
 *
 * Warum: Die App zeigt Feiertagsbilder in Listen als 52-px-Kreise. Die
 * Vollbilder sind ~1 MB (1024 px, Commons-Original), und jsDelivr skaliert
 * nicht — jede Listenzeile würde also ein Megabyte laden. Ein 192×192-Thumb
 * (2×–3× Retina für 52 px) liegt bei ~5–15 KB.
 *
 * Konvention (die App leitet die Thumb-URL selbst ab, es gibt KEIN Feld im
 * Paket dafür):
 *   images/<…>/NN.jpg  ->  images/<…>/NN.thumb.jpg
 * Die App ersetzt `.jpg` am Ende von `path` durch `.thumb.jpg`; antwortet der
 * CDN mit 404 (Thumb noch nicht gebaut), fällt sie auf das Vollbild zurück.
 *
 * Thumbs werden NICHT in Paketen referenziert: contentLoader.buildImageRefs
 * und fetch-images.listExistingJpegs schließen `*.thumb.jpg` aus, damit weder
 * Paket-Refs noch die Versionierung (build-fun-occasions/build-articles) davon
 * berührt werden. CI baut Thumbs nicht — nach jedem `fetch-images` lokal
 * `npm run build:thumbnails` laufen lassen und die Sidecars mit einchecken.
 *
 * Usage:
 *   npm run build:thumbnails                 # alle fehlenden/veralteten Thumbs
 *   npm run build:thumbnails -- FUN          # nur Pfade unter data/images/FUN
 *   npm run build:thumbnails -- --force christmas  # neu erzeugen, auch wenn aktuell
 *
 * Idempotent: Ein Thumb wird übersprungen, wenn es existiert und (per mtime)
 * neuer als sein Original ist. `--force` regeneriert alles.
 */
import { readdir, stat } from 'node:fs/promises';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DEFAULT_IMAGES_ROOT = join(ROOT, 'data', 'images');

export const THUMB_SIZE = 192;
export const THUMB_QUALITY = 80;
/** Nur die nummerierten Originale (`01.jpg`), keine Sidecars, keine Fremddateien. */
export const ORIGINAL_RE = /^\d\d\.jpe?g$/i;
export const THUMB_RE = /\.thumb\.jpe?g$/i;

/** `NN.jpg` / `NN.jpeg` -> `NN.thumb.jpg` (Thumbs sind immer .jpg). */
export function thumbPathFor(originalPath) {
  return originalPath.replace(/\.jpe?g$/i, '.thumb.jpg');
}

/** Alle Originale unter `root` (rekursiv, sortiert, absolute Pfade). */
export async function findOriginals(root) {
  const out = [];
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const abs = join(dir, e.name);
      if (e.isDirectory()) await walk(abs);
      else if (e.isFile() && ORIGINAL_RE.test(e.name) && !THUMB_RE.test(e.name)) out.push(abs);
    }
  }
  await walk(root);
  return out;
}

async function statOrNull(path) {
  try {
    return await stat(path);
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

/** Pfad-Präfix-Filter: `FUN` trifft `FUN/…`, `christmas` trifft `christmas/…` (nicht `christmas_eve`). */
function matchesPrefix(relPath, prefixes) {
  if (prefixes.length === 0) return true;
  const posix = relPath.split(sep).join('/');
  return prefixes.some((p) => {
    const norm = p.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    return posix === norm || posix.startsWith(`${norm}/`);
  });
}

/**
 * Kernfunktion (testbar): baut Thumbs für alle Originale unter `imagesRoot`.
 * Rückgabe: { built, skipped, totalBytes, files: [thumbPath…] }.
 */
export async function buildThumbnails({ imagesRoot = DEFAULT_IMAGES_ROOT, force = false, prefixes = [], log = () => {} } = {}) {
  const originals = (await findOriginals(imagesRoot)).filter((abs) => matchesPrefix(relative(imagesRoot, abs), prefixes));
  let built = 0;
  let skipped = 0;
  let totalBytes = 0;
  const files = [];

  for (const original of originals) {
    const thumb = thumbPathFor(original);
    const [origStat, thumbStat] = await Promise.all([stat(original), statOrNull(thumb)]);
    if (!force && thumbStat && thumbStat.mtimeMs > origStat.mtimeMs) {
      skipped += 1;
      totalBytes += thumbStat.size;
      files.push(thumb);
      continue;
    }
    // Keine Metadaten: sharp schreibt standardmäßig weder EXIF noch ICC —
    // `withMetadata()` bewusst NICHT aufrufen (Thumbs sollen minimal bleiben).
    const info = await sharp(original)
      .rotate() // EXIF-Orientierung einbacken, sonst kippt das Thumb ohne Metadaten
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: THUMB_QUALITY, mozjpeg: true })
      .toFile(thumb);
    built += 1;
    totalBytes += info.size;
    files.push(thumb);
    log(`  ${relative(imagesRoot, thumb)} (${(info.size / 1024).toFixed(1)} KB)`);
  }

  return { built, skipped, totalBytes, files };
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const prefixes = args.filter((a) => !a.startsWith('--'));
  const started = Date.now();

  const result = await buildThumbnails({ force, prefixes, log: (line) => console.log(line) });

  const scope = prefixes.length > 0 ? ` (Filter: ${prefixes.join(', ')})` : '';
  console.log(
    `build-thumbnails${scope}: ${result.built} erzeugt, ${result.skipped} übersprungen, ` +
      `${result.files.length} Thumbs gesamt ${formatBytes(result.totalBytes)}, ` +
      `${((Date.now() - started) / 1000).toFixed(1)} s`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
