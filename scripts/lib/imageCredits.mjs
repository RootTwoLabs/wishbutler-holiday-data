/** Liest CREDITS.md-Attributionen und dekoriert Image-Refs (geteilt von build-articles + build-fun-occasions). */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { needsCredit } from './imageLicense.mjs';

/** Reads license/credit hints from CREDITS.md for attributed images: path -> { credit, license }. */
export async function loadCreditHints(creditsPath) {
  const hints = new Map();
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

/** Applies CREDITS.md hints to an image ref (or marks it CC0). */
export function decorateImageRef(ref, creditHints) {
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
