#!/usr/bin/env node
/**
 * Baut das FUN-Paket ("Kurioser Tag") aus:
 *   1. content/fun-occasions.json          — Wikidata-Harvest (CC0), nach Bekanntheit
 *   2. content/fun-occasions-curated.json   — kuratiert (eigene Formulierung):
 *        .dated      -> echte Fun-Tage auf konkreten Kalendertagen
 *        .evergreen  -> leichte Anlaesse als Backstop
 *
 * Beide sind zuvor durch translate-fun-occasions.mjs auf alle 12 App-Sprachen
 * ergaenzt worden. Regeln: max 3/Tag (Harvest nach Bekanntheit zuerst, dann
 * kuratiert), und GARANTIERT >=1 Anlass pro Kalendertag — leere Tage werden
 * deterministisch aus dem Evergreen-Pool gefuellt. So zeigt die Heute-Karte bei
 * aktiviertem Feature an jedem Tag etwas.
 */
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PACKAGES = join(ROOT, 'data', 'packages');
const HARVEST = join(ROOT, 'content', 'fun-occasions.json');
const CURATED = join(ROOT, 'content', 'fun-occasions-curated.json');

const REQUIRED_LOCALES = ['de', 'en'];
const ALL_LOCALES = ['de', 'en', 'es', 'fr', 'it', 'pl', 'pt', 'nl', 'sv', 'ja', 'ko', 'zh-Hant'];
const MAX_PER_DAY = 3;
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // Feb=29 (Schalttag inkl.)
const DATE_RE = /^[0-1][0-9]-[0-3][0-9]$/;

function assert(cond, msg) {
  if (!cond) {
    console.error(`build-fun-occasions: ${msg}`);
    process.exit(1);
  }
}
const pad2 = (n) => String(n).padStart(2, '0');

async function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(await readFile(path, 'utf8'));
}

async function currentVersion() {
  const dir = join(PACKAGES, 'FUN');
  if (!existsSync(dir)) return 1;
  const entries = await readdir(dir, { withFileTypes: true });
  let max = 0;
  for (const e of entries) {
    const m = e.isDirectory() && /^v(\d+)$/.exec(e.name);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max === 0 ? 1 : max;
}

/** Ein Occasion -> Paket-Eintrag + i18n. */
function pushOccasion(occ, list, i18n, seenSlugs, warnings) {
  assert(/^[a-z0-9_]+$/.test(occ.slug), `invalid slug "${occ.slug}"`);
  if (seenSlugs.has(occ.slug)) return; // gleicher Anlass ein zweites Mal (z.B. Evergreen an anderem Tag)
  for (const loc of REQUIRED_LOCALES) assert(occ.labels?.[loc], `missing "${loc}" label for "${occ.slug}"`);
  seenSlugs.add(occ.slug);
  list.push({
    id: `fun_${occ.slug}`,
    labelKey: `funOccasions.${occ.slug}`,
    ...(occ.emoji ? { emoji: occ.emoji } : {}),
    ...(occ.tags?.length ? { tags: occ.tags } : {}),
  });
  for (const loc of ALL_LOCALES) {
    if (occ.labels?.[loc]) (i18n[loc] ??= {})[occ.slug] = occ.labels[loc];
    else if (loc !== 'en') warnings.add(`${occ.slug}: fehlendes ${loc}-Label`);
  }
}

async function main() {
  const harvestDoc = await readJson(HARVEST, { occasions: [] });
  const curatedDoc = await readJson(CURATED, { dated: [], evergreen: [] });
  const harvest = harvestDoc.occasions ?? [];
  const dated = curatedDoc.dated ?? [];
  const evergreen = curatedDoc.evergreen ?? [];
  assert(evergreen.length > 0, 'curated.evergreen ist leer — Backstop fehlt');

  const byDate = {};
  const i18n = {};
  const seenSlugs = new Set();
  const warnings = new Set();
  const globalIds = new Set();

  // 1) Harvest (nach Bekanntheit vorsortiert) — pro Tag bis MAX_PER_DAY
  for (const occ of harvest) {
    if (!DATE_RE.test(occ.date)) continue;
    (byDate[occ.date] ??= []);
    if (byDate[occ.date].length >= MAX_PER_DAY) continue;
    const before = seenSlugs.size;
    pushOccasion(occ, byDate[occ.date], i18n, seenSlugs, warnings);
    if (seenSlugs.size > before) globalIds.add(`fun_${occ.slug}`);
  }
  // 2) Kuratierte dated — fuellt/ergaenzt bis MAX_PER_DAY
  for (const occ of dated) {
    assert(DATE_RE.test(occ.date), `curated dated: invalid date "${occ.date}" for "${occ.slug}"`);
    (byDate[occ.date] ??= []);
    if (byDate[occ.date].length >= MAX_PER_DAY) continue;
    pushOccasion(occ, byDate[occ.date], i18n, seenSlugs, warnings);
  }

  // 3) Evergreen-Backstop: JEDER Kalendertag bekommt mindestens einen Anlass.
  //    i18n fuer alle Evergreens einmalig registrieren; Zuweisung deterministisch.
  const everById = evergreen.map((e) => ({ id: `fun_${e.slug}`, labelKey: `funOccasions.${e.slug}`, slug: e.slug, labels: e.labels }));
  for (const e of everById) for (const loc of ALL_LOCALES) if (e.labels?.[loc]) (i18n[loc] ??= {})[e.slug] = e.labels[loc];
  for (const loc of REQUIRED_LOCALES) for (const e of everById) assert(e.labels?.[loc], `evergreen ${e.slug}: missing ${loc}`);

  let dayIndex = 0;
  let coveredDays = 0;
  let evergreenDays = 0;
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= DAYS_IN_MONTH[m - 1]; d++) {
      const date = `${pad2(m)}-${pad2(d)}`;
      if (!byDate[date] || byDate[date].length === 0) {
        const e = everById[dayIndex % everById.length];
        // Der Validator verlangt GLOBAL eindeutige ids; ein Evergreen wird aber
        // an mehreren Tagen verwendet. Deshalb bekommt jede Nutzung eine tages-
        // eindeutige id, waehrend der labelKey (und damit das i18n-Label) geteilt
        // bleibt — der App-Sanitizer koppelt id/labelKey nicht.
        byDate[date] = [{ id: `${e.id}_${date.replace('-', '')}`, labelKey: e.labelKey }];
        evergreenDays++;
      } else {
        coveredDays++;
      }
      dayIndex++;
    }
  }

  // Alle ids sind global eindeutig (Harvest/kuratiert je einmal via seenSlugs,
  // Evergreens mit tages-eindeutigem Suffix) — passt zum globalen Duplikat-Check
  // des Validators.
  const funOccasions = {};
  for (const date of Object.keys(byDate).sort()) funOccasions[date] = byDate[date];

  const i18nSorted = {};
  for (const loc of ALL_LOCALES) {
    if (!i18n[loc]) continue;
    i18nSorted[loc] = {};
    for (const slug of Object.keys(i18n[loc]).sort()) i18nSorted[loc][slug] = i18n[loc][slug];
  }

  // Version-Bump erzwingbar via FUN_VERSION (Clients laden bei hoeherer Version neu);
  // ohne Env bleibt die bestehende Version (In-Place-Rebuild).
  const version = Number(process.env.FUN_VERSION) || (await currentVersion());
  const pkg = { countryCode: 'FUN', version, schemaVersion: 1, definitions: [], funOccasions, i18n: { funOccasions: i18nSorted } };

  const outDir = join(PACKAGES, 'FUN', `v${version}`);
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  const totalDays = DAYS_IN_MONTH.reduce((a, b) => a + b, 0);
  console.log(
    `FUN v${version}: ${Object.keys(funOccasions).length}/${totalDays} Tage belegt ` +
      `(${coveredDays} real, ${evergreenDays} Evergreen), Sprachen [${Object.keys(i18nSorted).join(', ')}].`,
  );
  if (warnings.size > 0) console.warn(`  Sprach-Luecken: ${warnings.size} (App-i18n-Fallback greift)`);
  assert(Object.keys(funOccasions).length === totalDays, `nicht alle ${totalDays} Tage belegt`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
