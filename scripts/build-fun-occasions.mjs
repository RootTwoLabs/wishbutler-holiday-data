#!/usr/bin/env node
/**
 * Builds the FUN package (quirky / fun occasions, e.g. "Tag des Weines") from the
 * curated source in content/fun-occasions.mjs into
 * data/packages/FUN/v<N>/package.json.
 *
 * The FUN package mirrors the GLOBAL package's shape: it carries no holiday
 * `definitions` (it is not a country and never appears in the country picker) and
 * is served as a single global, multilingual calendar keyed by "MM-DD".
 *
 * Enforced here (fail-fast so bad seed data never ships):
 *  - max 3 occasions per calendar day
 *  - unique, stable slugs
 *  - every occasion has at least `de` + `en` labels
 */
import { mkdir, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PACKAGES = join(ROOT, 'data', 'packages');
const SOURCE = join(ROOT, 'content', 'fun-occasions.json');

const REQUIRED_LOCALES = ['de', 'en'];
const MAX_PER_DAY = 3;
const DATE_RE = /^[0-1][0-9]-[0-3][0-9]$/;

function assert(cond, msg) {
  if (!cond) {
    console.error(`build-fun-occasions: ${msg}`);
    process.exit(1);
  }
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
  // Rewrite the current version in place for the seed set; a later harvest can bump.
  return max === 0 ? 1 : max;
}

function build(occasions) {
  const byDate = {};
  const i18n = {};
  const seenSlugs = new Set();

  for (const occ of occasions) {
    assert(/^[a-z0-9_]+$/.test(occ.slug), `invalid slug "${occ.slug}"`);
    assert(!seenSlugs.has(occ.slug), `duplicate slug "${occ.slug}"`);
    seenSlugs.add(occ.slug);
    assert(DATE_RE.test(occ.date), `invalid date "${occ.date}" for "${occ.slug}"`);
    for (const loc of REQUIRED_LOCALES) {
      assert(occ.labels?.[loc], `missing "${loc}" label for "${occ.slug}"`);
    }

    (byDate[occ.date] ??= []).push({
      id: `fun_${occ.slug}`,
      labelKey: `funOccasions.${occ.slug}`,
      // `emoji` is optional (harvested data has none; the app renders an IconTile,
      // never the emoji). Kept for hand-authored entries / non-app surfaces.
      ...(typeof occ.emoji === 'string' && occ.emoji.length > 0 ? { emoji: occ.emoji } : {}),
      ...(occ.tags?.length ? { tags: occ.tags } : {}),
    });

    for (const [loc, label] of Object.entries(occ.labels)) {
      (i18n[loc] ??= {})[occ.slug] = label;
    }
  }

  for (const [date, list] of Object.entries(byDate)) {
    assert(list.length <= MAX_PER_DAY, `${date} has ${list.length} occasions (max ${MAX_PER_DAY})`);
  }

  // Sort keys for stable, diff-friendly output.
  const funOccasions = {};
  for (const date of Object.keys(byDate).sort()) funOccasions[date] = byDate[date];

  const i18nSorted = {};
  for (const loc of Object.keys(i18n).sort()) {
    i18nSorted[loc] = {};
    for (const slug of Object.keys(i18n[loc]).sort()) i18nSorted[loc][slug] = i18n[loc][slug];
  }

  return { funOccasions, i18n: { funOccasions: i18nSorted }, count: seenSlugs.size };
}

async function main() {
  assert(existsSync(SOURCE), `missing ${SOURCE} — run "npm run harvest:fun-occasions" first`);
  const source = JSON.parse(await readFile(SOURCE, 'utf8'));
  assert(Array.isArray(source.occasions), 'content/fun-occasions.json: "occasions" is not an array');

  const { funOccasions, i18n, count } = build(source.occasions);
  const version = await currentVersion();

  const pkg = {
    countryCode: 'FUN',
    version,
    schemaVersion: 1,
    definitions: [],
    funOccasions,
    i18n,
  };

  const outDir = join(PACKAGES, 'FUN', `v${version}`);
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log(
    `FUN v${version} written: ${count} occasions on ${Object.keys(funOccasions).length} days, locales [${Object.keys(i18n.funOccasions).join(', ')}].`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
