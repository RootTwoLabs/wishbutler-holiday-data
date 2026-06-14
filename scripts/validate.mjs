#!/usr/bin/env node
/**
 * Validates data/index.json and every country package against the JSON schemas.
 * Also runs cross-checks the schema cannot express (referential integrity).
 */
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'data');
const SCHEMA = join(ROOT, 'schema');

const INTRO_MAX = 280;
const FUNFACT_MAX = 160;
const FUNFACTS_RECOMMENDED_MIN = 3;
const FUNFACTS_RECOMMENDED_MAX = 5;

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function slugFromLabelKey(labelKey) {
  return labelKey.startsWith('holidays.') ? labelKey.slice('holidays.'.length) : labelKey;
}

function checkHolidayInfo(countryCode, pkg, errors, warnings) {
  const holidayInfo = pkg.i18n?.holidayInfo;
  if (!holidayInfo) return;

  const definedSlugs = new Set(pkg.definitions.map((d) => slugFromLabelKey(d.labelKey)));
  // The GLOBAL package intentionally ships articles without definitions (the
  // global holiday definitions are bundled in the app), so skip the
  // "slug not in definitions" cross-check when there are no definitions.
  const checkDefined = definedSlugs.size > 0;

  for (const [locale, articles] of Object.entries(holidayInfo)) {
    for (const [slug, article] of Object.entries(articles ?? {})) {
      const prefix = `${countryCode} holidayInfo.${locale}.${slug}`;

      if (checkDefined && !definedSlugs.has(slug)) {
        warnings.push(`${prefix}: article slug not in package definitions`);
      }

      if (typeof article.intro === 'string' && article.intro.length > INTRO_MAX) {
        warnings.push(`${prefix}.intro: ${article.intro.length} chars (recommended <= ${INTRO_MAX})`);
      }

      const facts = article.funFacts;
      if (Array.isArray(facts)) {
        if (facts.length < FUNFACTS_RECOMMENDED_MIN || facts.length > FUNFACTS_RECOMMENDED_MAX) {
          warnings.push(
            `${prefix}.funFacts: ${facts.length} items (recommended ${FUNFACTS_RECOMMENDED_MIN}-${FUNFACTS_RECOMMENDED_MAX})`,
          );
        }
        for (const [i, fact] of facts.entries()) {
          if (typeof fact === 'string' && fact.length > FUNFACT_MAX) {
            warnings.push(`${prefix}.funFacts[${i}]: ${fact.length} chars (recommended <= ${FUNFACT_MAX})`);
          }
        }
      }
    }
  }
}

function checkImages(countryCode, pkg, errors) {
  const images = pkg.images;
  if (!images) return;

  for (const [slug, refs] of Object.entries(images)) {
    const list = refs ?? [];
    for (const ref of list) {
      const abs = join(DATA, ref.path);
      // #129: Pfad-Traversal-Guard — der aufgeloeste Pfad MUSS unter data/ bleiben.
      const rel = relative(DATA, abs);
      if (rel.startsWith('..') || rel.startsWith(sep) || /(^|[/\\])\.\.([/\\]|$)/.test(ref.path)) {
        errors.push(`${countryCode} images.${slug}: unsafe path escapes data/ (${ref.path})`);
        continue;
      }
      if (!existsSync(abs)) {
        errors.push(`${countryCode} images.${slug}: missing file ${ref.path}`);
      }
    }
    if (list.length > 1 && !list.some((r) => r.primary)) {
      errors.push(`${countryCode} images.${slug}: no primary image marked`);
    }
  }
}

async function main() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv); // #133: aktiviert format:uri / date-time (sonst no-op in AJV v8)
  const indexSchema = await readJson(join(SCHEMA, 'index.schema.json'));
  const packageSchema = await readJson(join(SCHEMA, 'package.schema.json'));
  const validateIndex = ajv.compile(indexSchema);
  const validatePackage = ajv.compile(packageSchema);

  const errors = [];
  const warnings = [];

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

    checkHolidayInfo(country.code, pkg, errors, warnings);
    checkImages(country.code, pkg, errors);
  }

  // The GLOBAL package (global holiday articles + hero images, no definitions)
  // lives outside `countries` under the top-level `global` field.
  if (index.global) {
    const g = index.global;
    const pkgPath = join(DATA, g.package);
    if (!existsSync(pkgPath)) {
      errors.push(`GLOBAL: package missing at ${g.package}`);
    } else {
      const pkg = await readJson(pkgPath);
      if (!validatePackage(pkg)) {
        errors.push(`GLOBAL: ${ajv.errorsText(validatePackage.errors)}`);
      } else {
        if (pkg.countryCode !== 'GLOBAL') {
          errors.push(`GLOBAL: countryCode mismatch (${pkg.countryCode})`);
        }
        if (pkg.version !== g.version) {
          errors.push(`GLOBAL: version mismatch (index ${g.version} vs pkg ${pkg.version})`);
        }
        checkHolidayInfo('GLOBAL', pkg, errors, warnings);
        checkImages('GLOBAL', pkg, errors);
      }
    }
  }

  // #132: Bisher validierte nur, was index.json referenziert. Hier zusaetzlich
  // JEDES Paket auf dem Dateisystem (inkl. aufbewahrter aelterer v<N>-Versionen,
  // die der Client per Pfad noch erreichen koennte) gegen das Schema pruefen —
  // damit keine Schema-Verstoesse unbemerkt im Repo liegen.
  const PKG_ROOT = join(DATA, 'packages');
  if (existsSync(PKG_ROOT)) {
    const entries = await readdir(PKG_ROOT, { recursive: true });
    const pkgFiles = entries.filter((e) => e.endsWith('package.json'));
    for (const relPath of pkgFiles) {
      let pkg;
      try {
        pkg = await readJson(join(PKG_ROOT, relPath));
      } catch (e) {
        errors.push(`FS packages/${relPath}: invalid JSON (${e.message})`);
        continue;
      }
      if (!validatePackage(pkg)) {
        errors.push(`FS packages/${relPath}: ${ajv.errorsText(validatePackage.errors)}`);
      }
    }
    console.log(`Filesystem inventory: ${pkgFiles.length} package(s) schema-checked.`);
  }

  if (warnings.length > 0) {
    console.warn('Validation warnings:\n' + warnings.map((w) => `  - ${w}`).join('\n'));
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
