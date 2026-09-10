#!/usr/bin/env node
/**
 * Merges curated holiday label translations from content/holiday-labels into
 * every latest package version.
 *
 * Usage: node scripts/build-labels.mjs [CC ...]
 */
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLabelCatalog, mergeHolidayLabels } from './lib/labelCatalog.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PACKAGES = join(ROOT, 'data', 'packages');
const LABELS = join(ROOT, 'content', 'holiday-labels');

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function listDirs(path) {
  if (!existsSync(path)) return [];
  const entries = await readdir(path, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

function versionFromDir(name) {
  const match = /^v(\d+)$/.exec(name);
  return match ? Number.parseInt(match[1], 10) : null;
}

async function latestPackagePath(cc) {
  const countryDir = join(PACKAGES, cc);
  const versions = (await listDirs(countryDir))
    .map(versionFromDir)
    .filter((version) => version != null)
    .sort((a, b) => a - b);
  const latest = versions.at(-1);
  return latest == null ? null : join(countryDir, `v${latest}`, 'package.json');
}

async function mergePackage(cc, labelCatalog) {
  const packagePath = await latestPackagePath(cc);
  if (!packagePath) return false;

  const pkg = await readJson(packagePath);
  const english = pkg.i18n?.holidays?.en;
  if (!english) return false;

  const labels = mergeHolidayLabels(pkg.i18n.holidays, labelCatalog);
  const changed = JSON.stringify(labels) !== JSON.stringify(pkg.i18n.holidays);
  if (changed) {
    pkg.i18n.holidays = labels;
    pkg.version += 1;
    const outputDir = join(PACKAGES, cc, `v${pkg.version}`);
    await mkdir(outputDir, { recursive: true });
    await writeFile(join(outputDir, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
  }
  return changed;
}

async function main() {
  const only = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
  const countries = only.length > 0 ? only : (await listDirs(PACKAGES)).filter((cc) => /^[A-Z]{2}$/.test(cc));
  const labelCatalog = await loadLabelCatalog(LABELS);
  const loadedLocales = Object.keys(labelCatalog).sort().join(', ');

  console.log(`Merging holiday labels (${loadedLocales}) into ${countries.length} country packages...`);
  let changed = 0;
  for (const cc of countries.sort()) {
    if (await mergePackage(cc, labelCatalog)) {
      changed += 1;
      console.log(`  ${cc}: labels updated`);
    }
  }
  console.log(`Updated ${changed} packages.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
