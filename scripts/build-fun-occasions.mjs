#!/usr/bin/env node
/**
 * Baut das FUN-Paket ("Kurioser Tag") aus:
 *   1. content/fun-occasions.json          — Wikidata-Harvest (CC0), bereits auf
 *                                            wirklich lustige Anlaesse gefiltert.
 *   2. content/fun-occasions-curated.json   — kuratiert (eigene Formulierung),
 *        .dated -> echte, bekannte Fun-Tage als Ergaenzung.
 *
 * NUR ECHTE Anlaesse: kein Evergreen-Backstop, keine Erfindungen, keine
 * Wiederholungen. Tage OHNE echten Anlass bleiben bewusst leer — die Heute-
 * Karte erscheint an solchen Tagen dann gar nicht (bewusste Entscheidung, weil
 * es keine lizenzfreie Quelle mit 365 echten Fun-Tagen gibt). Cap 3/Tag.
 *
 * Beide Quellen sind zuvor durch translate-fun-occasions.mjs auf alle 12
 * App-Sprachen ergaenzt worden.
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
const ALL_LOCALES = ['de', 'en', 'es', 'fr', 'it', 'pl', 'pt', 'nl', 'sv', 'ru', 'uk', 'ja', 'ko', 'zh-Hant'];
const MAX_PER_DAY = 3;
const DATE_RE = /^[0-1][0-9]-[0-3][0-9]$/;

function assert(cond, msg) {
  if (!cond) {
    console.error(`build-fun-occasions: ${msg}`);
    process.exit(1);
  }
}

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

/** Ein Occasion -> Paket-Eintrag + i18n. Ueberspringt bereits gesehene slugs. */
function pushOccasion(occ, list, i18n, seenSlugs, warnings) {
  assert(/^[a-z0-9_]+$/.test(occ.slug), `invalid slug "${occ.slug}"`);
  if (seenSlugs.has(occ.slug)) return;
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
  const curatedDoc = await readJson(CURATED, { dated: [] });
  const harvest = harvestDoc.occasions ?? [];
  const dated = curatedDoc.dated ?? [];

  const byDate = {};
  const i18n = {};
  const seenSlugs = new Set();
  const warnings = new Set();

  // 1) Harvest (nach Bekanntheit vorsortiert) — pro Tag bis MAX_PER_DAY.
  for (const occ of harvest) {
    if (!DATE_RE.test(occ.date)) continue;
    (byDate[occ.date] ??= []);
    if (byDate[occ.date].length >= MAX_PER_DAY) continue;
    pushOccasion(occ, byDate[occ.date], i18n, seenSlugs, warnings);
  }
  // 2) Kuratierte dated — fuellt/ergaenzt bis MAX_PER_DAY.
  for (const occ of dated) {
    assert(DATE_RE.test(occ.date), `curated dated: invalid date "${occ.date}" for "${occ.slug}"`);
    (byDate[occ.date] ??= []);
    if (byDate[occ.date].length >= MAX_PER_DAY) continue;
    pushOccasion(occ, byDate[occ.date], i18n, seenSlugs, warnings);
  }

  // Nur Tage MIT Anlass, sortiert. Kein 366-Zwang.
  const funOccasions = {};
  for (const date of Object.keys(byDate).sort()) {
    if (byDate[date].length > 0) funOccasions[date] = byDate[date];
  }

  const i18nSorted = {};
  for (const loc of ALL_LOCALES) {
    if (!i18n[loc]) continue;
    i18nSorted[loc] = {};
    for (const slug of Object.keys(i18n[loc]).sort()) i18nSorted[loc][slug] = i18n[loc][slug];
  }

  const version = Number(process.env.FUN_VERSION) || (await currentVersion());
  const pkg = { countryCode: 'FUN', version, schemaVersion: 1, definitions: [], funOccasions, i18n: { funOccasions: i18nSorted } };

  const outDir = join(PACKAGES, 'FUN', `v${version}`);
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  const dayCount = Object.keys(funOccasions).length;
  const occCount = Object.values(funOccasions).reduce((a, l) => a + l.length, 0);
  console.log(
    `FUN v${version}: ${occCount} echte Anlaesse an ${dayCount} Tagen (nur echt, keine Wiederholung), ` +
      `Sprachen [${Object.keys(i18nSorted).join(', ')}].`,
  );
  if (warnings.size > 0) console.warn(`  Sprach-Luecken: ${warnings.size} (App-i18n-Fallback greift)`);
  assert(dayCount >= 20, `zu wenige Tage belegt (${dayCount}) — vermutlich fehlerhafter Harvest`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
