#!/usr/bin/env node
/**
 * Bild-Kuratierung nach fetch-images.mjs (die Commons/Openverse-Treffer sind
 * Zufallsware und werden gesichtet):
 *
 *   node scripts/curate-images.mjs promote <dir> <n> [--no-bump]  # <n>.jpg wird Titelbild (Tausch mit 01.jpg)
 *   node scripts/curate-images.mjs drop <dir> <n>    [--no-bump]  # <n>.jpg loeschen, folgende ruecken nach
 *
 * <dir> relativ zu data/images, z. B. `IL/rosh_hashanah` oder `pentecost`.
 * Die Attributionszeilen in CREDITS.md (Pfad -> Credit) werden mit umbenannt
 * bzw. entfernt, damit build-articles.mjs die richtigen Credits zuordnet
 * (Kern in lib/imageCuration.mjs, offline getestet).
 *
 * Thumbnail-Sidecars (`NN.thumb.jpg`, s. build-thumbnails.mjs) werden von
 * promote/drop nicht mitgezaehlt (Filter `^\d\d\.jpg$`). Nach dem Umbenennen
 * passen sie aber nicht mehr zu ihren Originalen, daher werden alle Thumbs des
 * Ordners geloescht — anschliessend `npm run build:thumbnails -- <dir>` laufen lassen.
 *
 * G-7 (c) — Versions-Bump nach dem Dateitausch (Audit 2026-09-20):
 * promote/drop aendern Bildbytes UNTER GLEICHEM PFAD; das Paket-JSON merkt das
 * nur, wenn sich dabei der Credit aendert. Deshalb wird hier direkt danach —
 * offline, gleiche Mechanik wie build-articles — der Content-Merge fuer jedes
 * Paket ausgefuehrt, das den Ordner referenziert:
 *   - das BESITZENDE Paket (`<CC>/…` -> Land, globaler Slug -> GLOBAL) wird
 *     mit `force: true` gebumpt, auch bei byte-gleichem Inhalt;
 *   - weitere referenzierende Pakete (globale Ordner wie `new_year` haengen an
 *     ~120 Laenderpaketen) werden nur bei Inhaltsaenderung (Credit/Lizenz)
 *     gebumpt — die App loest Bild-URIs gegen die tag-gepinnte Basis-URL auf,
 *     ein neuer Daten-Tag liefert die neuen Bytes dort ohnehin;
 *   - FUN und MEMORIAL haben eigene Generatoren mit Content-Validierung; fuer
 *     sie wird der genaue Befehl ausgegeben (`FUN_VERSION=<prev+1>`, das seit
 *     G-7 (b) nur noch vorwaerts erlaubt ist).
 * `--no-bump` ueberspringt den Schritt (z. B. mehrere Ordner nacheinander) —
 * dann ist der Bump Pflicht, bevor committet wird.
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promoteImage, dropImage, packageCodeForImageDir, referencingPackages } from './lib/imageCuration.mjs';
import { PACKAGES, readLatestPackage, writePackageIfChanged, listVersions } from './lib/packageWriter.mjs';
import { loadMergeContext, mergeContent, buildGlobalContent } from './build-articles.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CREDITS = join(ROOT, 'CREDITS.md');
const IMAGES = join(ROOT, 'data', 'images');

const args = process.argv.slice(2);
const noBump = args.includes('--no-bump');
const [cmd, dir, nArg] = args.filter((a) => !a.startsWith('-'));
const n = Number(nArg);
if (!['promote', 'drop'].includes(cmd) || !dir || !Number.isInteger(n) || n < 1) {
  console.error('usage: curate-images.mjs promote|drop <dir> <n> [--no-bump]');
  process.exit(1);
}

const op = cmd === 'promote' ? promoteImage : dropImage;
const result = await op({ imagesRoot: IMAGES, creditsPath: CREDITS, dir, n });
console.log(cmd === 'promote' ? `${dir}: ${String(n).padStart(2, '0')}.jpg -> 01.jpg` : `${dir}: ${String(n).padStart(2, '0')}.jpg geloescht`);
if (result.staleThumbs > 0) {
  console.log(`${dir}: ${result.staleThumbs} Thumbnail(s) geloescht — jetzt \`npm run build:thumbnails -- ${dir}\` ausfuehren`);
}

/** G-7 (c): Pakete nachziehen, die den Ordner referenzieren (s. Kopfkommentar). */
async function bumpReferencingPackages() {
  const owner = packageCodeForImageDir(dir);
  const codes = [...new Set([owner, ...(await referencingPackages(dir, PACKAGES))])];
  const ctx = await loadMergeContext();
  const bumped = [];
  const manual = [];

  for (const code of codes) {
    if (code === 'FUN' || code === 'MEMORIAL') {
      const prev = (await listVersions(join(PACKAGES, code))).at(-1) ?? 0;
      manual.push(
        code === 'FUN'
          ? `FUN_VERSION=${prev + 1} npm run build:fun-occasions`
          : `npm run build:memorial   (MEMORIAL v${prev}; bumpt nur bei Inhaltsaenderung)`,
      );
      continue;
    }
    const latest = await readLatestPackage(code);
    if (!latest && code !== 'GLOBAL') continue;
    const content =
      code === 'GLOBAL'
        ? await buildGlobalContent(ctx.globalArticles, ctx.creditHints)
        : await mergeContent(code, latest.pkg, ctx);
    const { version, changed } = await writePackageIfChanged(code, content, { force: code === owner });
    if (changed) bumped.push(`${code} v${latest?.version ?? 0}->v${version}${code === owner ? ' (erzwungen)' : ''}`);
  }

  console.log(`Bump: ${bumped.join(', ') || 'keine Paketaenderung'}`);
  if (manual.length > 0) console.log(`Manuell nachziehen:\n  ${manual.join('\n  ')}`);
  return bumped.length;
}

if (noBump) {
  console.warn(`--no-bump: Paket ${packageCodeForImageDir(dir)} wurde NICHT gebumpt — vor dem Commit nachholen (erneut ohne --no-bump oder build:articles).`);
} else {
  const count = await bumpReferencingPackages();
  if (count > 0) console.log('Jetzt: npm run build:index && npm run validate');
}
