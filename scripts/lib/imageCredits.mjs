/** Liest CREDITS.md-Attributionen und dekoriert Image-Refs — genutzt von build-articles; build-fun-occasions folgt. */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

/**
 * Zeilenformat in CREDITS.md (auto-generiert von fetch-images):
 *   - `images/<key>/01.jpg` — <Autor> (<Lizenz>)
 *   - `images/<key>/01.jpg` — <Autor> (<Lizenz>) — <https://commons.wikimedia.org/wiki/File:…>
 * Die Quell-URL ist optional (ältere Zeilen haben keine); sie landet als
 * `sourceUrl` im Image-Ref, damit die App den Credit auf die Dateiseite
 * verlinken kann (CC BY 4.0 §3(a)(1)(A)(iv): URI „soweit praktikabel").
 */
const CREDIT_LINE_RE = /^- `([^`]+)` — (.+) \(([^)]+)\)(?: — <(https?:\/\/[^>\s]+)>)?$/;

/** Reads license/credit hints from CREDITS.md for attributed images: path -> { credit, license, sourceUrl? }. */
export async function loadCreditHints(creditsPath) {
  const hints = new Map();
  if (!existsSync(creditsPath)) return hints;
  const md = await readFile(creditsPath, 'utf8');
  const block = md.match(
    /<!-- BEGIN:IMAGE-CREDITS \(auto-generated\) -->([\s\S]*?)<!-- END:IMAGE-CREDITS -->/,
  );
  if (!block) return hints;
  for (const line of block[1].split('\n')) {
    const m = line.match(CREDIT_LINE_RE);
    if (m) hints.set(m[1], { credit: m[2], license: m[3], ...(m[4] ? { sourceUrl: m[4] } : {}) });
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
    if (hint.sourceUrl && !out.sourceUrl) out.sourceUrl = hint.sourceUrl;
  } else {
    out.license = 'CC0';
  }
  return out;
}

/**
 * Dateiseite eines Commons-Titels („File:Foo bar.jpg") — Leerzeichen werden zu
 * Unterstrichen, der Rest URL-kodiert (Commons akzeptiert beides, so sieht der
 * Link aber aus wie auf Commons selbst).
 */
export function commonsFileUrl(fileTitle) {
  if (typeof fileTitle !== 'string' || !fileTitle.startsWith('File:')) return undefined;
  const name = fileTitle.slice('File:'.length).trim().replace(/ /g, '_');
  if (!name) return undefined;
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(name).replace(/%2F/g, '/')}`;
}
