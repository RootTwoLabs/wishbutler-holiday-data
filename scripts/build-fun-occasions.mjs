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
import { fileURLToPath } from 'node:url';
import { loadFunDays, validateFunDays, buildFunPackage, FUN_COUNTRY_CODE } from './lib/funDays.mjs';
import { buildImageRefs } from './lib/contentLoader.mjs';
import { loadCreditHints, decorateImageRef } from './lib/imageCredits.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'data');
const CONTENT = join(ROOT, 'content', 'fun-days');
const OUT_DIR = join(DATA, 'packages', FUN_COUNTRY_CODE);

async function latestVersion() {
  if (!existsSync(OUT_DIR)) return null;
  const entries = await readdir(OUT_DIR, { withFileTypes: true });
  let max = null;
  for (const e of entries) {
    const m = e.isDirectory() ? e.name.match(/^v(\d+)$/) : null;
    if (m) max = Math.max(max ?? 0, parseInt(m[1], 10));
  }
  return max;
}

function contentKey(pkg) {
  const { version, ...rest } = pkg;
  return JSON.stringify(rest);
}

async function main() {
  const data = await loadFunDays(CONTENT);
  const errors = validateFunDays(data, { imagesRoot: join(DATA, 'images'), requireImages: true });
  if (errors.length > 0) {
    console.error(`build-fun-occasions: ${errors.length} Content-Fehler:\n` + errors.map((e) => `  - ${e}`).join('\n'));
    process.exit(1);
  }

  const creditHints = await loadCreditHints(join(ROOT, 'CREDITS.md'));
  const imageRefs = {};
  for (const d of data.days) {
    const refs = await buildImageRefs(DATA, d.slug, FUN_COUNTRY_CODE);
    imageRefs[d.slug] = refs.map((ref) => decorateImageRef(ref, creditHints));
  }

  const prev = await latestVersion();
  let version = Number(process.env.FUN_VERSION) || prev || 1;
  const candidate = buildFunPackage(data, { version, imageRefs });
  if (!process.env.FUN_VERSION && prev != null) {
    const prevPkg = JSON.parse(await readFile(join(OUT_DIR, `v${prev}`, 'package.json'), 'utf8'));
    if (contentKey(prevPkg) !== contentKey(candidate)) version = prev + 1;
  }
  const pkg = { ...candidate, version };

  const outDir = join(OUT_DIR, `v${version}`);
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  console.log(
    `FUN v${version}${version !== prev ? ' (neu)' : ''}: ${pkg.definitions.length} Definitionen, ` +
      `${Object.keys(pkg.i18n.holidays).length} Locales, ${Object.keys(pkg.images ?? {}).length} Bilder.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
