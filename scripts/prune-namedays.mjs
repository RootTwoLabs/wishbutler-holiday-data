#!/usr/bin/env node
/**
 * G-11 (Audit 2026-09-20): Wendet den Nicht-Namen-Filter (lib/namedayFilter.mjs)
 * OHNE Netz auf die Namenstagstabellen der jeweils letzten Paketversion an
 * und schreibt bereinigte Tabellen als neue Version (writePackageIfChanged —
 * veroeffentlichte Versionen bleiben unangetastet, unveraenderte Tabellen
 * erzeugen keinen Bump).
 *
 * Der regulaere Weg (`npm run build:namedays`, abalin, ~7 min) filtert beim
 * Einlesen mit demselben `parseNames`; dieses Skript ist fuer den Fall, dass
 * der Filter erweitert wurde und die vorhandenen Tabellen nachgezogen werden
 * sollen, ohne die Quelle erneut abzufragen.
 *
 * Usage: node scripts/prune-namedays.mjs [--dry-run] [CC ...]
 *   --dry-run  nur auflisten, was fallen wuerde (nichts schreiben)
 *   CC         nur diese Laender (Default: alle Pakete mit `namedays`)
 */
import { readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { PACKAGES, readLatestPackage, writePackageIfChanged } from './lib/packageWriter.mjs';
import { pruneNamedays } from './lib/namedayFilter.mjs';
import { withNamedays } from './fetch-namedays.mjs';

/**
 * Bereinigt ein Land: liest die letzte Version, filtert, schreibt bei
 * Aenderung. `dryRun` schreibt nichts.
 *
 * @returns {{ status: 'no-package' | 'no-namedays' | 'unchanged' | 'written' | 'dry-run', removed: Array<{day: string, name: string}>, days?: number, version?: number, prev?: number }}
 */
export async function pruneCountry(cc, { packagesDir, dryRun = false } = {}) {
  const latest = await readLatestPackage(cc, packagesDir ? { packagesDir } : {});
  if (!latest) return { status: 'no-package', removed: [] };
  const table = latest.pkg.namedays;
  if (!table || Object.keys(table).length === 0) return { status: 'no-namedays', removed: [] };

  const { table: pruned, removed } = pruneNamedays(table);
  const days = Object.keys(pruned).length;
  if (removed.length === 0) return { status: 'unchanged', removed, days, version: latest.version };
  if (dryRun) return { status: 'dry-run', removed, days, version: latest.version };

  const { version, changed } = await writePackageIfChanged(
    cc,
    withNamedays(latest.pkg, pruned),
    packagesDir ? { packagesDir } : {},
  );
  return { status: changed ? 'written' : 'unchanged', removed, days, version, prev: latest.version };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const only = args.filter((a) => !a.startsWith('-')).map((c) => c.toUpperCase());
  const countries = only.length > 0
    ? only
    : (await readdir(PACKAGES, { withFileTypes: true }))
        .filter((e) => e.isDirectory() && /^[A-Z]{2}$/.test(e.name))
        .map((e) => e.name)
        .sort();

  console.log(`${dryRun ? 'Pruefe' : 'Bereinige'} Namenstage in ${countries.length} Paketen...`);
  let totalRemoved = 0;
  for (const cc of countries) {
    const r = await pruneCountry(cc, { dryRun });
    if (r.status === 'no-package' || r.status === 'no-namedays') continue;
    totalRemoved += r.removed.length;
    if (r.status === 'unchanged') {
      console.log(`  ${cc}: ${r.days} Tage, nichts zu entfernen (v${r.version})`);
      continue;
    }
    const head = r.status === 'written'
      ? `  ${cc}: ${r.removed.length} Nicht-Namen entfernt, ${r.days} Tage -> v${r.prev} -> v${r.version}`
      : `  ${cc}: ${r.removed.length} Nicht-Namen wuerden fallen (${r.days} Tage bleiben, v${r.version})`;
    console.log(head);
    for (const { day, name } of r.removed) console.log(`      [${day}] ${name}`);
  }
  console.log(`${totalRemoved} Eintraege ${dryRun ? 'gefunden' : 'entfernt'}.`);
}

// Nur als Skript ausfuehren — beim Import (Tests) nicht.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
