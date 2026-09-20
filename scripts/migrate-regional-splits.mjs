#!/usr/bin/env node
/**
 * Offline-Migration zu NAGER_REGIONAL_SPLITS (scripts/config.mjs).
 *
 * Nager fuehrt GB „Summer Bank Holiday" unter einem Namen mit zwei Terminen:
 * Schottland erster, England/Wales/Nordirland letzter Montag im August. Das
 * Paket trug bisher EINE landesweite Definition mit dem letzten Montag — fuer
 * Schottland der falsche Tag. `fetch-holidays.mjs` spaltet das seit diesem
 * Stand selbst auf; dieses Skript zieht die veroeffentlichten Pakete ohne
 * Netz nach und liefert dasselbe Ergebnis wie ein frischer Fetch:
 *
 *   - Die bestehende ID bleibt (aktivierte IDs der Nutzer brechen nicht) und
 *     bekommt `regions` = Full-Set des Landes minus Split-Regionen.
 *   - Die Split-Definition (neue ID aus dem Split-Namen) steht direkt DAVOR —
 *     Nager sortiert nach Datum, der erste Montag kommt vor dem letzten.
 *   - Regel des Splits = `rule` aus der Konfiguration (das Paket kennt die
 *     Split-Termine nicht); Kategorie wie der Hauptanlass.
 *   - Labels/Artikel/Bilder kommen ueber den regulaeren Content-Merge
 *     (Label-Katalog in 17 Sprachen, ARTICLE_ALIASES) — EIN Bump je Paket.
 *
 * Idempotent: ein Paket, das die Split-ID schon traegt, bleibt unveraendert.
 *
 * Nutzung: node scripts/migrate-regional-splits.mjs [--dry-run]
 */
import { pathToFileURL } from 'node:url';
import { NAGER_REGIONAL_SPLITS, NAGER_FULL_REGION_SETS } from './config.mjs';
import { readLatestPackage, writePackageIfChanged, holidayDefinition } from './lib/packageWriter.mjs';
import { slugify } from './lib/nagerSlug.mjs';
import { loadMergeContext, mergeContent } from './build-articles.mjs';

/**
 * Wendet die Splits eines Landes auf ein Paket an. Liefert `{ pkg, changes }`;
 * `pkg` ist ein neues Objekt (Eingabe bleibt unveraendert), `changes` die
 * Klartext-Liste der Eingriffe (leer = nichts zu tun).
 */
export function applyRegionalSplits(cc, pkg, { splits = NAGER_REGIONAL_SPLITS[cc], fullSet = NAGER_FULL_REGION_SETS[cc] } = {}) {
  const changes = [];
  let applied = false;
  let definitions = [...(pkg.definitions ?? [])];
  const enLabels = { ...(pkg.i18n?.holidays?.en ?? {}) };

  for (const [baseName, list] of Object.entries(splits ?? {})) {
    const baseId = `${cc}_${slugify(baseName)}`;
    for (const split of list) {
      const slug = slugify(split.name);
      const splitId = `${cc}_${slug}`;
      if (definitions.some((d) => d.id === splitId)) continue; // schon migriert
      const index = definitions.findIndex((d) => d.id === baseId);
      if (index === -1) {
        changes.push(`${baseId}: nicht im Paket — Split „${split.name}" uebersprungen`);
        continue;
      }
      if (!split.rule) throw new Error(`${cc} „${split.name}": Split ohne rule laesst sich offline nicht migrieren`);
      const base = definitions[index];
      // Hauptanlass: bisherige Regionen (oder das Full-Set, wenn landesweit) minus Split-Regionen.
      const before = Array.isArray(base.regions) && base.regions.length > 0 ? base.regions : fullSet;
      if (!Array.isArray(before) || before.length === 0) {
        throw new Error(`${cc} ${baseId}: landesweit, aber kein NAGER_FULL_REGION_SETS.${cc} — Restregionen unbekannt`);
      }
      const rest = before.filter((c) => !split.counties.includes(c)).sort();
      if (rest.length === 0) throw new Error(`${cc} ${baseId}: nach dem Split bliebe keine Region uebrig`);

      const { regions: _old, rule, ...head } = base;
      const narrowed = { ...head, regions: rest, rule };
      const added = holidayDefinition({
        id: splitId,
        countryCode: cc,
        slug,
        rule: split.rule,
        category: base.category,
        regions: [...split.counties].sort(),
      });
      definitions = [...definitions.slice(0, index), added, narrowed, ...definitions.slice(index + 1)];
      enLabels[slug] = split.name;
      applied = true;
      changes.push(`${splitId} neu (${added.regions.join(', ')}), ${baseId} -> regions ${rest.join(', ')}`);
    }
  }

  if (!applied) return { pkg, changes };
  // Englisches Label in Definitionsreihenfolge wie beim Fetch (mergeHolidayLabels
  // leitet die Schluesselmenge aller Sprachen aus `en` ab).
  const order = definitions.map((d) => d.labelKey.replace(/^holidays\./, ''));
  const en = Object.fromEntries(
    Object.entries(enLabels).sort(([a], [b]) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
    }),
  );
  return {
    pkg: { ...pkg, definitions, i18n: { ...pkg.i18n, holidays: { ...pkg.i18n?.holidays, en } } },
    changes,
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const ctx = await loadMergeContext();
  for (const cc of Object.keys(NAGER_REGIONAL_SPLITS).sort()) {
    const latest = await readLatestPackage(cc);
    if (!latest) {
      console.warn(`  ${cc}: kein Paket, uebersprungen`);
      continue;
    }
    const { pkg, changes } = applyRegionalSplits(cc, latest.pkg);
    for (const c of changes) console.log(`  ${cc}: ${c}`);
    if (pkg === latest.pkg) {
      console.log(`  ${cc}: v${latest.version} unveraendert`);
      continue;
    }
    const content = await mergeContent(cc, pkg, ctx);
    if (dryRun) {
      console.log(`  ${cc}: v${latest.version} -> v${latest.version + 1} (dry-run, nicht geschrieben)`);
      continue;
    }
    const { version, changed } = await writePackageIfChanged(cc, content);
    console.log(`  ${cc}: v${version}${changed ? ' (neu)' : ' (unveraendert)'}`);
  }
  if (!dryRun) console.log('Jetzt: npm run build:index && npm run validate');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
