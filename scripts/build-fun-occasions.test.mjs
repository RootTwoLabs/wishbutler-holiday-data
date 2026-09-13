import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { FUN_LOCALES, expectedFunDays, loadFunDays, buildFunPackage } from './lib/funDays.mjs';
import { latestVersion, contentKey, decideVersion } from './build-fun-occasions.mjs';
import { checkFunDefinitions } from './validate.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Blackout-Tage des echten Repos: `checkFunDefinitions` leitet seine Erwartung
 * daraus ab, also muss das Fixture dieselben Tage auslassen.
 */
const REPO_BLACKOUT = JSON.parse(
  readFileSync(join(__dirname, '..', 'content', 'fun-days', 'blackout.json'), 'utf8'),
);

/** Baut ein vollständiges, gültiges Content-Set (alle erwarteten Tage) in einem Temp-Ordner (wie fun-days.test.mjs). */
async function writeFixture({ locales = FUN_LOCALES, mutate = () => {} } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'fun-build-'));
  const content = join(root, 'content', 'fun-days');
  const days = expectedFunDays(REPO_BLACKOUT).map((date) => ({
    date,
    slug: `day_${date.replace('-', '_')}`,
    imageQueries: [`query ${date}`],
  }));
  const byMonth = {};
  for (const d of days) (byMonth[d.date.slice(0, 2)] ??= []).push(d);
  const fixture = { byMonth, texts: {}, locales };
  for (const loc of locales) {
    fixture.texts[loc] = {};
    for (const [mm, list] of Object.entries(byMonth)) {
      fixture.texts[loc][mm] = {};
      for (const d of list) {
        fixture.texts[loc][mm][d.slug] = {
          label: `${loc} ${d.slug}`,
          intro: `${loc} intro ${d.slug}`,
          funFacts: ['a', 'b', 'c'],
        };
      }
    }
  }
  mutate(fixture);
  await mkdir(join(content, 'days'), { recursive: true });
  for (const [mm, list] of Object.entries(fixture.byMonth)) {
    await writeFile(join(content, 'days', `${mm}.json`), JSON.stringify({ days: list }));
  }
  for (const loc of Object.keys(fixture.texts)) {
    await mkdir(join(content, loc), { recursive: true });
    for (const [mm, map] of Object.entries(fixture.texts[loc])) {
      await writeFile(join(content, loc, `${mm}.json`), JSON.stringify(map));
    }
  }
  return { root, content, days };
}

/** Baut ein vollständiges v5-Paket aus einem frischen Fixture-Set (+ CC0-Bildern). */
async function buildFixturePackage(overrides = {}) {
  const { root, content, days } = await writeFixture(overrides);
  const data = await loadFunDays(content);
  const imageRefs = Object.fromEntries(
    days.map((d) => [d.slug, [{ path: `images/FUN/${d.slug}/01.jpg`, primary: true, license: 'CC0' }]]),
  );
  const pkg = buildFunPackage(data, { version: 5, imageRefs });
  return { root, pkg, days };
}

// --- decideVersion -----------------------------------------------------

test('decideVersion: identischer Content -> gleiche Version, kein Bump', () => {
  const candidate = { countryCode: 'FUN', foo: 'bar' };
  const prevPkg = { version: 3, countryCode: 'FUN', foo: 'bar' };
  const result = decideVersion({ prev: 3, forced: null, prevPkg, candidate });
  assert.deepEqual(result, { version: 3, bumped: false });
});

test('decideVersion: geänderter Inhalt -> prev + 1', () => {
  const candidate = { countryCode: 'FUN', foo: 'baz' };
  const prevPkg = { version: 3, countryCode: 'FUN', foo: 'bar' };
  const result = decideVersion({ prev: 3, forced: null, prevPkg, candidate });
  assert.deepEqual(result, { version: 4, bumped: true });
});

test('decideVersion: geänderte images/Credits -> prev + 1', () => {
  const candidate = { countryCode: 'FUN', images: { fun_x: [{ path: 'a', credit: 'New Credit' }] } };
  const prevPkg = { version: 7, countryCode: 'FUN', images: { fun_x: [{ path: 'a', credit: 'Old Credit' }] } };
  const result = decideVersion({ prev: 7, forced: null, prevPkg, candidate });
  assert.deepEqual(result, { version: 8, bumped: true });
});

test('decideVersion: forced überschreibt den Bump-Check', () => {
  const candidate = { countryCode: 'FUN', foo: 'bar' };
  const prevPkg = { version: 3, countryCode: 'FUN', foo: 'bar' };
  const result = decideVersion({ prev: 3, forced: 9, prevPkg, candidate });
  assert.deepEqual(result, { version: 9, bumped: true });
  // forced gleich prev: kein Bump, aber trotzdem kein Inhaltsvergleich nötig
  assert.deepEqual(decideVersion({ prev: 3, forced: 3, prevPkg, candidate }), { version: 3, bumped: false });
});

test('decideVersion: kein Vorgänger -> Version 1', () => {
  const candidate = { countryCode: 'FUN' };
  assert.deepEqual(decideVersion({ prev: null, forced: null, prevPkg: null, candidate }), {
    version: 1,
    bumped: true,
  });
});

// --- latestVersion / contentKey ----------------------------------------

test('latestVersion: liest höchste v<N> aus dem Verzeichnis, null wenn keins existiert', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'fun-latest-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.equal(await latestVersion(join(root, 'missing')), null);
  await mkdir(join(root, 'v2'), { recursive: true });
  await mkdir(join(root, 'v10'), { recursive: true });
  await mkdir(join(root, 'not-a-version'), { recursive: true });
  assert.equal(await latestVersion(root), 10);
});

test('contentKey: ignoriert nur `version`', () => {
  const a = { version: 1, countryCode: 'FUN', definitions: [] };
  const b = { version: 2, countryCode: 'FUN', definitions: [] };
  assert.equal(contentKey(a), contentKey(b));
  const c = { version: 2, countryCode: 'FUN', definitions: [1] };
  assert.notEqual(contentKey(a), contentKey(c));
});

// --- checkFunDefinitions -------------------------------------------------

test('checkFunDefinitions: gültiges Paket (alle erwarteten Tage) hat keine Fehler', async (t) => {
  const { root, pkg } = await buildFixturePackage();
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.equal(pkg.definitions.length, 366 - Object.keys(REPO_BLACKOUT).length);
  const errors = [];
  checkFunDefinitions(pkg, errors);
  assert.deepEqual(errors, []);
});

// Nur sinnvoll, solange das Repo mindestens einen Blackout-Tag pflegt —
// `checkFunDefinitions` liest die echte blackout.json, nicht das Fixture.
const hasRepoBlackout = Object.keys(REPO_BLACKOUT).length > 0;
test('checkFunDefinitions: Definition an einem Blackout-Tag wird gemeldet', { skip: !hasRepoBlackout && 'blackout.json ist leer' }, async (t) => {
  const { root, pkg } = await buildFixturePackage();
  t.after(() => rm(root, { recursive: true, force: true }));
  const [blackoutDay] = Object.keys(REPO_BLACKOUT);
  const [mm, dd] = blackoutDay.split('-').map(Number);
  // Einen bestehenden Tag auf den Blackout-Tag umbiegen (Anzahl bleibt korrekt).
  pkg.definitions[0].rule = { type: 'fixed', month: mm, day: dd };
  const errors = [];
  checkFunDefinitions(pkg, errors);
  assert.ok(
    errors.some((e) => e.includes('day is blacked out') && e.includes(blackoutDay)),
    errors.join('\n'),
  );
});

test('checkFunDefinitions: fehlendes fr-Label wird gemeldet', async (t) => {
  const { root, pkg, days } = await buildFixturePackage({
    mutate: (f) => {
      delete f.texts.fr['01'][f.byMonth['01'][0].slug];
    },
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const errors = [];
  checkFunDefinitions(pkg, errors);
  const slug = days[0].slug;
  assert.ok(
    errors.some((e) => e.includes(`FUN_${slug}`) && e.includes('missing "fr" label')),
    errors.join('\n'),
  );
});

test('checkFunDefinitions: ungültiger Kalendertag (30. Februar) wird gemeldet', async (t) => {
  const { root, pkg } = await buildFixturePackage();
  t.after(() => rm(root, { recursive: true, force: true }));
  const feb29 = pkg.definitions.find((d) => d.rule.month === 2 && d.rule.day === 29);
  feb29.rule.day = 30;
  const errors = [];
  checkFunDefinitions(pkg, errors);
  assert.ok(
    errors.some((e) => e.includes(feb29.id) && e.includes('kein gültiger Kalendertag (02-30)')),
    errors.join('\n'),
  );
});

test('checkFunDefinitions: Bild ohne freie Lizenz ohne Credit wird gemeldet', async (t) => {
  const { root, pkg } = await buildFixturePackage();
  t.after(() => rm(root, { recursive: true, force: true }));
  const firstKey = Object.keys(pkg.images)[0];
  pkg.images[firstKey][0].license = 'CC BY 2.0';
  delete pkg.images[firstKey][0].credit;
  const errors = [];
  checkFunDefinitions(pkg, errors);
  assert.ok(
    errors.some((e) => e.includes('image credit missing for')),
    errors.join('\n'),
  );
});

test('checkFunDefinitions: v4 ohne Definitionen bleibt ungeprüft (Guard)', () => {
  const pkg = { countryCode: 'FUN', version: 4, schemaVersion: 1, definitions: [], funOccasions: {}, i18n: {} };
  const errors = [];
  checkFunDefinitions(pkg, errors);
  assert.deepEqual(errors, []);
});

// --- FUN_VERSION-CLI-Fehlerfall -------------------------------------------

test('build-fun-occasions.mjs: FUN_VERSION=abc beendet mit Exit-Code 2', () => {
  const script = join(__dirname, 'build-fun-occasions.mjs');
  const result = spawnSync(process.execPath, [script], {
    env: { ...process.env, FUN_VERSION: 'abc' },
    encoding: 'utf8',
  });
  assert.equal(result.status, 2);
  assert.ok(result.stderr.includes('FUN_VERSION'), result.stderr);
});
