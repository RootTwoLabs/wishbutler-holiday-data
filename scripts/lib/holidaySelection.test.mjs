import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSelectedHoliday, UNTRANSLATED_HOLIDAY_IDS } from './holidaySelection.mjs';

test('exclude the requested anniversary without dropping national memorial holidays', () => {
  assert.equal(isSelectedHoliday('DE_75th_anniversary_of_the_uprising_of_june_17_1953'), false);
  for (const id of ['DE_german_unity_day', 'US_memorial_day', 'AU_anzac_day', 'HU_1956_revolution_memorial_day']) {
    assert.equal(isSelectedHoliday(id), true);
  }
});

test('Paket 2a: unuebersetzte neue Nager-IDs bleiben draussen, bis Labels in 17 Sprachen vorliegen', () => {
  for (const id of UNTRANSLATED_HOLIDAY_IDS) assert.equal(isSelectedHoliday(id), false, id);
  assert.equal(isSelectedHoliday('PE_battle_of_junin'), false);
  // Uebersetzte PE-Anlaesse bleiben ausgewaehlt.
  assert.equal(isSelectedHoliday('PE_air_force_day'), true);
  assert.equal(isSelectedHoliday('PE_international_workers_day'), true);
});
