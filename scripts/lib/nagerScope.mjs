/**
 * G-5 (Audit 2026-09-20): Geltungsbereich und Kategorie eines Feiertags aus
 * den Nager.Date-Feldern `global`, `counties` und `types`, die der Generator
 * bisher verworfen hat — regionale Feiertage (DE Fronleichnam nur in acht
 * Laendern, CH Naefelser Fahrt nur GL) landeten als landesweite `public`-
 * Eintraege im Paket und wurden in der App fuer alle vorausgewaehlt.
 *
 * Datenvertrag (mit der App abgestimmt, packageManager.ts `sanitizeRegions`):
 *
 *   - `regions: string[]` = Nager `counties` unveraendert (ISO-3166-2-Codes
 *     wie `DE-BY`, `CH-GL`, `AT-4`), sortiert und dedupliziert, NUR wenn der
 *     Anlass in keinem Jahr landesweit (`global: true`) vorkommt. Landesweite
 *     Feiertage tragen das Feld NICHT.
 *   - Kommt derselbe Anlass in einem Jahr sowohl landesweit als auch regional
 *     vor -> landesweit. Variiert die Regionsmenge ueber die Jahre -> Vereinigung.
 *   - `global: false` ohne `counties` (Datenluecke bei Nager) zaehlt als
 *     landesweit, weil sich keine Regionen benennen lassen.
 *   - `category`: Nager `types` enthaelt `Public` -> `public`, sonst
 *     `observance` (Bank/School/Authorities/Optional/Observance). Ueber die
 *     Jahre reicht EIN Public-Jahr. `religious` vergibt nur der Hebcal-
 *     Generator (Israel) — kein neuer Enum-Wert.
 */

/** ISO-3166-2-Form, die das Schema (und die App) fuer `regions` akzeptiert. */
export const REGION_CODE_RE = /^[A-Z]{2}-[A-Z0-9]{1,5}$/;

/** Obergrenze je Definition (Schema `maxItems`, App `MAX_REGIONS_PER_DEFINITION`). */
export const MAX_REGIONS = 64;

/** Leerer Sammler fuer einen Anlass (wird pro Nager-Zeile mit collectScope gefuettert). */
export function newScope() {
  return { national: false, counties: new Set(), types: new Set() };
}

/**
 * Nimmt EINE Nager-Zeile (`{ global, counties, types }`) in den Sammler auf.
 * Rueckgabe ist der Sammler selbst (mutiert), damit Aufrufer verketten koennen.
 */
export function collectScope(scope, holiday) {
  const counties = Array.isArray(holiday.counties) ? holiday.counties.filter((c) => typeof c === 'string') : [];
  const regional = holiday.global === false && counties.length > 0;
  if (regional) {
    for (const c of counties) scope.counties.add(c);
  } else {
    scope.national = true;
  }
  for (const t of Array.isArray(holiday.types) ? holiday.types : []) scope.types.add(t);
  return scope;
}

/** `public`, wenn mindestens ein Jahr den Typ Public traegt; sonst `observance`. */
export function categoryFromTypes(types) {
  for (const t of types) if (t === 'Public') return 'public';
  return 'observance';
}

/** true, wenn `regions` jede Region des (kuratierten) Full-Sets enthaelt. */
export function coversFullRegionSet(regions, fullSet) {
  if (!Array.isArray(fullSet) || fullSet.length === 0 || !Array.isArray(regions)) return false;
  const set = new Set(regions);
  return fullSet.every((c) => set.has(c));
}

/**
 * Loest den Sammler zu `{ category, regions }` auf. `regions` ist `undefined`
 * fuer landesweite Anlaesse (Feld entfaellt im Paket), sonst die sortierte,
 * deduplizierte Vereinigung aller beobachteten Regionen. Codes, die nicht
 * der ISO-3166-2-Form entsprechen, werden mit Warnung verworfen — bleibt
 * nichts uebrig, gilt der Anlass als landesweit (die App verfaehrt bei einem
 * ungueltigen Feld genauso).
 *
 * `fullSet` (NAGER_FULL_REGION_SETS[cc]): deckt die Vereinigung alle Regionen
 * des Landes ab, ist der Anlass landesweit (GB New Year's Day in allen vier
 * Nationen) — kein `regions`.
 */
export function resolveScope(scope, { warn = () => {}, fullSet } = {}) {
  const category = categoryFromTypes(scope.types);
  if (scope.national || scope.counties.size === 0) return { category, regions: undefined };
  const regions = [...scope.counties].sort();
  const invalid = regions.filter((c) => !REGION_CODE_RE.test(c));
  if (invalid.length > 0) warn(`regions verworfen (kein ISO-3166-2-Code): ${invalid.join(', ')}`);
  const valid = regions.filter((c) => REGION_CODE_RE.test(c));
  if (valid.length === 0 || valid.length > MAX_REGIONS) {
    if (valid.length > MAX_REGIONS) warn(`regions verworfen (${valid.length} > ${MAX_REGIONS})`);
    return { category, regions: undefined };
  }
  if (coversFullRegionSet(valid, fullSet)) return { category, regions: undefined };
  return { category, regions: valid };
}
