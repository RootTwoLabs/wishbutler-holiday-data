import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newScope, collectScope, resolveScope, categoryFromTypes, coversFullRegionSet, REGION_CODE_RE } from './nagerScope.mjs';
import { NAGER_FULL_REGION_SETS } from '../config.mjs';
import { holidayDefinition } from './packageWriter.mjs';

function scopeOf(rows) {
  const scope = newScope();
  for (const r of rows) collectScope(scope, r);
  return scope;
}

test('G-5: landesweiter Feiertag -> kein regions, Public -> public', () => {
  const s = scopeOf([{ global: true, counties: null, types: ['Public'] }]);
  assert.deepEqual(resolveScope(s), { category: 'public', regions: undefined });
});

test('G-5: rein regionaler Feiertag -> regions = Nager counties, sortiert + dedupliziert', () => {
  const s = scopeOf([
    { global: false, counties: ['DE-TH'], types: ['Public'] },
    { global: false, counties: ['DE-TH'], types: ['Public'] },
  ]);
  assert.deepEqual(resolveScope(s), { category: 'public', regions: ['DE-TH'] });

  const union = scopeOf([
    { global: false, counties: ['DE-MV', 'DE-BE'], types: ['Public'] },
    { global: false, counties: ['DE-BE'], types: ['Public'] },
  ]);
  assert.deepEqual(resolveScope(union).regions, ['DE-BE', 'DE-MV']);
});

test('G-5: ein landesweites Jahr macht den Anlass landesweit (kein regions)', () => {
  const s = scopeOf([
    { global: false, counties: ['CH-GL'], types: ['Public'] },
    { global: true, counties: null, types: ['Public'] },
    { global: false, counties: ['CH-GL'], types: ['Public'] },
  ]);
  assert.equal(resolveScope(s).regions, undefined);
});

test('G-5: global:false ohne counties zaehlt als landesweit', () => {
  const s = scopeOf([{ global: false, counties: null, types: ['Public'] }]);
  assert.equal(resolveScope(s).regions, undefined);
  const empty = scopeOf([{ global: false, counties: [], types: ['Public'] }]);
  assert.equal(resolveScope(empty).regions, undefined);
});

test('G-5: category aus types — Public gewinnt ueber die Jahre, sonst observance', () => {
  assert.equal(categoryFromTypes(new Set(['Public'])), 'public');
  assert.equal(categoryFromTypes(new Set(['Bank', 'School'])), 'observance');
  assert.equal(categoryFromTypes(new Set(['Observance'])), 'observance');
  assert.equal(categoryFromTypes(new Set()), 'observance');
  const mixed = scopeOf([
    { global: true, types: ['School'] },
    { global: true, types: ['Public'] },
  ]);
  assert.equal(resolveScope(mixed).category, 'public');
  const at = scopeOf([{ global: false, counties: ['AT-4'], types: ['School'] }]);
  assert.deepEqual(resolveScope(at), { category: 'observance', regions: ['AT-4'] });
});

test('G-5: ungueltige Regionscodes fallen mit Warnung weg; bleibt nichts, ist der Anlass landesweit', () => {
  const warnings = [];
  const warn = (m) => warnings.push(m);
  const mixed = scopeOf([{ global: false, counties: ['DE-BY', 'bayern', 'DE-TOOLONG1'], types: ['Public'] }]);
  assert.deepEqual(resolveScope(mixed, { warn }).regions, ['DE-BY']);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /DE-TOOLONG1, bayern/); // sortiert (Grossbuchstaben vor Kleinbuchstaben)

  const none = scopeOf([{ global: false, counties: ['bayern'], types: ['Public'] }]);
  assert.equal(resolveScope(none, { warn }).regions, undefined);
});

test('G-5: REGION_CODE_RE entspricht dem App-Vertrag (^[A-Z]{2}-[A-Z0-9]{1,5}$)', () => {
  for (const ok of ['DE-BY', 'CH-GL', 'AT-4', 'GB-ENG', 'US-CA', 'ES-AN', 'BA-BIH', 'AU-NSW']) assert.ok(REGION_CODE_RE.test(ok), ok);
  for (const bad of ['de-by', 'DE_BY', 'DEBY', 'DE-', 'D-BY', 'DE-ABCDEF']) assert.equal(REGION_CODE_RE.test(bad), false, bad);
});

test('G-5: holidayDefinition schreibt regions nur bei nicht-leerer Liste, vor rule', () => {
  const base = { id: 'DE_x', countryCode: 'DE', slug: 'x', rule: { type: 'fixed', month: 1, day: 1 } };
  assert.equal('regions' in holidayDefinition(base), false);
  assert.equal('regions' in holidayDefinition({ ...base, regions: [] }), false);
  assert.equal('regions' in holidayDefinition({ ...base, regions: undefined }), false);
  const regional = holidayDefinition({ ...base, category: 'public', regions: ['DE-TH'] });
  assert.deepEqual(regional.regions, ['DE-TH']);
  assert.deepEqual(Object.keys(regional), ['id', 'countryCode', 'kind', 'labelKey', 'iconName', 'category', 'regions', 'rule']);
});

test('G-5: Vereinigung deckt das Full-Set des Landes ab -> landesweit (kein regions)', () => {
  const gb = scopeOf([
    { global: false, counties: ['GB-ENG', 'GB-WLS', 'GB-NIR'], types: ['Public'] },
    { global: false, counties: ['GB-SCT'], types: ['Public'] },
  ]);
  assert.deepEqual(resolveScope(gb, { fullSet: NAGER_FULL_REGION_SETS.GB }), { category: 'public', regions: undefined });
  // Teilmenge bleibt regional (GB Summer Bank Holiday nur ENG/WLS/NIR waere regional).
  const sct = scopeOf([{ global: false, counties: ['GB-SCT'], types: ['Public'] }]);
  assert.deepEqual(resolveScope(sct, { fullSet: NAGER_FULL_REGION_SETS.GB }).regions, ['GB-SCT']);
  // DE hat kein Full-Set -> Fronleichnam bleibt regional.
  const de = scopeOf([{ global: false, counties: ['DE-BW', 'DE-BY', 'DE-HE', 'DE-NW', 'DE-RP', 'DE-SL'], types: ['Public'] }]);
  assert.deepEqual(resolveScope(de, { fullSet: NAGER_FULL_REGION_SETS.DE }).regions, ['DE-BW', 'DE-BY', 'DE-HE', 'DE-NW', 'DE-RP', 'DE-SL']);
  assert.equal(coversFullRegionSet(['GB-ENG', 'GB-NIR', 'GB-SCT', 'GB-WLS'], NAGER_FULL_REGION_SETS.GB), true);
  assert.equal(coversFullRegionSet(['GB-ENG'], NAGER_FULL_REGION_SETS.GB), false);
  assert.equal(coversFullRegionSet(['DE-BY'], undefined), false);
  assert.equal(coversFullRegionSet(['DE-BY'], []), false);
});
