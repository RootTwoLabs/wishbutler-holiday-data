import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  FUN_LOCALES,
  LABEL_MAX,
  LABEL_WORD_MAX,
  allCalendarDays,
  expectedFunDays,
  loadFunDays,
  validateFunDays,
  buildFunPackage,
  funKey,
  funImageTargets,
} from './lib/funDays.mjs';

/**
 * Baut ein vollständiges, gültiges Content-Set in einem Temp-Ordner: einen Tag
 * je erwartetem Kalendertag (366 minus Blackout-Tage).
 */
async function writeFixture({ locales = FUN_LOCALES, withImages = true, blackout = null, mutate = () => {} } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'fun-days-'));
  const content = join(root, 'content', 'fun-days');
  const images = join(root, 'data', 'images');
  const days = expectedFunDays(blackout ?? {}).map((date) => ({
    date,
    slug: `day_${date.replace('-', '_')}`,
    imageQueries: [`query ${date}`],
  }));
  const byMonth = {};
  for (const d of days) (byMonth[d.date.slice(0, 2)] ??= []).push(d);
  const fixture = { byMonth, texts: {}, locales, blackout };
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
  if (fixture.blackout) {
    await writeFile(join(content, 'blackout.json'), JSON.stringify(fixture.blackout));
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

test('expectedFunDays: Blackout-Tage fallen aus der Erwartung heraus', () => {
  assert.deepEqual(expectedFunDays({}), allCalendarDays());
  const expected = expectedFunDays({ '01-27': 'Gedenktag', '12-24': 'Heiligabend' });
  assert.equal(expected.length, 364);
  assert.ok(!expected.includes('01-27'));
  assert.ok(!expected.includes('12-24'));
  assert.equal(expected[0], '01-01');
  // Unbekannte Keys ändern die Menge nicht (die Form prüft validateFunDays).
  assert.equal(expectedFunDays({ '13-99': 'quatsch' }).length, 366);
});

test('gültiges Content-Set: keine Fehler', async (t) => {
  const { root, content, images } = await writeFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const data = await loadFunDays(content);
  assert.equal(data.days.length, 366);
  const errors = validateFunDays(data, { imagesRoot: images, requireImages: true });
  assert.deepEqual(errors, []);
});

test('Thumbnail-Sidecar (01.thumb.jpg) neben 01.jpg stört requireImages nicht', async (t) => {
  const { root, content, images } = await writeFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const data = await loadFunDays(content);
  for (const d of data.days) await writeFile(join(images, 'FUN', d.slug, '01.thumb.jpg'), 't');
  assert.deepEqual(validateFunDays(data, { imagesRoot: images, requireImages: true }), []);
});

test('Blackout-Tag ohne Eintrag ist kein Fehler', async (t) => {
  const blackout = { '01-27': 'Internationaler Tag des Gedenkens an die Opfer des Holocaust' };
  const { root, content, images } = await writeFixture({ blackout });
  t.after(() => rm(root, { recursive: true, force: true }));
  const data = await loadFunDays(content);
  assert.deepEqual(data.blackout, blackout);
  assert.equal(data.days.length, 365);
  assert.deepEqual(validateFunDays(data, { imagesRoot: images, requireImages: true }), []);
});

test('Eintrag an einem Blackout-Tag wird gemeldet', async (t) => {
  const { root, content, images } = await writeFixture({
    blackout: { '01-27': 'Holocaust-Gedenktag' },
    mutate: (f) => {
      f.byMonth['01'].push({ date: '01-27', slug: 'chocolate_cake_day', imageQueries: ['cake'] });
      f.texts.de['01'].chocolate_cake_day = { label: 'x', intro: 'y', funFacts: ['a', 'b', 'c'] };
    },
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const errors = validateFunDays(await loadFunDays(content), { imagesRoot: images, requireImages: false });
  assert.ok(
    errors.some((e) => e.includes('01-27') && e.includes('day is blacked out')),
    errors.join('\n'),
  );
});

test('ungültiger Blackout-Key und leere Begründung werden gemeldet', async (t) => {
  const { root, content, images } = await writeFixture({
    blackout: { '13-40': 'kein echter Tag', '01-27': '   ' },
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const errors = validateFunDays(await loadFunDays(content), { imagesRoot: images, requireImages: false });
  assert.ok(errors.some((e) => e.includes('blackout') && e.includes('13-40')), errors.join('\n'));
  assert.ok(errors.some((e) => e.includes('blackout') && e.includes('01-27')), errors.join('\n'));
});

test('fehlender Tag und doppelter Tag werden gemeldet', async (t) => {
  const { root, content, images } = await writeFixture({
    mutate: (f) => {
      f.byMonth['03'][0].date = '03-02'; // 03-01 fehlt, 03-02 doppelt
    },
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const errors = validateFunDays(await loadFunDays(content), { imagesRoot: images, requireImages: true });
  assert.ok(errors.some((e) => e.includes('missing day 03-01')), errors.join('\n'));
  assert.ok(errors.some((e) => e.includes('duplicate day 03-02')), errors.join('\n'));
});

test('ungültiger/doppelter Slug wird gemeldet', async (t) => {
  const { root, content, images } = await writeFixture({
    mutate: (f) => {
      f.byMonth['01'][0].slug = 'Bad-Slug';
      f.byMonth['01'][2].slug = f.byMonth['01'][1].slug;
    },
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const errors = validateFunDays(await loadFunDays(content), { imagesRoot: images, requireImages: false });
  assert.ok(errors.some((e) => e.includes('invalid slug "Bad-Slug"')));
  assert.ok(errors.some((e) => e.includes('duplicate slug')));
});

test('fehlende Locale-Texte und zu lange Texte werden gemeldet', async (t) => {
  const { root, content, images } = await writeFixture({
    mutate: (f) => {
      delete f.texts.fr['05'][f.byMonth['05'][0].slug];
      f.texts.de['05'][f.byMonth['05'][1].slug].intro = 'x'.repeat(281);
      f.texts.de['05'][f.byMonth['05'][2].slug].funFacts = ['nur', 'zwei'];
      f.texts.en['05'][f.byMonth['05'][3].slug].funFacts[0] = 'y'.repeat(161);
      f.texts.en['05'][f.byMonth['05'][4].slug].label = '';
    },
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const errors = validateFunDays(await loadFunDays(content), { imagesRoot: images, requireImages: false });
  assert.ok(errors.some((e) => e.startsWith('fr/05') && e.includes('missing text')), errors.join('\n'));
  assert.ok(errors.some((e) => e.includes('intro too long')));
  assert.ok(errors.some((e) => e.includes('funFacts count')));
  assert.ok(errors.some((e) => e.includes('funFact too long')));
  assert.ok(errors.some((e) => e.includes('empty label')));
});

test('zu langes Label wird gemeldet (Hero-Überschrift bricht sonst um)', async (t) => {
  assert.equal(LABEL_MAX, 36);
  const { root, content, images } = await writeFixture({
    locales: ['de', 'en'],
    mutate: (f) => {
      f.texts.de['05'][f.byMonth['05'][0].slug].label = 'Tag des Comiclesens in der Öffentlichkeit'; // 41
      f.texts.en['05'][f.byMonth['05'][1].slug].label = 'x'.repeat(LABEL_MAX + 1);
    },
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const errors = validateFunDays(await loadFunDays(content, ['de', 'en']), {
    imagesRoot: images,
    requireImages: false,
  });
  assert.ok(
    errors.some((e) => e.startsWith('de/05') && e.includes(`label too long (41 > ${LABEL_MAX})`)),
    errors.join('\n'),
  );
  assert.ok(
    errors.some((e) => e.startsWith('en/05') && e.includes(`label too long (37 > ${LABEL_MAX})`)),
    errors.join('\n'),
  );
});

test('einzelnes zu langes Wort wird gemeldet (deutsche Komposita)', async (t) => {
  assert.equal(LABEL_WORD_MAX, 24);
  const { root, content, images } = await writeFixture({
    locales: ['de'],
    mutate: (f) => {
      // 30 Zeichen am Stück, Gesamtlänge aber unter LABEL_MAX.
      f.texts.de['06'][f.byMonth['06'][0].slug].label = 'Erdnussbutter-Marmeladen-Brot!';
    },
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const errors = validateFunDays(await loadFunDays(content, ['de']), { imagesRoot: images, requireImages: false });
  const hit = errors.find((e) => e.startsWith('de/06') && e.includes('label word too long'));
  assert.ok(hit, errors.join('\n'));
  assert.ok(hit.includes(`30 > ${LABEL_WORD_MAX}`), hit);
  assert.ok(!errors.some((e) => e.includes('label too long')), errors.join('\n'));
});

test('Grenzwerte: 36 Zeichen und 24-Zeichen-Wort sind ok', async (t) => {
  const { root, content, images } = await writeFixture({
    locales: ['de'],
    mutate: (f) => {
      f.texts.de['07'][f.byMonth['07'][0].slug].label = `${'W'.repeat(LABEL_WORD_MAX)} ${'x'.repeat(11)}`; // 36
    },
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const errors = validateFunDays(await loadFunDays(content, ['de']), { imagesRoot: images, requireImages: false });
  assert.deepEqual(errors, []);
});

test('CJK-Locales: nur Längenlimit, keine Wortprüfung', async (t) => {
  const { root, content, images } = await writeFixture({
    locales: ['ja', 'ko', 'zh-Hant'],
    mutate: (f) => {
      // 30 Zeichen ohne Leerzeichen: gültig, weil Wortprüfung hier nicht greift.
      f.texts.ja['08'][f.byMonth['08'][0].slug].label = '国'.repeat(30);
      f.texts.ko['08'][f.byMonth['08'][0].slug].label = '가'.repeat(30);
      f.texts['zh-Hant']['08'][f.byMonth['08'][0].slug].label = '日'.repeat(30);
      f.texts.ja['08'][f.byMonth['08'][1].slug].label = '国'.repeat(LABEL_MAX + 1);
    },
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const errors = validateFunDays(await loadFunDays(content, ['ja', 'ko', 'zh-Hant']), {
    imagesRoot: images,
    requireImages: false,
  });
  assert.ok(!errors.some((e) => e.includes('label word too long')), errors.join('\n'));
  assert.deepEqual(
    errors.filter((e) => e.includes('label too long')).length,
    1,
    errors.join('\n'),
  );
  assert.ok(errors.some((e) => e.startsWith('ja/08') && e.includes(`label too long (37 > ${LABEL_MAX})`)));
});

test('Locale-Einschränkung prüft nur die angegebenen Locales', async (t) => {
  const { root, content, images } = await writeFixture({ locales: ['de', 'en'] });
  t.after(() => rm(root, { recursive: true, force: true }));
  const all = validateFunDays(await loadFunDays(content), { imagesRoot: images, requireImages: false });
  assert.ok(all.some((e) => e.includes('missing text')));
  const some = validateFunDays(await loadFunDays(content), {
    imagesRoot: images,
    requireImages: false,
    locales: ['de', 'en'],
  });
  assert.deepEqual(some, []);
});

test('fehlendes Bild wird nur mit requireImages gemeldet', async (t) => {
  const { root, content, images } = await writeFixture({ withImages: false });
  t.after(() => rm(root, { recursive: true, force: true }));
  const data = await loadFunDays(content);
  assert.deepEqual(validateFunDays(data, { imagesRoot: images, requireImages: false }), []);
  const errors = validateFunDays(data, { imagesRoot: images, requireImages: true });
  assert.equal(errors.length, 366);
  assert.ok(errors[0].includes('missing image'));
});

test('Text-Slug ohne Tag wird gemeldet', async (t) => {
  const { root, content, images } = await writeFixture({
    mutate: (f) => {
      f.texts.de['07'].orphan_slug = { label: 'x', intro: 'y', funFacts: ['a', 'b', 'c'] };
    },
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const errors = validateFunDays(await loadFunDays(content), { imagesRoot: images, requireImages: false });
  assert.ok(errors.some((e) => e.includes('unknown slug "orphan_slug"')));
});

test('buildFunPackage: Bild-Credit landet als imageCredit in jedem Locale-Artikel', async (t) => {
  const { root, content } = await writeFixture({ locales: ['de', 'en', 'uk'] });
  t.after(() => rm(root, { recursive: true, force: true }));
  const data = await loadFunDays(content, ['de', 'en', 'uk']);
  const slug = data.days[0].slug;
  const imageRefs = {
    [slug]: [{ path: `images/FUN/${slug}/01.jpg`, primary: true, credit: 'Ivar Leidus', license: 'CC BY-SA 4.0' }],
  };
  const pkg = buildFunPackage(data, { version: 8, imageRefs });
  const key = `fun_${slug}`;
  assert.equal(pkg.i18n.holidayInfo.en[key].imageCredit, 'Photo: Ivar Leidus · CC BY-SA 4.0 via Wikimedia Commons');
  assert.equal(pkg.i18n.holidayInfo.de[key].imageCredit, 'Foto: Ivar Leidus · CC BY-SA 4.0 via Wikimedia Commons');
  assert.equal(pkg.i18n.holidayInfo.uk[key].imageCredit, 'Фото: Ivar Leidus · CC BY-SA 4.0 via Wikimedia Commons');
  // Tag ohne Bild: kein imageCredit-Feld
  const noImage = `fun_${data.days[1].slug}`;
  assert.equal('imageCredit' in pkg.i18n.holidayInfo.en[noImage], false);
});

test('buildFunPackage erzeugt Definitionen, i18n, Legacy-Felder und Bilder', async (t) => {
  const { root, content } = await writeFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
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
  // CC0 ohne Autor: Herkunft bleibt sichtbar, nur ohne Namen.
  assert.deepEqual(pkg.i18n.holidayInfo.en.fun_day_01_01, {
    intro: 'en intro day_01_01',
    funFacts: ['a', 'b', 'c'],
    imageCredit: 'Photo: CC0 via Wikimedia Commons',
  });
  assert.equal(pkg.i18n.holidayInfo.de.fun_day_01_01.imageCredit, 'Foto: CC0 via Wikimedia Commons');
  assert.equal(pkg.i18n.holidayInfo.ja.fun_day_01_01.imageCredit, '写真: CC0 via Wikimedia Commons');
  assert.equal(Object.keys(pkg.i18n.holidays).length, FUN_LOCALES.length);
  // Legacy für alte App-Versionen
  assert.deepEqual(pkg.funOccasions['01-01'], [{ id: 'fun_day_01_01', labelKey: 'funOccasions.day_01_01' }]);
  assert.equal(pkg.i18n.funOccasions.ja.day_01_01, 'ja day_01_01');
  assert.deepEqual(pkg.images.fun_day_01_01, imageRefs.day_01_01);
  // Sortierung nach Datum
  assert.equal(pkg.definitions.at(-1).id, 'FUN_day_12_31');
});

test('leere oder fehlende imageQueries werden gemeldet', async (t) => {
  const { root, content, images } = await writeFixture({
    mutate: (f) => {
      f.byMonth['02'][0].imageQueries = [];
    },
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const errors = validateFunDays(await loadFunDays(content), { imagesRoot: images, requireImages: false });
  assert.ok(errors.some((e) => e.includes('imageQueries must be a non-empty string array')));
});

test('Tag ohne date wird als invalid date gemeldet statt zu crashen', async (t) => {
  const { root, content, images } = await writeFixture({
    mutate: (f) => {
      delete f.byMonth['04'][0].date;
    },
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const data = await loadFunDays(content);
  assert.doesNotThrow(() => validateFunDays(data, { imagesRoot: images, requireImages: false }));
  const errors = validateFunDays(data, { imagesRoot: images, requireImages: false });
  assert.ok(errors.some((e) => e.includes('invalid date')), errors.join('\n'));
});

test('Datum aus falscher Monatsdatei wird gemeldet', async (t) => {
  const { root, content, images } = await writeFixture({
    mutate: (f) => {
      f.byMonth['06'][0].date = '07-01';
    },
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const errors = validateFunDays(await loadFunDays(content), { imagesRoot: images, requireImages: false });
  assert.ok(errors.some((e) => e.includes('date belongs to another month file')), errors.join('\n'));
});

test('geladene Locale-Auswahl steckt in data.locales und ist Default für validateFunDays', async (t) => {
  const { root, content, images } = await writeFixture({ locales: ['de', 'en'] });
  t.after(() => rm(root, { recursive: true, force: true }));
  const data = await loadFunDays(content, ['de', 'en']);
  assert.deepEqual(data.locales, ['de', 'en']);
  const errors = validateFunDays(data, { imagesRoot: images, requireImages: false });
  assert.deepEqual(errors, []);
});

test('buildFunPackage ohne imageRefs erzeugt kein images-Feld', async (t) => {
  const { root, content } = await writeFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const data = await loadFunDays(content);
  const pkg = buildFunPackage(data, { version: 5 });
  assert.ok(!('images' in pkg));
});

test('buildFunPackage: fehlender Text-Eintrag für eine Locale wird übersprungen statt zu werfen', async (t) => {
  let missingSlug;
  const { root, content } = await writeFixture({
    mutate: (f) => {
      missingSlug = f.byMonth['01'][0].slug;
      delete f.texts.de['01'][missingSlug];
    },
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const data = await loadFunDays(content);
  assert.doesNotThrow(() => buildFunPackage(data, { version: 5 }));
  const pkg = buildFunPackage(data, { version: 5 });
  assert.ok(!(funKey(missingSlug) in pkg.i18n.holidays.de));
  assert.ok(funKey(missingSlug) in pkg.i18n.holidays.en);
});

// Integrationstest gegen den echten Content (Plan Task 9, Step 1): ein Tag je
// Kalendertag außer den bewusst leeren Blackout-Tagen (seit FUN v10 keiner mehr:
// der 27.01. trägt den Tag der Stechuhr, Entscheidung Evgeny 2026-09-11), alle
// 17 Locales, ein Bild pro Tag — der Stand, den build-fun-occasions baut.
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

test('echter Content: 366 Tage ohne Blackout, 17 Locales, Bilder vollständig', async () => {
  const data = await loadFunDays(join(REPO, 'content', 'fun-days'));
  const errors = validateFunDays(data, { imagesRoot: join(REPO, 'data', 'images'), requireImages: true });
  assert.deepEqual(errors, [], errors.slice(0, 20).join('\n'));
  assert.deepEqual(data.blackout, {});
  assert.equal(data.days.length, 366);
  assert.equal(data.days.find((d) => d.date === '01-27')?.slug, 'punch_the_clock_day');
});

test('imageFile: kuratierter Commons-Titel wird als Target-Datei durchgereicht und validiert', async (t) => {
  const { content, images } = await writeFixture({
    locales: ['en'],
    withImages: false,
    mutate: (f) => {
      f.byMonth['01'][0].imageFile = 'File:Popcorn bowl.jpg';
      f.byMonth['01'][1].imageFile = 'Popcorn.jpg'; // ohne File:-Präfix → Fehler
    },
  });
  t.after(() => rm(join(content, '..', '..'), { recursive: true, force: true }));
  const data = await loadFunDays(content, ['en']);
  const errors = validateFunDays(data, { imagesRoot: images, requireImages: false, locales: ['en'] });
  assert.equal(errors.filter((e) => e.includes('imageFile must look like')).length, 1);
  const targets = await funImageTargets(content);
  assert.equal(targets[0].file, 'File:Popcorn bowl.jpg');
  assert.equal(targets[1].file, undefined);
  assert.equal(targets[2].file, undefined);
});
