#!/usr/bin/env node
/**
 * Scans data/packages/<CC>/v<N>/package.json, selects the highest version per
 * country, and (re)writes data/index.json. Preserves the existing baseUrl.
 */
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'data');
const PACKAGES = join(DATA, 'packages');
const INDEX = join(DATA, 'index.json');

const DEFAULT_BASE_URL =
  'https://cdn.jsdelivr.net/gh/RootTwoLabs/wishbutler-holiday-data@main/data';

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function listDirs(path) {
  if (!existsSync(path)) return [];
  const entries = await readdir(path, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

function versionFromDir(name) {
  const m = /^v(\d+)$/.exec(name);
  return m ? parseInt(m[1], 10) : null;
}

async function main() {
  const countries = [];
  for (const code of await listDirs(PACKAGES)) {
    const countryDir = join(PACKAGES, code);
    let best = null;
    for (const versionDir of await listDirs(countryDir)) {
      const version = versionFromDir(versionDir);
      if (version == null) continue;
      if (!best || version > best.version) {
        best = { version, dir: versionDir };
      }
    }
    if (!best) continue;

    const rel = `packages/${code}/${best.dir}/package.json`;
    const abs = join(DATA, rel);
    const pkg = await readJson(abs);
    const { size } = await stat(abs);

    const locales = pkg.i18n?.holidays
      ? Object.keys(pkg.i18n.holidays).sort()
      : [];

    countries.push({
      code,
      version: best.version,
      package: rel,
      sizeBytes: size,
      locales,
      hasNamedays: Boolean(pkg.namedays && Object.keys(pkg.namedays).length > 0),
      hasInfo: Boolean(
        pkg.i18n?.holidayInfo && Object.keys(pkg.i18n.holidayInfo).length > 0,
      ),
      hasImages: Boolean(pkg.images && Object.keys(pkg.images).length > 0),
    });
  }

  countries.sort((a, b) => a.code.localeCompare(b.code));

  let baseUrl = DEFAULT_BASE_URL;
  if (existsSync(INDEX)) {
    try {
      baseUrl = (await readJson(INDEX)).baseUrl ?? DEFAULT_BASE_URL;
    } catch {
      /* keep default */
    }
  }

  const index = {
    schemaVersion: 1,
    baseUrl,
    generatedAt: new Date().toISOString(),
    countries,
  };

  await writeFile(INDEX, JSON.stringify(index, null, 2) + '\n', 'utf8');
  console.log(`index.json written with ${countries.length} countries.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
