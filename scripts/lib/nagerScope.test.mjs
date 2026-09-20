import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newScope, collectScope, resolveScope, categoryFromTypes, coversFullRegionSet, regionalSplitFor, REGION_CODE_RE } from './nagerScope.mjs';
import { NAGER_FULL_REGION_SETS, NAGER_REGIONAL_SPLITS } from '../config.mjs';
import { detectRule, pickHolidayStart } from './ruleDetection.mjs';
import { slugify } from './nagerSlug.mjs';
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

// ── GB Summer Bank Holiday: ein Nager-Name, zwei Termine je Landesteil ─────────

/** n-ter (bzw. letzter) Montag im August als "MM-DD". */
function augustMonday(year, which) {
  const mondays = [];
  for (let day = 1; day <= 31; day++) {
    if (new Date(Date.UTC(year, 7, day)).getUTCDay() === 1) mondays.push(day);
  }
  const day = which === 'last' ? mondays.at(-1) : mondays[0];
  return `08-${String(day).padStart(2, '0')}`;
}

/** Nager-Zeilen, wie die API sie fuer GB liefert: gleiche `name`, zwei Zeilen je Jahr. */
function gbSummerRows(year) {
  const base = { localName: 'Summer Bank Holiday', name: 'Summer Bank Holiday', countryCode: 'GB', global: false, types: ['Public'] };
  return [
    { ...base, date: `${year}-${augustMonday(year, 'first')}`, counties: ['GB-SCT'] },
    { ...base, date: `${year}-${augustMonday(year, 'last')}`, counties: ['GB-ENG', 'GB-WLS', 'GB-NIR'] },
  ];
}

/** Gruppierung wie in fetch-holidays.mjs `buildCountry` (Name -> Termine + Scope). */
function groupLikeFetch(cc, rowsByYear, splits) {
  const byName = new Map();
  for (const [year, rows] of Object.entries(rowsByYear)) {
    for (const h of rows) {
      const split = regionalSplitFor(splits?.[cc], h.name, h);
      const name = split ? split.name : h.name;
      const entry = byName.get(name) ?? { name, slug: slugify(name), observed: {}, years: {}, scope: newScope() };
      (entry.observed[year] ??= []).push(h.date.slice(5));
      collectScope(entry.scope, h);
      byName.set(name, entry);
    }
  }
  const years = Object.keys(rowsByYear).map(Number);
  return [...byName.values()].map((entry) => {
    for (const [year, mmdds] of Object.entries(entry.observed)) entry.years[year] = pickHolidayStart(Number(year), mmdds);
    const { category, regions } = resolveScope(entry.scope, { fullSet: NAGER_FULL_REGION_SETS[cc] });
    return holidayDefinition({ id: `${cc}_${entry.slug}`, countryCode: cc, slug: entry.slug, rule: detectRule(entry, { expectedYears: years }), category, regions });
  });
}

const GB_YEARS = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [2026 + i, gbSummerRows(2026 + i)]));

test('regionalSplitFor: nur rein schottische Zeilen wandern in den Split', () => {
  const splits = NAGER_REGIONAL_SPLITS.GB;
  const sct = { global: false, counties: ['GB-SCT'] };
  assert.equal(regionalSplitFor(splits, 'Summer Bank Holiday', sct)?.name, 'Summer Bank Holiday (Scotland)');
  // England/Wales/Nordirland, gemischte Zeile, landesweite Zeile, fremder Name, fremdes Land -> kein Split
  assert.equal(regionalSplitFor(splits, 'Summer Bank Holiday', { global: false, counties: ['GB-ENG', 'GB-WLS', 'GB-NIR'] }), null);
  assert.equal(regionalSplitFor(splits, 'Summer Bank Holiday', { global: false, counties: ['GB-SCT', 'GB-ENG'] }), null);
  assert.equal(regionalSplitFor(splits, 'Summer Bank Holiday', { global: true, counties: null }), null);
  assert.equal(regionalSplitFor(splits, 'Summer Bank Holiday', { global: false, counties: [] }), null);
  assert.equal(regionalSplitFor(splits, '2 January', sct), null);
  assert.equal(regionalSplitFor(undefined, 'Summer Bank Holiday', sct), null);
});

test('GB Summer Bank Holiday: OHNE Split eine landesweite Definition mit dem falschen Tag fuer Schottland (Ausgangsbefund)', () => {
  const defs = groupLikeFetch('GB', GB_YEARS, {});
  assert.equal(defs.length, 1);
  assert.equal(defs[0].id, 'GB_summer_bank_holiday');
  assert.equal(defs[0].regions, undefined);
  assert.deepEqual(defs[0].rule, { type: 'nth_weekday', month: 8, nth: 5, weekday: 1, last: true });
});

test('GB Summer Bank Holiday: MIT Split zwei geschlossene nth_weekday-Definitionen, alte ID bleibt', () => {
  const defs = groupLikeFetch('GB', GB_YEARS, NAGER_REGIONAL_SPLITS);
  assert.deepEqual(defs, [
    {
      id: 'GB_summer_bank_holiday_scotland',
      countryCode: 'GB',
      kind: 'nth_weekday',
      labelKey: 'holidays.summer_bank_holiday_scotland',
      iconName: 'event',
      category: 'public',
      regions: ['GB-SCT'],
      rule: { type: 'nth_weekday', month: 8, nth: 1, weekday: 1 },
    },
    {
      id: 'GB_summer_bank_holiday',
      countryCode: 'GB',
      kind: 'nth_weekday',
      labelKey: 'holidays.summer_bank_holiday',
      iconName: 'event',
      category: 'public',
      regions: ['GB-ENG', 'GB-NIR', 'GB-WLS'],
      rule: { type: 'nth_weekday', month: 8, nth: 5, weekday: 1, last: true },
    },
  ]);
  // Die im Split hinterlegte Regel (Offline-Migration) ist genau die, die der Fetch erkennt.
  assert.deepEqual(defs[0].rule, NAGER_REGIONAL_SPLITS.GB['Summer Bank Holiday'][0].rule);
});
