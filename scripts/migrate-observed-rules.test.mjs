import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migratePackage, labelSlugFor } from './migrate-observed-rules.mjs';

// Echte Tabellen aus dem Tag v13 (US/v29, GB/v28), siehe Audit 2026-09-20 G-1.
const US_CHRISTMAS = {
  2026: '12-25', 2027: '12-24', 2028: '12-25', 2029: '12-25', 2030: '12-25',
  2031: '12-25', 2032: '12-24', 2033: '12-26', 2034: '12-25', 2035: '12-25',
};
const US_VETERANS = {
  2026: '11-11', 2027: '11-11', 2028: '11-10', 2029: '11-12', 2030: '11-11',
  2031: '11-11', 2032: '11-11', 2033: '11-11', 2034: '11-10', 2035: '11-12',
};
const NL_KINGS_DAY = {
  2026: '04-27', 2027: '04-27', 2028: '04-27', 2029: '04-27', 2030: '04-27',
  2031: '04-26', 2032: '04-27', 2033: '04-27', 2034: '04-27', 2035: '04-27',
};

function precomputed(cc, slug, labelSlug, dates) {
  return {
    id: `${cc}_${slug}`, countryCode: cc, kind: 'precomputed', labelKey: `holidays.${labelSlug}`,
    iconName: 'event', category: 'public', rule: { type: 'precomputed', dates },
  };
}

test('labelSlugFor spiegelt fetch-holidays: GLOBAL-Merge nur bei Alias + gleicher Regel', () => {
  assert.deepEqual(labelSlugFor('US', 'christmas_day', { type: 'fixed', month: 12, day: 25 }), { labelSlug: 'christmas', isGlobal: true });
  assert.deepEqual(labelSlugFor('GB', 'st_stephens_day', { type: 'fixed', month: 12, day: 26 }), { labelSlug: 'boxing_day', isGlobal: true });
  assert.deepEqual(labelSlugFor('GH', 'boxing_day', { type: 'fixed', month: 12, day: 26 }), { labelSlug: 'boxing_day', isGlobal: true });
  // Gleicher Name wie ein GLOBAL-Feiertag, andere Regel -> landesspezifischer Key.
  assert.deepEqual(labelSlugFor('NZ', 'labour_day', { type: 'nth_weekday', month: 10, nth: 4, weekday: 1 }), { labelSlug: 'labour_day_nz', isGlobal: false });
  assert.deepEqual(labelSlugFor('US', 'veterans_day', { type: 'fixed', month: 11, day: 11 }), { labelSlug: 'veterans_day', isGlobal: false });
});

test('migratePackage: US christmas_day -> fixed 12-25 + GLOBAL-Merge, veterans_day -> fixed ohne Merge', () => {
  const pkg = {
    countryCode: 'US', version: 29, schemaVersion: 1,
    definitions: [
      precomputed('US', 'christmas_day', 'christmas_day', US_CHRISTMAS),
      precomputed('US', 'veterans_day', 'veterans_day', US_VETERANS),
      { id: 'US_thanksgiving_day', countryCode: 'US', kind: 'nth_weekday', labelKey: 'holidays.thanksgiving_day', iconName: 'event', category: 'public', rule: { type: 'nth_weekday', month: 11, nth: 4, weekday: 4 } },
    ],
    i18n: {
      holidays: {
        en: { christmas_day: 'Christmas Day', veterans_day: 'Veterans Day', thanksgiving_day: 'Thanksgiving Day' },
        de: { christmas_day: 'Weihnachten', veterans_day: 'Veteranentag', thanksgiving_day: 'Thanksgiving' },
      },
      holidayInfo: { en: { christmas_day: { intro: 'x' } } },
    },
    images: { christmas_day: [{ path: 'images/christmas/01.jpg', license: 'CC0' }] },
  };
  const { pkg: out, changes } = migratePackage('US', pkg);

  assert.equal(changes.length, 2);
  const [christmas, veterans, thanksgiving] = out.definitions;
  assert.deepEqual(christmas.rule, { type: 'fixed', month: 12, day: 25 });
  assert.equal(christmas.kind, 'fixed');
  assert.equal(christmas.labelKey, 'holidays.christmas');
  assert.deepEqual(Object.keys(christmas), ['id', 'countryCode', 'kind', 'labelKey', 'iconName', 'category', 'rule']);
  assert.deepEqual(veterans.rule, { type: 'fixed', month: 11, day: 11 });
  assert.equal(veterans.labelKey, 'holidays.veterans_day');
  assert.equal(thanksgiving.kind, 'nth_weekday');

  // Gemergter Slug verliert seine Paket-Labels (App nutzt GLOBAL-Uebersetzungen); andere bleiben.
  assert.deepEqual(out.i18n.holidays.en, { veterans_day: 'Veterans Day', thanksgiving_day: 'Thanksgiving Day' });
  assert.deepEqual(out.i18n.holidays.de, { veterans_day: 'Veteranentag', thanksgiving_day: 'Thanksgiving' });
  // holidayInfo/images/namedays werden 1:1 uebernommen — build-articles' mergeContent loest sie danach neu auf.
  assert.deepEqual(out.i18n.holidayInfo, pkg.i18n.holidayInfo);
  assert.deepEqual(out.images, pkg.images);
  assert.equal('version' in out, false);
  assert.deepEqual(Object.keys(out), ['countryCode', 'schemaVersion', 'definitions', 'i18n', 'images']);
});

test('migratePackage: NL kings_day (So -> Sa = echter Datumswechsel) bleibt precomputed, Paket unveraendert', () => {
  const pkg = {
    countryCode: 'NL', version: 25, schemaVersion: 1,
    definitions: [precomputed('NL', 'kings_day', 'kings_day', NL_KINGS_DAY)],
    i18n: { holidays: { en: { kings_day: "King's Day" } } },
  };
  const { pkg: out, changes } = migratePackage('NL', pkg);
  assert.equal(changes.length, 0);
  assert.equal(out, pkg);
});
