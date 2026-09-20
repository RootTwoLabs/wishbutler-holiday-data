/**
 * Gemeinsames Schreiben von data/packages/<CC>/v<N>/package.json fuer alle
 * Feiertags-Generatoren (Nager.Date in fetch-holidays.mjs, Hebcal in
 * fetch-holidays-hebcal.mjs) und die Content-Merger (build-articles.mjs,
 * migrate-observed-rules.mjs).
 *
 * Redaktionelle Inhalte, die ein Generator nicht ableiten kann (Namenstage,
 * kuratierte Bilder, handgeschriebene Artikel in `i18n.holidayInfo`), werden
 * aus der letzten Version uebernommen. Feiertags-Labels (`i18n.holidays`)
 * werden immer neu erzeugt, damit sie zu den (Slug-)labelKeys passen.
 *
 * G-4: Eine neue Version entsteht NUR, wenn sich der Inhalt (ohne `version`)
 * gegenueber der letzten Version aendert. Vorher bumpte writePackage
 * bedingungslos — jeder Monats-Cron erzeugte 124 byte-gleiche Versionen, die
 * alle Geraete neu luden.
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
 *
 * G-5: `regions` (ISO-3166-2-Codes, siehe lib/nagerScope.mjs) steht nur bei
 * regionalen Feiertagen im Paket — landesweite Definitionen tragen das Feld
 * nicht (undefined oder leer = weglassen).
 */
export function holidayDefinition({ id, countryCode, slug, rule, category = 'public', regions }) {
  return {
    id,
    countryCode,
    kind: rule.type,
    labelKey: `holidays.${slug}`,
    iconName: 'event',
    category,
    ...(Array.isArray(regions) && regions.length > 0 ? { regions } : {}),
    rule,
  };
}

/**
 * Inhaltlicher Fingerabdruck eines Pakets ohne die (hochzaehlende) `version`.
 * Feldreihenfolge zaehlt mit — Aufrufer bauen ihre Pakete deshalb in der
 * kanonischen Reihenfolge (countryCode, schemaVersion, definitions, namedays,
 * i18n, images), damit der Vergleich stabil ist.
 */
export function packageContentKey(pkg) {
  const { version, ...rest } = pkg;
  return JSON.stringify(rest);
}

/** Serialisierte Form, exakt so wie sie auf der Platte / im CDN liegt. */
export function serializePackage(pkg) {
  return JSON.stringify(pkg, null, 2) + '\n';
}

/**
 * Bytes einer Textdatei, wie das CDN sie ausliefert (LF). Auf Windows-Checkouts
 * mit core.autocrlf liegen die JSON-Dateien teils mit CRLF im Working Tree;
 * `stat.size` waere dann um die Zeilenzahl zu gross (G-9).
 */
export function deliveredByteLength(text) {
  return Buffer.byteLength(text.replace(/\r\n/g, '\n'), 'utf8');
}

/** Liest die hoechste Version eines Landes: { version, pkg } oder null. */
export async function readLatestPackage(cc, { packagesDir = PACKAGES } = {}) {
  const countryDir = join(packagesDir, cc);
  const prev = (await listVersions(countryDir)).at(-1);
  if (prev == null) return null;
  const pkg = JSON.parse(await readFile(join(countryDir, `v${prev}`, 'package.json'), 'utf8'));
  return { version: prev, pkg };
}

/**
 * Schreibt `content` (Paket OHNE `version`) als naechste Version — aber nur,
 * wenn es sich von der letzten Version unterscheidet. Veroeffentlichte
 * Versionen werden nie ueberschrieben.
 *
 * `force: true` (G-7, curate-images) legt auch bei byte-gleichem Inhalt eine
 * neue Version an — noetig, wenn sich eine referenzierte Bilddatei unter
 * gleichem Pfad geaendert hat und das Paket-JSON davon nichts weiss.
 *
 * @returns {{ version: number, changed: boolean }} — `version` ist die Version,
 *   die den Inhalt jetzt traegt (bei `changed: false` die bisherige).
 */
export async function writePackageIfChanged(cc, content, { packagesDir = PACKAGES, force = false } = {}) {
  const latest = await readLatestPackage(cc, { packagesDir });
  if (!force && latest && packageContentKey(latest.pkg) === packageContentKey(content)) {
    return { version: latest.version, changed: false };
  }
  const next = (latest?.version ?? 0) + 1;
  const dir = join(packagesDir, cc, `v${next}`);
  await mkdir(dir, { recursive: true });
  // `version` steht an zweiter Stelle (nach countryCode) — wie bisher.
  const { countryCode, ...rest } = content;
  const pkg = { countryCode, version: next, ...rest };
  await writeFile(join(dir, 'package.json'), serializePackage(pkg), 'utf8');
  return { version: next, changed: true };
}

/**
 * Baut aus neuen Definitionen + Labels das naechste Paket (Namenstage, Bilder
 * und Artikel aus der Vorversion uebernommen) und schreibt es, falls es sich
 * geaendert hat.
 *
 * @returns {{ version: number, changed: boolean }}
 */
export async function writePackage(cc, definitions, labels, { packagesDir = PACKAGES } = {}) {
  const latest = await readLatestPackage(cc, { packagesDir });
  const prevPkg = latest?.pkg;
  const preserved = {
    namedays: prevPkg?.namedays,
    images: prevPkg?.images,
    holidayInfo: prevPkg?.i18n?.holidayInfo,
  };

  const i18n = { holidays: labels };
  if (preserved.holidayInfo) i18n.holidayInfo = preserved.holidayInfo;

  const content = {
    countryCode: cc,
    schemaVersion: 1,
    definitions,
    ...(preserved.namedays ? { namedays: preserved.namedays } : {}),
    i18n,
    ...(preserved.images ? { images: preserved.images } : {}),
  };
  return writePackageIfChanged(cc, content, { packagesDir });
}
