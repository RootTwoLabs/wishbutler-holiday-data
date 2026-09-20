import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { migratePackage, stripTrailingParenthetical, pruneLabelCatalog } from './migrate-tentative-rules.mjs';

function precomputed(cc, slug, dates, labelSlug = slug) {
  return {
    id: `${cc}_${slug}`, countryCode: cc, kind: 'precomputed', labelKey: `holidays.${labelSlug}`,
    iconName: 'event', category: 'public', rule: { type: 'precomputed', dates },
  };
}

// Reale Tabellen aus TR v29 (Audit 2026-09-20 G-6).
const TR_FITR_2026 = { 2026: '03-20' };
const TR_FITR_TENTATIVE = { 2027: '03-09', 2028: '02-26', 2029: '02-14', 2030: '02-04' };

function trPackage() {
  return {
    countryCode: 'TR', version: 29, schemaVersion: 1,
    definitions: [
      { id: 'TR_new_years_day', countryCode: 'TR', kind: 'fixed', labelKey: 'holidays.new_year', iconName: 'event', category: 'public', rule: { type: 'fixed', month: 1, day: 1 } },
      precomputed('TR', 'eid_al_fitr_first_day', TR_FITR_2026),
      precomputed('TR', 'republic_day', { 2026: '10-29' }),
      precomputed('TR', 'eid_al_fitr_first_day_tentative_date', TR_FITR_TENTATIVE),
    ],
    namedays: { '01-01': ['Ali'] },
    i18n: {
      holidays: {
        en: { eid_al_fitr_first_day: 'Eid al-Fitr First Day', eid_al_fitr_first_day_tentative_date: 'Eid al-Fitr First Day (Tentative Date)', republic_day: 'Republic Day' },
        tr: { eid_al_fitr_first_day: 'Ramazan Bayramı 1. Gün', eid_al_fitr_first_day_tentative_date: 'Ramazan Bayramı 1. Gün (Tentative Date)', republic_day: 'Cumhuriyet Bayramı' },
        // de kennt nur die Tentative-Variante -> Fallback ohne Klammerzusatz
        de: { eid_al_fitr_first_day_tentative_date: 'Fest des Fastenbrechens – Tag 1 (vorläufiger Termin)', republic_day: 'Tag der Republik' },
      },
      holidayInfo: {
        en: { eid_al_fitr_first_day: { intro: 'canon' }, eid_al_fitr_first_day_tentative_date: { intro: 'canon' } },
      },
    },
    images: {
      eid_al_fitr_first_day: [{ path: 'images/TR/eid_al_fitr_first_day/01.jpg', primary: true, license: 'CC0' }],
      eid_al_fitr_first_day_tentative_date: [{ path: 'images/TR/eid_al_fitr_first_day/01.jpg', primary: true, license: 'CC0' }],
    },
  };
}

test('migratePackage: TR Eid al-Fitr — Jahre vereinigt, Tentative-Definition/-Keys weg, precomputed bleibt', () => {
  const { pkg: out, changes } = migratePackage('TR', trPackage());

  assert.equal(changes.length, 1);
  assert.equal(changes[0].kind, 'merged');
  assert.deepEqual(changes[0].addedYears, ['2027', '2028', '2029', '2030']);

  assert.deepEqual(out.definitions.map((d) => d.id), ['TR_new_years_day', 'TR_eid_al_fitr_first_day', 'TR_republic_day']);
  const eid = out.definitions[1];
  assert.equal(eid.kind, 'precomputed');
  assert.equal(eid.labelKey, 'holidays.eid_al_fitr_first_day');
  assert.deepEqual(eid.rule, { type: 'precomputed', dates: { 2026: '03-20', ...TR_FITR_TENTATIVE } });
  assert.deepEqual(Object.keys(eid.rule.dates), ['2026', '2027', '2028', '2029', '2030']);
  assert.deepEqual(Object.keys(eid), ['id', 'countryCode', 'kind', 'labelKey', 'iconName', 'category', 'rule']);

  assert.deepEqual(out.i18n.holidays.en, { eid_al_fitr_first_day: 'Eid al-Fitr First Day', republic_day: 'Republic Day' });
  assert.deepEqual(out.i18n.holidays.tr, { eid_al_fitr_first_day: 'Ramazan Bayramı 1. Gün', republic_day: 'Cumhuriyet Bayramı' });
  assert.deepEqual(out.i18n.holidays.de, { republic_day: 'Tag der Republik', eid_al_fitr_first_day: 'Fest des Fastenbrechens – Tag 1' });
  assert.deepEqual(out.i18n.holidayInfo, { en: { eid_al_fitr_first_day: { intro: 'canon' } } });
  assert.deepEqual(Object.keys(out.images), ['eid_al_fitr_first_day']);
  assert.deepEqual(out.namedays, { '01-01': ['Ali'] });
  assert.equal('version' in out, false);
  assert.deepEqual(Object.keys(out), ['countryCode', 'schemaVersion', 'definitions', 'namedays', 'i18n', 'images']);
});

test('migratePackage: kanonische Jahre gewinnen bei Kollision', () => {
  const pkg = {
    countryCode: 'EG', version: 29, schemaVersion: 1,
    definitions: [
      precomputed('EG', 'prophet_muhammads_birthday', { 2026: '08-25', 2027: '08-15' }),
      precomputed('EG', 'prophet_muhammads_birthday_tentative_date', { 2027: '08-14', 2028: '08-03' }),
    ],
    i18n: { holidays: { en: { prophet_muhammads_birthday: 'x', prophet_muhammads_birthday_tentative_date: 'x (Tentative Date)' } } },
  };
  const { pkg: out } = migratePackage('EG', pkg);
  assert.deepEqual(out.definitions[0].rule.dates, { 2026: '08-25', 2027: '08-15', 2028: '08-03' });
  assert.equal(out.definitions.length, 1);
});

test('migratePackage: Tentative ohne Gegenstueck wird nur umbenannt', () => {
  const pkg = {
    countryCode: 'AU', version: 32, schemaVersion: 1,
    definitions: [precomputed('AU', 'friday_before_afl_grand_final_tentative_date', { 2027: '09-24' })],
    i18n: { holidays: { en: { friday_before_afl_grand_final_tentative_date: 'Friday before AFL Grand Final (Tentative Date)' } } },
  };
  const { pkg: out, changes } = migratePackage('AU', pkg);
  assert.equal(changes[0].kind, 'renamed');
  assert.equal(out.definitions[0].id, 'AU_friday_before_afl_grand_final');
  assert.equal(out.definitions[0].labelKey, 'holidays.friday_before_afl_grand_final');
  assert.deepEqual(out.i18n.holidays.en, { friday_before_afl_grand_final: 'Friday before AFL Grand Final' });
});

test('migratePackage: Paket ohne Tentative-IDs bleibt identisch (kein Bump)', () => {
  const pkg = {
    countryCode: 'DE', version: 30, schemaVersion: 1,
    definitions: [precomputed('DE', 'day_of_repentance', { 2026: '11-18', 2027: '11-17' })],
    i18n: { holidays: { en: { day_of_repentance: 'Repentance Day' } } },
  };
  const { pkg: out, changes } = migratePackage('DE', pkg);
  assert.equal(changes.length, 0);
  assert.equal(out, pkg);
});

test('stripTrailingParenthetical: nur der Klammerzusatz am Ende faellt', () => {
  assert.equal(stripTrailingParenthetical('Opferfest – Tag 1 (vorläufiger Termin)'), 'Opferfest – Tag 1');
  assert.equal(stripTrailingParenthetical('開齋節 – 第1天 (暫定日期)'), '開齋節 – 第1天');
  assert.equal(stripTrailingParenthetical('Karneval (Rosenmontag) Fest'), 'Karneval (Rosenmontag) Fest');
  assert.equal(stripTrailingParenthetical('(nur Klammer)'), '(nur Klammer)');
});

test('pruneLabelCatalog: entfernt _tentative_date-Keys, laesst andere Dateien unangetastet', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'labels-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(join(dir, 'en.json'), JSON.stringify({ a: 'A', a_tentative_date: 'A (Tentative Date)' }, null, 2) + '\n');
  await writeFile(join(dir, 'de.json'), JSON.stringify({ a: 'A' }, null, 2) + '\n');

  const dry = await pruneLabelCatalog(dir, { dryRun: true });
  assert.deepEqual(dry, { 'en.json': ['a_tentative_date'] });
  assert.equal(JSON.parse(await readFile(join(dir, 'en.json'), 'utf8')).a_tentative_date, 'A (Tentative Date)');

  const result = await pruneLabelCatalog(dir);
  assert.deepEqual(result, { 'en.json': ['a_tentative_date'] });
  assert.equal(await readFile(join(dir, 'en.json'), 'utf8'), '{\n  "a": "A"\n}\n');
  assert.equal(await readFile(join(dir, 'de.json'), 'utf8'), '{\n  "a": "A"\n}\n');
});
