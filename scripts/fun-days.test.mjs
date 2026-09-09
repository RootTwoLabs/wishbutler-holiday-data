import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  FUN_LOCALES,
  allCalendarDays,
  loadFunDays,
  validateFunDays,
  buildFunPackage,
} from './lib/funDays.mjs';

/** Baut ein vollständiges, gültiges Content-Set (366 Tage) in einem Temp-Ordner. */
async function writeFixture({ locales = FUN_LOCALES, withImages = true, mutate = () => {} } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'fun-days-'));
  const content = join(root, 'content', 'fun-days');
  const images = join(root, 'data', 'images');
  const days = allCalendarDays().map((date) => ({
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
  if (withImages) {
    for (const d of days) {
      await mkdir(join(images, 'FUN', d.slug), { recursive: true });
      await writeFile(join(images, 'FUN', d.slug, '01.jpg'), 'x');
    }
  }
  return { root, content, images };
}

test('allCalendarDays liefert 366 eindeutige MM-DD inkl. 02-29', () => {
  const days = allCalendarDays();
  assert.equal(days.length, 366);
  assert.equal(new Set(days).size, 366);
  assert.ok(days.includes('02-29'));
  assert.equal(days[0], '01-01');
  assert.equal(days.at(-1), '12-31');
});

test('gültiges Content-Set: keine Fehler', async () => {
  const { content, images } = await writeFixture();
  const data = await loadFunDays(content);
  assert.equal(data.days.length, 366);
  const errors = validateFunDays(data, { imagesRoot: images, requireImages: true });
  assert.deepEqual(errors, []);
});

test('fehlender Tag und doppelter Tag werden gemeldet', async () => {
  const { content, images } = await writeFixture({
    mutate: (f) => {
      f.byMonth['03'][0].date = '03-02'; // 03-01 fehlt, 03-02 doppelt
    },
  });
  const errors = validateFunDays(await loadFunDays(content), { imagesRoot: images, requireImages: true });
  assert.ok(errors.some((e) => e.includes('missing day 03-01')), errors.join('\n'));
  assert.ok(errors.some((e) => e.includes('duplicate day 03-02')), errors.join('\n'));
});

test('ungültiger/doppelter Slug wird gemeldet', async () => {
  const { content, images } = await writeFixture({
    mutate: (f) => {
      f.byMonth['01'][0].slug = 'Bad-Slug';
      f.byMonth['01'][2].slug = f.byMonth['01'][1].slug;
    },
  });
  const errors = validateFunDays(await loadFunDays(content), { imagesRoot: images, requireImages: false });
  assert.ok(errors.some((e) => e.includes('invalid slug "Bad-Slug"')));
  assert.ok(errors.some((e) => e.includes('duplicate slug')));
});

test('fehlende Locale-Texte und zu lange Texte werden gemeldet', async () => {
  const { content, images } = await writeFixture({
    mutate: (f) => {
      delete f.texts.fr['05'][f.byMonth['05'][0].slug];
      f.texts.de['05'][f.byMonth['05'][1].slug].intro = 'x'.repeat(281);
      f.texts.de['05'][f.byMonth['05'][2].slug].funFacts = ['nur', 'zwei'];
      f.texts.en['05'][f.byMonth['05'][3].slug].funFacts[0] = 'y'.repeat(161);
      f.texts.en['05'][f.byMonth['05'][4].slug].label = '';
    },
  });
  const errors = validateFunDays(await loadFunDays(content), { imagesRoot: images, requireImages: false });
  assert.ok(errors.some((e) => e.startsWith('fr/05') && e.includes('missing text')), errors.join('\n'));
  assert.ok(errors.some((e) => e.includes('intro too long')));
  assert.ok(errors.some((e) => e.includes('funFacts count')));
  assert.ok(errors.some((e) => e.includes('funFact too long')));
  assert.ok(errors.some((e) => e.includes('empty label')));
});

test('Locale-Einschränkung prüft nur die angegebenen Locales', async () => {
  const { content, images } = await writeFixture({ locales: ['de', 'en'] });
  const all = validateFunDays(await loadFunDays(content), { imagesRoot: images, requireImages: false });
  assert.ok(all.some((e) => e.includes('missing text')));
  const some = validateFunDays(await loadFunDays(content), {
    imagesRoot: images,
    requireImages: false,
    locales: ['de', 'en'],
  });
  assert.deepEqual(some, []);
});

test('fehlendes Bild wird nur mit requireImages gemeldet', async () => {
  const { content, images } = await writeFixture({ withImages: false });
  const data = await loadFunDays(content);
  assert.deepEqual(validateFunDays(data, { imagesRoot: images, requireImages: false }), []);
  const errors = validateFunDays(data, { imagesRoot: images, requireImages: true });
  assert.equal(errors.length, 366);
  assert.ok(errors[0].includes('missing image'));
});

test('Text-Slug ohne Tag wird gemeldet', async () => {
  const { content, images } = await writeFixture({
    mutate: (f) => {
      f.texts.de['07'].orphan_slug = { label: 'x', intro: 'y', funFacts: ['a', 'b', 'c'] };
    },
  });
  const errors = validateFunDays(await loadFunDays(content), { imagesRoot: images, requireImages: false });
  assert.ok(errors.some((e) => e.includes('unknown slug "orphan_slug"')));
});

test('buildFunPackage erzeugt Definitionen, i18n, Legacy-Felder und Bilder', async () => {
  const { content } = await writeFixture();
  const data = await loadFunDays(content);
  const imageRefs = Object.fromEntries(
    data.days.map((d) => [d.slug, [{ path: `images/FUN/${d.slug}/01.jpg`, primary: true, license: 'CC0' }]]),
  );
  const pkg = buildFunPackage(data, { version: 5, imageRefs });

  assert.equal(pkg.countryCode, 'FUN');
  assert.equal(pkg.version, 5);
  assert.equal(pkg.schemaVersion, 1);
  assert.equal(pkg.definitions.length, 366);
  const first = pkg.definitions[0];
  assert.deepEqual(first, {
    id: 'FUN_day_01_01',
    countryCode: 'FUN',
    kind: 'fixed',
    labelKey: 'holidays.fun_day_01_01',
    iconName: 'party-popper',
    category: 'observance',
    rule: { type: 'fixed', month: 1, day: 1 },
  });
  assert.equal(pkg.i18n.holidays.de.fun_day_01_01, 'de day_01_01');
  assert.deepEqual(pkg.i18n.holidayInfo.en.fun_day_01_01, { intro: 'en intro day_01_01', funFacts: ['a', 'b', 'c'] });
  assert.equal(Object.keys(pkg.i18n.holidays).length, FUN_LOCALES.length);
  // Legacy für alte App-Versionen
  assert.deepEqual(pkg.funOccasions['01-01'], [{ id: 'fun_day_01_01', labelKey: 'funOccasions.day_01_01' }]);
  assert.equal(pkg.i18n.funOccasions.ja.day_01_01, 'ja day_01_01');
  assert.deepEqual(pkg.images.fun_day_01_01, imageRefs.day_01_01);
  // Sortierung nach Datum
  assert.equal(pkg.definitions.at(-1).id, 'FUN_day_12_31');
});
