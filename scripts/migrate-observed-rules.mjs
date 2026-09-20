#!/usr/bin/env node
/**
 * G-1: Repariert bestehende Laenderpakete OHNE Netzzugriff.
 *
 * Nager-"observed"-Ersatztage (US-Weihnachten 2027 am 24.12., GB Boxing Day
 * 2026 am 28.12. …) wurden bisher als `precomputed`-Tabellen gespeichert, weil
 * die #134-Rueckverprobung jede Abweichung vom Fixdatum ablehnte. Seit der
 * Ersatztag-Toleranz in lib/ruleDetection.mjs (detectObservedFixed) liefert
 * detectRule fuer solche Tabellen `fixed`. Dieses Skript schickt jede
 * `precomputed`-Definition der latest-Pakete erneut durch detectRule (Eingabe =
 * `rule.dates`), ersetzt die Regel bei Ergebnis `fixed` und fuehrt dann genau
 * das Alias-Merging auf GLOBAL_RULES durch, das fetch-holidays.mjs beim
 * naechsten Cron taete (labelKey -> kanonischer GLOBAL-Slug, keine
 * Paket-Labels mehr fuer den gemergten Slug). Anschliessend laeuft derselbe
 * Content-Merge wie in build-articles.mjs (Artikel/Bilder fuer den neuen Slug),
 * damit das Ergebnis in EINEM Versions-Bump dem entspricht, was die
 * CI-Pipeline fetch-holidays -> build-articles erzeugen wuerde.
 *
 * Nutzung: node scripts/migrate-observed-rules.mjs [--dry-run] [CC ...]
 * Danach: npm run build:index && npm run validate
 */
import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { GLOBAL_RULES, HOLIDAY_SLUG_ALIASES } from './config.mjs';
import { detectRule, rulesEqual } from './lib/ruleDetection.mjs';
import { PACKAGES, readLatestPackage, writePackageIfChanged } from './lib/packageWriter.mjs';
import { slugFromLabelKey } from './lib/contentLoader.mjs';
import { loadMergeContext, mergeContent } from './build-articles.mjs';

/**
 * Spiegelt fetch-holidays.mjs (buildCountry): Label-Slug einer Definition aus
 * Nager-Slug + Regel. Der Nager-Slug steckt in der id (`<CC>_<slug>`).
 */
export function labelSlugFor(cc, nagerSlug, rule) {
  const canonical = HOLIDAY_SLUG_ALIASES[nagerSlug] ?? nagerSlug;
  const isGlobal = Boolean(GLOBAL_RULES[canonical]) && rulesEqual(rule, GLOBAL_RULES[canonical]);
  if (isGlobal) return { labelSlug: canonical, isGlobal: true };
  if (GLOBAL_RULES[nagerSlug]) return { labelSlug: `${nagerSlug}_${cc.toLowerCase()}`, isGlobal: false };
  return { labelSlug: nagerSlug, isGlobal: false };
}

/**
 * Wendet die Migration auf ein Paket (in-memory) an. Liefert das neue Paket
 * (ohne Content-Merge) plus Statistik; `changes` leer = nichts zu tun.
 */
export function migratePackage(cc, pkg) {
  const changes = [];
  const definitions = pkg.definitions.map((def) => {
    if (def.kind !== 'precomputed' || !def.rule?.dates) return def;
    if (!def.id.startsWith(`${cc}_`)) return def;
    const rule = detectRule({ years: def.rule.dates });
    if (rule.type !== 'fixed') return def;

    const nagerSlug = def.id.slice(cc.length + 1);
    const oldSlug = slugFromLabelKey(def.labelKey);
    const { labelSlug, isGlobal } = labelSlugFor(cc, nagerSlug, rule);
    changes.push({ id: def.id, oldSlug, labelSlug, isGlobal, rule, dates: def.rule.dates });
    return { ...def, kind: 'fixed', labelKey: `holidays.${labelSlug}`, rule };
  });
  if (changes.length === 0) return { pkg, changes };

  // Labels wie fetch-holidays: fuer GLOBAL-gemergte Slugs keine Paket-Labels
  // (die App nutzt ihre gebuendelten Uebersetzungen); ein umbenannter,
  // nicht-globaler Slug nimmt seine Labels mit.
  const holidays = {};
  for (const [locale, labels] of Object.entries(pkg.i18n?.holidays ?? {})) {
    const next = { ...labels };
    for (const c of changes) {
      if (c.oldSlug === c.labelSlug) continue;
      const value = next[c.oldSlug];
      delete next[c.oldSlug];
      if (!c.isGlobal && value != null) next[c.labelSlug] = value;
    }
    if (Object.keys(next).length > 0) holidays[locale] = next;
  }

  const migrated = {
    countryCode: pkg.countryCode,
    schemaVersion: pkg.schemaVersion,
    definitions,
    ...(pkg.namedays ? { namedays: pkg.namedays } : {}),
    i18n: { holidays, ...(pkg.i18n?.holidayInfo ? { holidayInfo: pkg.i18n.holidayInfo } : {}) },
    ...(pkg.images ? { images: pkg.images } : {}),
  };
  return { pkg: migrated, changes };
}

function fmtRule(rule) {
  return `${String(rule.month).padStart(2, '0')}-${String(rule.day).padStart(2, '0')}`;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const only = args.filter((a) => !a.startsWith('-'));
  const countries =
    only.length > 0
      ? only
      : (await readdir(PACKAGES)).filter((c) => /^[A-Z]{2}$/.test(c) && existsSync(`${PACKAGES}/${c}`));

  const ctx = await loadMergeContext();
  const summary = { countries: 0, definitions: 0, merged: 0, bumped: [] };

  for (const cc of countries.sort()) {
    const latest = await readLatestPackage(cc);
    if (!latest) continue;
    const { pkg, changes } = migratePackage(cc, latest.pkg);
    if (changes.length === 0) continue;

    summary.countries += 1;
    summary.definitions += changes.length;
    for (const c of changes) {
      if (c.isGlobal) summary.merged += 1;
      const merge = c.isGlobal ? ` -> GLOBAL ${c.labelSlug}` : c.oldSlug !== c.labelSlug ? ` -> ${c.labelSlug}` : '';
      const devs = Object.entries(c.dates)
        .filter(([, mmdd]) => mmdd !== fmtRule(c.rule))
        .map(([y, mmdd]) => `${y}:${mmdd}`)
        .join(' ');
      console.log(`  ${c.id}: precomputed -> fixed ${fmtRule(c.rule)}${merge}  (Ersatztage: ${devs || '-'})`);
    }

    const content = await mergeContent(cc, pkg, ctx);
    if (dryRun) {
      console.log(`  ${cc}: v${latest.version} -> v${latest.version + 1} (dry-run, nicht geschrieben)`);
      continue;
    }
    const { version, changed } = await writePackageIfChanged(cc, content);
    if (changed) summary.bumped.push(`${cc} v${latest.version}->v${version}`);
    console.log(`  ${cc}: ${changed ? `v${latest.version} -> v${version}` : 'unveraendert'}`);
  }

  console.log(
    `\n${summary.definitions} Definition(en) in ${summary.countries} Land/Laendern -> fixed, ` +
      `${summary.merged} davon auf GLOBAL gemergt.` +
      (dryRun ? ' (dry-run)' : `\nGebumpt: ${summary.bumped.join(', ') || 'keine'}`),
  );
  if (!dryRun && summary.bumped.length > 0) console.log('Jetzt: npm run build:index && npm run validate');
}

// Nur als Skript ausfuehren — beim Import (Tests) nicht.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
