/**
 * Kern der Bild-Kuratierung (curate-images.mjs), ohne CLI und ohne Paket-Bump —
 * damit promote/drop offline testbar sind.
 *
 * Dateien `NN.jpg` in data/images/<dir>/ werden getauscht (promote) oder
 * geloescht + nachgerueckt (drop); die Attributionszeilen in CREDITS.md
 * (Pfad -> Credit) wandern mit. Thumbnail-Sidecars (`NN.thumb.jpg`) des
 * Ordners werden geloescht, weil ihre NN-Zuordnung danach nicht mehr stimmt.
 */
import { readFile, writeFile, rename, unlink, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { listVersions } from './packageWriter.mjs';

export const IMAGE_FILE_RE = /^\d\d\.jpg$/;
const THUMB_RE = /\.thumb\.jpe?g$/i;
const CREDITS_BLOCK_RE = /(<!-- BEGIN:IMAGE-CREDITS \(auto-generated\) -->\n)([\s\S]*?)(<!-- END:IMAGE-CREDITS -->)/;

/**
 * Welches Paket "besitzt" einen Bildordner: `FUN/<slug>` -> FUN,
 * `MEMORIAL/<slug>` -> MEMORIAL, `<CC>/<slug>` -> Laenderpaket, alles andere
 * (globale Slugs wie `pentecost`) -> GLOBAL.
 */
export function packageCodeForImageDir(dir) {
  const top = dir.split('/')[0];
  if (top === 'FUN' || top === 'MEMORIAL' || /^[A-Z]{2}$/.test(top)) return top;
  return 'GLOBAL';
}

const fileName = (i) => `${String(i).padStart(2, '0')}.jpg`;

/** Zeilenbasierter Zugriff auf den Credit-Block (Pfad -> Zeile). LF-normalisiert (G-2). */
function creditsEditor(text) {
  let credits = text.replace(/\r\n/g, '\n');
  const lineFor = (path) => credits.split('\n').find((l) => l.startsWith(`- \`${path}\` — `)) ?? null;
  const set = (path, line) => {
    credits = credits.split('\n').filter((l) => !l.startsWith(`- \`${path}\` — `)).join('\n');
    if (line) credits = credits.replace('<!-- END:IMAGE-CREDITS -->', `${line}\n<!-- END:IMAGE-CREDITS -->`);
  };
  const sorted = () => {
    const m = credits.match(CREDITS_BLOCK_RE);
    if (!m) return credits;
    const lines = m[2].split('\n').filter((l) => l.startsWith('- `')).sort();
    return credits.replace(m[0], `${m[1]}${lines.join('\n')}\n${m[3]}`);
  };
  return { lineFor, set, sorted };
}

async function deleteStaleThumbs(abs) {
  const stale = (await readdir(abs)).filter((f) => THUMB_RE.test(f));
  for (const f of stale) await unlink(join(abs, f));
  return stale.length;
}

/**
 * `<n>.jpg` wird Titelbild (Tausch mit 01.jpg). Credits tauschen mit.
 * @returns {{ dir: string, swapped: boolean, staleThumbs: number }}
 */
export async function promoteImage({ imagesRoot, creditsPath, dir, n }) {
  const abs = join(imagesRoot, dir);
  const rel = (f) => `images/${dir}/${f}`;
  const editor = creditsEditor(await readFile(creditsPath, 'utf8'));

  let swapped = false;
  if (n !== 1) {
    const a = editor.lineFor(rel(fileName(1)));
    const b = editor.lineFor(rel(fileName(n)));
    await rename(join(abs, fileName(1)), join(abs, 'tmp.jpg'));
    await rename(join(abs, fileName(n)), join(abs, fileName(1)));
    await rename(join(abs, 'tmp.jpg'), join(abs, fileName(n)));
    editor.set(rel(fileName(1)), b ? b.replace(rel(fileName(n)), rel(fileName(1))) : null);
    editor.set(rel(fileName(n)), a ? a.replace(rel(fileName(1)), rel(fileName(n))) : null);
    swapped = true;
  }
  const staleThumbs = await deleteStaleThumbs(abs);
  await writeFile(creditsPath, editor.sorted(), 'utf8');
  return { dir, swapped, staleThumbs };
}

/**
 * `<n>.jpg` loeschen, folgende ruecken nach (NN-1). Credits werden entfernt
 * bzw. umbenannt.
 * @returns {{ dir: string, remaining: number, staleThumbs: number }}
 */
export async function dropImage({ imagesRoot, creditsPath, dir, n }) {
  const abs = join(imagesRoot, dir);
  const rel = (f) => `images/${dir}/${f}`;
  const editor = creditsEditor(await readFile(creditsPath, 'utf8'));

  const files = (await readdir(abs)).filter((f) => IMAGE_FILE_RE.test(f)).sort();
  await unlink(join(abs, fileName(n)));
  editor.set(rel(fileName(n)), null);
  for (let i = n + 1; i <= files.length; i++) {
    const line = editor.lineFor(rel(fileName(i)));
    await rename(join(abs, fileName(i)), join(abs, fileName(i - 1)));
    editor.set(rel(fileName(i)), null);
    editor.set(rel(fileName(i - 1)), line ? line.replace(rel(fileName(i)), rel(fileName(i - 1))) : null);
  }
  const staleThumbs = await deleteStaleThumbs(abs);
  await writeFile(creditsPath, editor.sorted(), 'utf8');
  return { dir, remaining: files.length - 1, staleThumbs };
}

/**
 * Codes aller Pakete, deren LETZTE Version ein Bild aus `images/<dir>/`
 * referenziert (globale Ordner wie `new_year` haengen an ~120 Laenderpaketen
 * + GLOBAL). Grundlage fuer den G-7-Bump nach promote/drop.
 */
export async function referencingPackages(dir, packagesDir) {
  const prefix = `images/${dir}/`;
  const codes = [];
  for (const code of (await readdir(packagesDir)).sort()) {
    const latest = (await listVersions(join(packagesDir, code))).at(-1);
    if (latest == null) continue;
    const pkg = JSON.parse(await readFile(join(packagesDir, code, `v${latest}`, 'package.json'), 'utf8'));
    const refs = Object.values(pkg.images ?? {}).flat();
    if (refs.some((r) => typeof r?.path === 'string' && r.path.startsWith(prefix))) codes.push(code);
  }
  return codes;
}
