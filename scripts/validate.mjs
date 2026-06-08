#!/usr/bin/env node
/**
 * Validates data/index.json and every country package against the JSON schemas.
 * Also runs cross-checks the schema cannot express (referential integrity).
 */
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'data');
const SCHEMA = join(ROOT, 'schema');

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function main() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  const indexSchema = await readJson(join(SCHEMA, 'index.schema.json'));
  const packageSchema = await readJson(join(SCHEMA, 'package.schema.json'));
  const validateIndex = ajv.compile(indexSchema);
  const validatePackage = ajv.compile(packageSchema);

  const errors = [];

  const index = await readJson(join(DATA, 'index.json'));
  if (!validateIndex(index)) {
    errors.push(`index.json: ${ajv.errorsText(validateIndex.errors)}`);
  }

  for (const country of index.countries ?? []) {
    const pkgPath = join(DATA, country.package);
    if (!existsSync(pkgPath)) {
      errors.push(`${country.code}: package missing at ${country.package}`);
      continue;
    }
    const pkg = await readJson(pkgPath);
    if (!validatePackage(pkg)) {
      errors.push(`${country.code}: ${ajv.errorsText(validatePackage.errors)}`);
      continue;
    }
    if (pkg.countryCode !== country.code) {
      errors.push(`${country.code}: countryCode mismatch (${pkg.countryCode})`);
    }
    if (pkg.version !== country.version) {
      errors.push(`${country.code}: version mismatch (index ${country.version} vs pkg ${pkg.version})`);
    }
    const ids = new Set();
    for (const def of pkg.definitions) {
      if (ids.has(def.id)) errors.push(`${country.code}: duplicate definition id ${def.id}`);
      ids.add(def.id);
    }
  }

  if (errors.length > 0) {
    console.error('Validation failed:\n' + errors.map((e) => `  - ${e}`).join('\n'));
    process.exit(1);
  }
  console.log('All packages valid.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
