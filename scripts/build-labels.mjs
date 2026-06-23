#!/usr/bin/env node
/**
 * Merges curated holiday label translations from content/holiday-labels into
 * every latest package version.
 *
 * Usage: node scripts/build-labels.mjs [CC ...]
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALES } from './config.mjs';

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

async function loadLabelCatalog() {
  const catalog = {};
  for (const locale of LOCALES) {
    const file = join(LABELS, `${locale}.json`);
    if (!existsSync(file)) continue;
    catalog[locale] = await readJson(file);
  }
  return catalog;
}

function buildLocaleLabels(keys, source) {
  const labels = {};
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      labels[key] = value;
    }
  }
  return labels;
}

async function mergePackage(cc, labelCatalog) {
  const packagePath = await latestPackagePath(cc);
  if (!packagePath) return false;

  const pkg = await readJson(packagePath);
  const english = pkg.i18n?.holidays?.en;
  if (!english) return false;

  const keys = Object.keys(english);
  pkg.i18n ??= {};
  pkg.i18n.holidays ??= {};

  let changed = false;
  for (const locale of LOCALES) {
    const source = locale === 'en' ? english : labelCatalog[locale];
    if (!source) continue;

    const labels = locale === 'en' ? english : buildLocaleLabels(keys, source);
    if (Object.keys(labels).length === 0) continue;

    const current = pkg.i18n.holidays[locale] ?? {};
    if (JSON.stringify(current) !== JSON.stringify(labels)) {
      pkg.i18n.holidays[locale] = labels;
      changed = true;
    }
  }

  if (changed) {
    await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
  }
  return changed;
}

async function main() {
  const only = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
  const countries = only.length > 0 ? only : (await listDirs(PACKAGES)).filter((cc) => /^[A-Z]{2}$/.test(cc));
  const labelCatalog = await loadLabelCatalog();
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
