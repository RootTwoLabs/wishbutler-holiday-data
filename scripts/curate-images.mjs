#!/usr/bin/env node
/**
 * Bild-Kuratierung nach fetch-images.mjs (die Commons/Openverse-Treffer sind
 * Zufallsware und werden gesichtet):
 *
 *   node scripts/curate-images.mjs promote <dir> <n>   # <n>.jpg wird Titelbild (Tausch mit 01.jpg)
 *   node scripts/curate-images.mjs drop <dir> <n>      # <n>.jpg loeschen, folgende ruecken nach
 *
 * <dir> relativ zu data/images, z. B. `IL/rosh_hashanah` oder `pentecost`.
 * Die Attributionszeilen in CREDITS.md (Pfad -> Credit) werden mit umbenannt
 * bzw. entfernt, damit build-articles.mjs die richtigen Credits zuordnet.
 */
import { readFile, writeFile, rename, unlink, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CREDITS = join(ROOT, 'CREDITS.md');

const [, , cmd, dir, nArg] = process.argv;
const n = Number(nArg);
if (!['promote', 'drop'].includes(cmd) || !dir || !Number.isInteger(n) || n < 1) {
  console.error('usage: curate-images.mjs promote|drop <dir> <n>');
  process.exit(1);
}
const abs = join(ROOT, 'data', 'images', dir);
const rel = (f) => `images/${dir}/${f}`;
const name = (i) => `${String(i).padStart(2, '0')}.jpg`;

let credits = await readFile(CREDITS, 'utf8');
const creditLine = (path) =>
  credits.split('\n').find((l) => l.startsWith(`- \`${path}\` — `)) ?? null;
const setCredit = (path, line) => {
  credits = credits.split('\n').filter((l) => !l.startsWith(`- \`${path}\` — `)).join('\n');
  if (line) credits = credits.replace('<!-- END:IMAGE-CREDITS -->', `${line}\n<!-- END:IMAGE-CREDITS -->`);
};

if (cmd === 'promote') {
  if (n !== 1) {
    const a = creditLine(rel(name(1)));
    const b = creditLine(rel(name(n)));
    await rename(join(abs, name(1)), join(abs, 'tmp.jpg'));
    await rename(join(abs, name(n)), join(abs, name(1)));
    await rename(join(abs, 'tmp.jpg'), join(abs, name(n)));
    setCredit(rel(name(1)), b ? b.replace(rel(name(n)), rel(name(1))) : null);
    setCredit(rel(name(n)), a ? a.replace(rel(name(1)), rel(name(n))) : null);
  }
  console.log(`${dir}: ${name(n)} -> 01.jpg`);
} else {
  const files = (await readdir(abs)).filter((f) => /^\d\d\.jpg$/.test(f)).sort();
  await unlink(join(abs, name(n)));
  setCredit(rel(name(n)), null);
  for (let i = n + 1; i <= files.length; i++) {
    const line = creditLine(rel(name(i)));
    await rename(join(abs, name(i)), join(abs, name(i - 1)));
    setCredit(rel(name(i)), null);
    setCredit(rel(name(i - 1)), line ? line.replace(rel(name(i)), rel(name(i - 1))) : null);
  }
  console.log(`${dir}: ${name(n)} geloescht`);
}

// Credit-Block sortiert halten (wie fetch-images.mjs ihn schreibt).
const m = credits.match(
  /(<!-- BEGIN:IMAGE-CREDITS \(auto-generated\) -->\n)([\s\S]*?)(<!-- END:IMAGE-CREDITS -->)/,
);
if (m) {
  const lines = m[2].split('\n').filter((l) => l.startsWith('- `')).sort();
  credits = credits.replace(m[0], `${m[1]}${lines.join('\n')}\n${m[3]}`);
}
await writeFile(CREDITS, credits, 'utf8');
