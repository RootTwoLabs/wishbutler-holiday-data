import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyRegionalSplits } from './migrate-regional-splits.mjs';
import { NAGER_REGIONAL_SPLITS } from './config.mjs';
import { CONTENT_LOCALES } from '../content/key-map.mjs';
import { canonicalArticleSlug } from '../content/key-map.mjs';
import { loadLabelCatalog } from './lib/labelCatalog.mjs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const def = (id, slug, rule, extra = {}) => ({
  id,
  countryCode: 'GB',
  kind: rule.type,
  labelKey: `holidays.${slug}`,
  iconName: 'event',
  category: 'public',
  ...extra,
  rule,
});

const LAST_MONDAY_AUG = { type: 'nth_weekday', month: 8, nth: 5, weekday: 1, last: true };

function gbPackage() {
  return {
    countryCode: 'GB',
    version: 30,
    schemaVersion: 1,
    definitions: [
      def('GB_battle_of_the_boyne', 'battle_of_the_boyne', { type: 'fixed', month: 7, day: 12 }, { regions: ['GB-NIR'] }),
      def('GB_summer_bank_holiday', 'summer_bank_holiday', LAST_MONDAY_AUG),
      def('GB_saint_andrews_day', 'saint_andrews_day', { type: 'fixed', month: 11, day: 30 }, { regions: ['GB-SCT'] }),
    ],
    i18n: {
      holidays: {
        en: { battle_of_the_boyne: 'Battle of the Boyne', summer_bank_holiday: 'Summer Bank Holiday', saint_andrews_day: "Saint Andrew's Day" },
        de: { summer_bank_holiday: 'Sommerfeiertag' },
      },
    },
  };
}

test('applyRegionalSplits: GB Summer Bank Holiday -> alte ID mit ENG/NIR/WLS, neue schottische ID davor', () => {
  const input = gbPackage();
  const { pkg, changes } = applyRegionalSplits('GB', input);
  assert.equal(changes.length, 1);
  assert.deepEqual(pkg.definitions.map((d) => d.id), [
    'GB_battle_of_the_boyne',
    'GB_summer_bank_holiday_scotland',
    'GB_summer_bank_holiday',
    'GB_saint_andrews_day',
  ]);
  assert.deepEqual(pkg.definitions[1], {
    id: 'GB_summer_bank_holiday_scotland',
    countryCode: 'GB',
    kind: 'nth_weekday',
    labelKey: 'holidays.summer_bank_holiday_scotland',
    iconName: 'event',
    category: 'public',
    regions: ['GB-SCT'],
    rule: { type: 'nth_weekday', month: 8, nth: 1, weekday: 1 },
  });
  // Bestehende ID: gleiche Regel, `regions` vor `rule` (Feldreihenfolge wie holidayDefinition).
  assert.deepEqual(pkg.definitions[2], def('GB_summer_bank_holiday', 'summer_bank_holiday', LAST_MONDAY_AUG, { regions: ['GB-ENG', 'GB-NIR', 'GB-WLS'] }));
  assert.deepEqual(Object.keys(pkg.definitions[2]), ['id', 'countryCode', 'kind', 'labelKey', 'iconName', 'category', 'regions', 'rule']);
  // Englisches Label in Definitionsreihenfolge; andere Sprachen fuellt der Katalog-Merge.
  assert.deepEqual(Object.keys(pkg.i18n.holidays.en), ['battle_of_the_boyne', 'summer_bank_holiday_scotland', 'summer_bank_holiday', 'saint_andrews_day']);
  assert.equal(pkg.i18n.holidays.en.summer_bank_holiday_scotland, 'Summer Bank Holiday (Scotland)');
  // Eingabe bleibt unangetastet.
  assert.deepEqual(input, gbPackage());
});

test('applyRegionalSplits: idempotent und ohne Hauptanlass ein No-op', () => {
  const once = applyRegionalSplits('GB', gbPackage()).pkg;
  const twice = applyRegionalSplits('GB', once);
  assert.equal(twice.pkg, once);
  assert.deepEqual(twice.changes, []);

  const without = gbPackage();
  without.definitions = without.definitions.filter((d) => d.id !== 'GB_summer_bank_holiday');
  const res = applyRegionalSplits('GB', without);
  assert.equal(res.pkg, without);
  assert.equal(res.changes.length, 1);

  // Land ohne Konfiguration
  const de = { countryCode: 'DE', definitions: [], i18n: { holidays: {} } };
  assert.equal(applyRegionalSplits('DE', de).pkg, de);
});

test('NAGER_REGIONAL_SPLITS: jede Split-ID hat Labels in allen 17 Sprachen und einen Artikel-Alias', async () => {
  const catalog = await loadLabelCatalog(join(ROOT, 'content', 'holiday-labels'));
  for (const [cc, byName] of Object.entries(NAGER_REGIONAL_SPLITS)) {
    for (const [baseName, splits] of Object.entries(byName)) {
      for (const split of splits) {
        const slug = split.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        const baseSlug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        for (const locale of CONTENT_LOCALES) {
          assert.ok(catalog[locale]?.[slug]?.trim(), `${cc} ${slug}: Label fehlt in ${locale}`);
          // Wiederverwendung: Label des Hauptanlasses + Regionszusatz, keine freie Neuuebersetzung.
          assert.ok(catalog[locale][slug].startsWith(catalog[locale][baseSlug]), `${cc} ${slug} (${locale}) baut nicht auf ${baseSlug} auf`);
        }
        assert.equal(canonicalArticleSlug(slug), baseSlug);
        assert.ok(split.counties.every((c) => c.startsWith(`${cc}-`)));
      }
    }
  }
});
