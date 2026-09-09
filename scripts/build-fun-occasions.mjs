#!/usr/bin/env node
/**
 * Baut das FUN-Paket (kuriose Feiertage) aus content/fun-days/ + data/images/FUN/.
 *
 * Ab v5: echte HolidayDefinitions (eine pro Kalendertag, 366), Labels + Kurzartikel
 * in allen 12 Locales, ein Bild pro Tag. Die Legacy-Felder `funOccasions` und
 * `i18n.funOccasions` bleiben eine Paketgeneration lang für installierte
 * App-Versionen erhalten (Heute-Karte alt) — siehe funDays.buildFunPackage.
 *
 * Versionierung wie build-articles: bei Inhaltsänderung neues v<N+1>-Verzeichnis,
 * sonst wird die aktuelle Version unverändert neu geschrieben.
 *
 * Usage: node scripts/build-fun-occasions.mjs   (FUN_VERSION=<n> erzwingt eine Version)
 */
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadFunDays, validateFunDays, buildFunPackage, FUN_COUNTRY_CODE } from './lib/funDays.mjs';
import { buildImageRefs } from './lib/contentLoader.mjs';
import { loadCreditHints, decorateImageRef } from './lib/imageCredits.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'data');
const CONTENT = join(ROOT, 'content', 'fun-days');
const OUT_DIR = join(DATA, 'packages', FUN_COUNTRY_CODE);
const MAX_SHOWN_ERRORS = 50;

/** Höchste vorhandene v<N> unter `dir`, oder `null` wenn noch kein Paket existiert. */
export async function latestVersion(dir) {
  if (!existsSync(dir)) return null;
  const entries = await readdir(dir, { withFileTypes: true });
  let max = null;
  for (const e of entries) {
    const m = e.isDirectory() ? e.name.match(/^v(\d+)$/) : null;
    if (m) max = Math.max(max ?? 0, parseInt(m[1], 10));
  }
  return max;
}

/** Inhaltlicher Fingerabdruck eines Pakets (ohne `version`), für den Änderungsvergleich. */
export function contentKey(pkg) {
  const { version, ...rest } = pkg;
  return JSON.stringify(rest);
}

/**
 * Entscheidet die zu schreibende Version.
 * - `forced` gesetzt: exakt diese Version, kein Inhaltsvergleich.
 * - kein bisheriges Paket (`prev == null`): startet bei 1.
 * - sonst: unverändert (`prev`), oder `prev + 1` wenn sich der Inhalt (ohne
 *   `version`) gegenüber `prevPkg` geändert hat.
 */
export function decideVersion({ prev, forced, prevPkg, candidate }) {
  if (forced != null) return { version: forced, bumped: forced !== prev };
  if (prev == null) return { version: 1, bumped: true };
  const changed = !prevPkg || contentKey(prevPkg) !== contentKey(candidate);
  return { version: changed ? prev + 1 : prev, bumped: changed };
}

/** Parst FUN_VERSION: leer/whitespace = nicht gesetzt (`null`), sonst positive Ganzzahl oder Fehler. */
function parseForcedVersion(raw) {
  const trimmed = (raw ?? '').trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 1) {
    console.error(`build-fun-occasions: FUN_VERSION muss eine positive Ganzzahl sein, war "${trimmed}"`);
    process.exit(2);
  }
  return n;
}

async function main() {
  const forced = parseForcedVersion(process.env.FUN_VERSION);

  const data = await loadFunDays(CONTENT);
  const errors = validateFunDays(data, { imagesRoot: join(DATA, 'images'), requireImages: true });
  const prev = await latestVersion(OUT_DIR);

  if (errors.length > 0) {
    const shown = errors.slice(0, MAX_SHOWN_ERRORS);
    const rest = errors.length - shown.length;
    console.error(
      `build-fun-occasions: ${errors.length} Content-Fehler:\n` +
        shown.map((e) => `  - ${e}`).join('\n') +
        (rest > 0 ? `\n  … und ${rest} weitere (npm run check:fun-days zeigt alle)` : ''),
    );
    // CI-Resilienz für den monatlichen Lauf: Während Autoren noch an
    // content/fun-days arbeiten (oder ein Bild-Fetch noch läuft), ist der
    // Content vorübergehend unvollständig. Existiert bereits ein gebautes
    // FUN-Paket, lassen wir es unangetastet stehen statt die Pipeline zu
    // brechen; nur ohne jedes Vorgänger-Paket ist das ein harter Fehler.
    if (prev != null) {
      console.warn(`build-fun-occasions: bestehendes FUN v${prev} bleibt unverändert.`);
      process.exit(0);
    }
    process.exit(1);
  }

  const creditHints = await loadCreditHints(join(ROOT, 'CREDITS.md'));
  const imageRefs = {};
  for (const d of data.days) {
    const refs = await buildImageRefs(DATA, d.slug, FUN_COUNTRY_CODE);
    // Spec: genau ein Bild pro kuriosem Feiertag — überzählige Dateien im Ordner ignorieren.
    imageRefs[d.slug] = refs.slice(0, 1).map((ref) => decorateImageRef(ref, creditHints));
  }

  const candidate = buildFunPackage(data, { version: forced ?? prev ?? 1, imageRefs });
  const prevPkg =
    forced == null && prev != null
      ? JSON.parse(await readFile(join(OUT_DIR, `v${prev}`, 'package.json'), 'utf8'))
      : null;
  const { version } = decideVersion({ prev, forced, prevPkg, candidate });
  const pkg = { ...candidate, version };

  const outDir = join(OUT_DIR, `v${version}`);
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  const suffix = forced != null ? ' (erzwungen)' : version !== prev ? ' (neu)' : '';
  console.log(
    `FUN v${version}${suffix}: ${pkg.definitions.length} Definitionen, ` +
      `${Object.keys(pkg.i18n.holidays).length} Locales, ${Object.keys(pkg.images ?? {}).length} Bilder.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
