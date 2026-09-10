/**
 * Gemeinsames Schreiben von data/packages/<CC>/v<N>/package.json fuer alle
 * Feiertags-Generatoren (Nager.Date in fetch-holidays.mjs, Hebcal in
 * fetch-holidays-hebcal.mjs).
 *
 * Redaktionelle Inhalte, die ein Generator nicht ableiten kann (Namenstage,
 * kuratierte Bilder, handgeschriebene Artikel in `i18n.holidayInfo`), werden
 * aus der letzten Version uebernommen. Feiertags-Labels (`i18n.holidays`)
 * werden immer neu erzeugt, damit sie zu den (Slug-)labelKeys passen.
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PACKAGES = join(__dirname, '..', '..', 'data', 'packages');

export async function listVersions(countryDir) {
  if (!existsSync(countryDir)) return [];
  const entries = await readdir(countryDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && /^v\d+$/.test(e.name))
    .map((e) => parseInt(e.name.slice(1), 10))
    .sort((a, b) => a - b);
}

/**
 * Baut eine Paket-Definition. `rule.type` (fixed | easter_relative |
 * nth_weekday | precomputed) entspricht 1:1 dem HolidayKind der App.
 */
export function holidayDefinition({ id, countryCode, slug, rule, category = 'public' }) {
  return {
    id,
    countryCode,
    kind: rule.type,
    labelKey: `holidays.${slug}`,
    iconName: 'event',
    category,
    rule,
  };
}

/** Schreibt die naechste Paketversion und gibt deren Nummer zurueck. */
export async function writePackage(cc, definitions, labels) {
  const countryDir = join(PACKAGES, cc);
  const versions = await listVersions(countryDir);
  const prev = versions.at(-1);
  let preserved = {};
  if (prev != null) {
    const prevPkg = JSON.parse(
      await readFile(join(countryDir, `v${prev}`, 'package.json'), 'utf8'),
    );
    preserved = {
      namedays: prevPkg.namedays,
      images: prevPkg.images,
      holidayInfo: prevPkg.i18n?.holidayInfo,
    };
  }
  const next = (prev ?? 0) + 1;
  const dir = join(countryDir, `v${next}`);
  await mkdir(dir, { recursive: true });

  const i18n = { holidays: labels };
  if (preserved.holidayInfo) i18n.holidayInfo = preserved.holidayInfo;

  const pkg = {
    countryCode: cc,
    version: next,
    schemaVersion: 1,
    definitions,
    ...(preserved.namedays ? { namedays: preserved.namedays } : {}),
    i18n,
    ...(preserved.images ? { images: preserved.images } : {}),
  };
  await writeFile(join(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  return next;
}
