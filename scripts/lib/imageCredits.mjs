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

/**
 * G-10: EINE Stelle, die eine CREDITS-Zeile formatiert — Gegenstueck zu
 * CREDIT_LINE_RE, damit Schreiber (fetch-images, fetch-memorial-images) und
 * Parser nicht auseinanderlaufen. Seit G-10 bekommt JEDE Bilddatei eine Zeile,
 * auch CC0/Public Domain: Fehlt eine Zeile, ist das ein Validator-Fehler und
 * nicht mehr von „CC0, braucht keine Zeile" zu unterscheiden.
 *
 * Wirft, wenn die Zeile nicht wieder parsebar waere (Zeilenumbruch/Backtick im
 * Pfad, `)` in der Lizenz, leerer Autor) — lieber ein lauter Abbruch beim
 * Fetch als eine stille Luecke im Build.
 */
export function formatCreditLine({ path, credit, license, sourceUrl }) {
  const author = String(credit ?? '').replace(/\s+/g, ' ').trim();
  const lic = String(license ?? '').replace(/\s+/g, ' ').trim();
  const source = typeof sourceUrl === 'string' && /^https?:\/\/[^>\s]+$/.test(sourceUrl) ? ` — <${sourceUrl}>` : '';
  const line = `- \`${path}\` — ${author} (${lic})${source}`;
  const m = line.match(CREDIT_LINE_RE);
  if (!author || !lic || !m || m[1] !== path || m[2] !== author || m[3] !== lic) {
    throw new Error(`CREDITS-Zeile nicht parsebar: ${line}`);
  }
  return line;
}

/**
 * Alle Pfade im auto-generierten Block, die mehr als eine Zeile haben
 * (`loadCreditHints` ist eine Map und verdeckt Duplikate — die letzte gewinnt).
 */
export async function duplicateCreditPaths(creditsPath) {
  if (!existsSync(creditsPath)) return [];
  const md = await readFile(creditsPath, 'utf8');
  const block = md.match(
    /<!-- BEGIN:IMAGE-CREDITS \(auto-generated\) -->([\s\S]*?)<!-- END:IMAGE-CREDITS -->/,
  );
  if (!block) return [];
  const seen = new Set();
  const dupes = new Set();
  for (const line of block[1].split(/\r?\n/)) {
    const path = /^- `([^`]+)`/.exec(line)?.[1];
    if (!path) continue;
    if (seen.has(path)) dupes.add(path);
    seen.add(path);
  }
  return [...dupes].sort();
}

/** Reads license/credit hints from CREDITS.md for attributed images: path -> { credit, license, sourceUrl? }. */
export async function loadCreditHints(creditsPath) {
  const hints = new Map();
  if (!existsSync(creditsPath)) return hints;
  const md = await readFile(creditsPath, 'utf8');
  const block = md.match(
    /<!-- BEGIN:IMAGE-CREDITS \(auto-generated\) -->([\s\S]*?)<!-- END:IMAGE-CREDITS -->/,
  );
  if (!block) return hints;
  // G-2: CREDITS.md kann im Working Tree mit CRLF liegen (core.autocrlf=true auf
  // Windows). Ohne Normalisierung matcht CREDIT_LINE_RE keine einzige Zeile
  // (`$` vor `\r`), decorateImageRef markiert dann JEDES Bild als CC0 ohne
  // Namensnennung. Deshalb zeilenweise CR-tolerant splitten.
  for (const line of block[1].split(/\r?\n/)) {
    const m = line.match(CREDIT_LINE_RE);
    if (m) hints.set(m[1], { credit: m[2], license: m[3], ...(m[4] ? { sourceUrl: m[4] } : {}) });
  }
  return hints;
}

/**
 * Applies CREDITS.md hints to an image ref (or marks it CC0).
 *
 * G-10: Der CC0-Rueckfall ist nur noch ein Netz, damit der Build nicht
 * abbricht — `npm run validate` meldet jede Bilddatei ohne CREDITS-Zeile als
 * Fehler (checkCreditsCoverage), eine verlorene Zeile faellt also auf.
 */
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
