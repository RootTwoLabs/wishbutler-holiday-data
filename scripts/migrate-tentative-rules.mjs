#!/usr/bin/env node
/**
 * G-6 / D-1 (Audit 2026-09-20): Fuehrt "(tentative date)"-Definitionen mit
 * ihrem kanonischen Gegenstueck zusammen — OHNE Netzzugriff.
 *
 * Nager haengt an noch nicht amtlich bestaetigte Termine "(tentative date)"
 * an den Namen; die bisherige Slugify-Logik machte daraus eine eigene ID
 * (`TR_eid_al_fitr_first_day` nur 2026 + `TR_eid_al_fitr_first_day_tentative_date`
 * 2027–2030). Die vom Nutzer aktivierte kanonische ID endete damit 2026 —
 * ab 2027 fehlte das Fest in Home/Kalender/Erinnerung. Seit lib/nagerSlug.mjs
 * entfernt fetch-holidays.mjs das Suffix vor dem Slug; dieses Skript zieht die
 * bereits veroeffentlichten Pakete nach:
 *
 *   - Jahre beider `precomputed`-Tabellen vereinigen (kanonische Jahre haben
 *     bei Kollision Vorrang), Regel bleibt `precomputed` (islamische Feste sind
 *     nicht closed-form — detectRule wird bewusst NICHT erneut angewendet).
 *   - `_tentative_date`-Definition entfernen; Labels/Artikel/Bild-Keys der
 *     Tentative-ID aus `i18n.holidays`, `i18n.holidayInfo` und `images` streichen
 *     (der labelKey bleibt der kanonische). Fehlt dem kanonischen Slug ein
 *     Label in einer Locale, wird das Tentative-Label ohne Klammerzusatz
 *     uebernommen.
 *   - Tentative ohne kanonisches Gegenstueck: nur umbenennen.
 *   - Danach derselbe Content-Merge wie in build-articles.mjs und
 *     writePackageIfChanged (Bump nur bei Aenderung).
 *   - Verwaiste `_tentative_date`-Keys im Label-Katalog
 *     (content/holiday-labels/<locale>.json) werden entfernt.
 *
 * Nutzung: node scripts/migrate-tentative-rules.mjs [--dry-run] [CC ...]
 * Danach: npm run build:index && npm run validate
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PACKAGES, readLatestPackage, writePackageIfChanged } from './lib/packageWriter.mjs';
import { slugFromLabelKey } from './lib/contentLoader.mjs';
import { TENTATIVE_SLUG_SUFFIX, canonicalSlugForTentative } from './lib/nagerSlug.mjs';
import { loadMergeContext, mergeContent } from './build-articles.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LABEL_CATALOG_DIR = join(__dirname, '..', 'content', 'holiday-labels');

/** "Eid al-Fitr (Tentative Date)" / "Opferfest (vorlaeufiger Termin)" -> ohne Klammerzusatz am Ende. */
export function stripTrailingParenthetical(label) {
  if (typeof label !== 'string') return label;
  return label.replace(/\s*\([^()]*\)\s*$/, '').trim() || label;
}

/** Jahr -> MM-DD, aufsteigend nach Jahr sortiert (stabile Serialisierung). */
function sortedDates(dates) {
  return Object.fromEntries(
    Object.entries(dates).sort(([a], [b]) => Number(a) - Number(b)),
  );
}

/**
 * Wendet die Migration auf ein Paket (in-memory) an. Liefert das neue Paket
 * (ohne `version`, kanonische Feldreihenfolge) plus `changes`; leer = nichts zu tun.
 */
export function migratePackage(cc, pkg) {
  const changes = [];
  const byId = new Map(pkg.definitions.map((d) => [d.id, d]));
  // tentativeSlug -> canonicalSlug (fuer Labels/Artikel/Bilder)
  const slugMap = new Map();
  const merged = new Map(); // canonicalId -> neue Definition
  const renamed = new Map(); // tentativeId -> neue Definition (ohne Gegenstueck)
  const consumed = new Set(); // tentativeIds, die in ihr Gegenstueck aufgegangen sind

  for (const def of pkg.definitions) {
    if (!TENTATIVE_SLUG_SUFFIX.test(def.id)) continue;
    const canonicalId = canonicalSlugForTentative(def.id);
    const tentativeSlug = slugFromLabelKey(def.labelKey);
    const canonicalSlug = canonicalSlugForTentative(tentativeSlug);
    const canonical = byId.get(canonicalId);

    if (!canonical) {
      renamed.set(def.id, { ...def, id: canonicalId, labelKey: `holidays.${canonicalSlug}` });
      slugMap.set(tentativeSlug, canonicalSlug);
      changes.push({ id: def.id, canonicalId, kind: 'renamed', years: Object.keys(def.rule?.dates ?? {}) });
      continue;
    }
    if (def.kind !== 'precomputed' || canonical.kind !== 'precomputed') {
      // Nicht zusammenfuehrbar (verschiedene Regeltypen) — bewusst unangetastet lassen.
      changes.push({ id: def.id, canonicalId, kind: 'skipped', reason: `${def.kind} vs ${canonical.kind}` });
      continue;
    }
    const base = merged.get(canonicalId) ?? canonical;
    // Kanonische Jahre gewinnen bei Kollision.
    const dates = sortedDates({ ...def.rule.dates, ...base.rule.dates });
    merged.set(canonicalId, { ...base, rule: { ...base.rule, dates } });
    consumed.add(def.id);
    slugMap.set(tentativeSlug, canonicalSlug);
    changes.push({
      id: def.id,
      canonicalId,
      kind: 'merged',
      addedYears: Object.keys(def.rule.dates).filter((y) => base.rule.dates[y] == null),
      years: Object.keys(dates),
    });
  }
  if (!changes.some((c) => c.kind !== 'skipped')) return { pkg, changes };

  const definitions = [];
  for (const def of pkg.definitions) {
    if (consumed.has(def.id)) continue; // in kanonische Definition aufgegangen
    if (merged.has(def.id)) definitions.push(merged.get(def.id));
    else if (renamed.has(def.id)) definitions.push(renamed.get(def.id));
    else definitions.push(def);
  }

  const holidays = {};
  for (const [locale, labels] of Object.entries(pkg.i18n?.holidays ?? {})) {
    const next = { ...labels };
    for (const [tentativeSlug, canonicalSlug] of slugMap) {
      const value = next[tentativeSlug];
      delete next[tentativeSlug];
      if (value != null && next[canonicalSlug] == null) next[canonicalSlug] = stripTrailingParenthetical(value);
    }
    if (Object.keys(next).length > 0) holidays[locale] = next;
  }

  let holidayInfo;
  if (pkg.i18n?.holidayInfo) {
    holidayInfo = {};
    for (const [locale, articles] of Object.entries(pkg.i18n.holidayInfo)) {
      const next = { ...articles };
      for (const [tentativeSlug, canonicalSlug] of slugMap) {
        const value = next[tentativeSlug];
        delete next[tentativeSlug];
        if (value != null && next[canonicalSlug] == null) next[canonicalSlug] = value;
      }
      if (Object.keys(next).length > 0) holidayInfo[locale] = next;
    }
  }

  let images;
  if (pkg.images) {
    images = { ...pkg.images };
    for (const [tentativeSlug, canonicalSlug] of slugMap) {
      const value = images[tentativeSlug];
      delete images[tentativeSlug];
      if (value != null && images[canonicalSlug] == null) images[canonicalSlug] = value;
    }
  }

  const migrated = {
    countryCode: pkg.countryCode,
    schemaVersion: pkg.schemaVersion,
    definitions,
    ...(pkg.namedays ? { namedays: pkg.namedays } : {}),
    i18n: { holidays, ...(holidayInfo && Object.keys(holidayInfo).length > 0 ? { holidayInfo } : {}) },
    ...(images && Object.keys(images).length > 0 ? { images } : {}),
  };
  return { pkg: migrated, changes };
}

/** Entfernt `_tentative_date`-Keys aus content/holiday-labels/<locale>.json. */
export async function pruneLabelCatalog(dir, { dryRun = false } = {}) {
  const result = {};
  if (!existsSync(dir)) return result;
  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.json')).sort()) {
    const path = join(dir, file);
    const catalog = JSON.parse(await readFile(path, 'utf8'));
    const stale = Object.keys(catalog).filter((k) => TENTATIVE_SLUG_SUFFIX.test(k));
    if (stale.length === 0) continue;
    for (const k of stale) delete catalog[k];
    result[file] = stale;
    if (!dryRun) await writeFile(path, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
  }
  return result;
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
  const summary = { countries: 0, pairs: 0, renamed: 0, skipped: 0, bumped: [] };

  for (const cc of countries.sort()) {
    const latest = await readLatestPackage(cc);
    if (!latest) continue;
    const { pkg, changes } = migratePackage(cc, latest.pkg);
    if (changes.length === 0) continue;

    summary.countries += 1;
    for (const c of changes) {
      if (c.kind === 'merged') {
        summary.pairs += 1;
        console.log(`  ${c.id} -> ${c.canonicalId}: +${c.addedYears.join(',') || '-'}  (Jahre jetzt ${c.years.join(',')})`);
      } else if (c.kind === 'renamed') {
        summary.renamed += 1;
        console.log(`  ${c.id} -> ${c.canonicalId}: umbenannt (kein Gegenstueck, Jahre ${c.years.join(',')})`);
      } else {
        summary.skipped += 1;
        console.warn(`  ${c.id}: NICHT zusammengefuehrt (${c.reason})`);
      }
    }
    if (!changes.some((c) => c.kind !== 'skipped')) continue;

    const content = await mergeContent(cc, pkg, ctx);
    if (dryRun) {
      console.log(`  ${cc}: v${latest.version} -> v${latest.version + 1} (dry-run, nicht geschrieben)`);
      continue;
    }
    const { version, changed } = await writePackageIfChanged(cc, content);
    if (changed) summary.bumped.push(`${cc} v${latest.version}->v${version}`);
    console.log(`  ${cc}: ${changed ? `v${latest.version} -> v${version}` : 'unveraendert'}`);
  }

  const pruned = await pruneLabelCatalog(LABEL_CATALOG_DIR, { dryRun });
  const prunedCount = Object.values(pruned).reduce((n, keys) => n + keys.length, 0);

  console.log(
    `\n${summary.pairs} Paar(e) zusammengefuehrt, ${summary.renamed} umbenannt, ${summary.skipped} uebersprungen ` +
      `in ${summary.countries} Land/Laendern; Label-Katalog: ${prunedCount} verwaiste Keys in ${Object.keys(pruned).length} Datei(en)` +
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
