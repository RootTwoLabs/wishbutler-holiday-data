import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSelectedHoliday } from './holidaySelection.mjs';

test('exclude the requested anniversary without dropping national memorial holidays', () => {
  assert.equal(isSelectedHoliday('DE_75th_anniversary_of_the_uprising_of_june_17_1953'), false);
  for (const id of ['DE_german_unity_day', 'US_memorial_day', 'AU_anzac_day', 'HU_1956_revolution_memorial_day']) {
    assert.equal(isSelectedHoliday(id), true);
  }
});
