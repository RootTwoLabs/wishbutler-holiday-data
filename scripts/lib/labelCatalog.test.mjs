import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeHolidayLabels, preserveLabelCatalog } from './labelCatalog.mjs';

test('editorial labels survive stale cache output; new keys are added', () => {
  assert.deepEqual(preserveLabelCatalog({ amazigh: 'Tolles neues Jahr', new_key: 'Neuer Text' }, { amazigh: 'Amazigh-Neujahr', empty: '' }), { amazigh: 'Amazigh-Neujahr', new_key: 'Neuer Text' });
});

test('package merge applies English corrections, fills translations and preserves native languages', () => {
  const current = { en: { nicoya: 'Party of Nicoya', other: 'Other' }, de: { other: 'Andere' }, ca: { nicoya: 'Nicoya' } };
  const catalog = { en: { nicoya: 'Territory of Nicoya' }, de: { nicoya: 'Gebiet von Nicoya', unrelated: 'Unrelated' } };
  const merged = mergeHolidayLabels(current, catalog);
  assert.deepEqual(merged, { en: { nicoya: 'Territory of Nicoya', other: 'Other' }, de: { nicoya: 'Gebiet von Nicoya', other: 'Andere' }, ca: { nicoya: 'Nicoya' } });
  assert.equal(current.en.nicoya, 'Party of Nicoya');
  assert.deepEqual(mergeHolidayLabels(merged, catalog), merged);
});

test('empty catalog entries do not erase existing labels; GLOBAL remains without labels', () => {
  assert.deepEqual(mergeHolidayLabels({ en: { day: 'Day' }, de: { day: 'Tag' } }, { de: { day: ' ' } }), { en: { day: 'Day' }, de: { day: 'Tag' } });
  assert.deepEqual(mergeHolidayLabels({}, { de: { day: 'Tag' } }), {});
});
