import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectRule, ruleMatchesAllYears, mmddFromRule } from './ruleDetection.mjs';

const YEARS = [2026, 2027, 2028, 2029, 2030];

function entryFromRule(rule) {
  return { years: Object.fromEntries(YEARS.map((y) => [y, mmddFromRule(rule, y)])) };
}

test('detectRule: identische Daten -> fixed', () => {
  assert.deepEqual(detectRule({ years: { 2026: '12-25', 2027: '12-25', 2028: '12-25' } }), {
    type: 'fixed',
    month: 12,
    day: 25,
  });
});

test('detectRule: round-trip easter_relative (Karfreitag = -2)', () => {
  const rule = detectRule(entryFromRule({ type: 'easter_relative', offsetDays: -2 }));
  assert.equal(rule.type, 'easter_relative');
  assert.equal(rule.offsetDays, -2);
});

test('detectRule: round-trip nth_weekday (4. Donnerstag im November)', () => {
  const rule = detectRule(entryFromRule({ type: 'nth_weekday', month: 11, nth: 4, weekday: 4 }));
  assert.equal(rule.type, 'nth_weekday');
  assert.equal(rule.month, 11);
  assert.equal(rule.weekday, 4);
});

test('#134: knappe Mehrheit mit Observed-Shift -> precomputed (NICHT fixed)', () => {
  // 4x 07-04, 1x 07-03 (Wochenend-Shift). detectModeFixed wuerde "fixed 07-04"
  // liefern, was 2029 falsch berechnet -> Rueckverprobung erzwingt precomputed.
  const entry = { years: { 2026: '07-04', 2027: '07-04', 2028: '07-04', 2029: '07-03', 2030: '07-04' } };
  const rule = detectRule(entry);
  assert.equal(rule.type, 'precomputed');
  assert.deepEqual(rule.dates, entry.years);
});

test('ruleMatchesAllYears: erkennt eine Jahresabweichung', () => {
  assert.equal(
    ruleMatchesAllYears({ type: 'fixed', month: 7, day: 4 }, [2026, 2027], { 2026: '07-04', 2027: '07-03' }),
    false,
  );
  assert.equal(
    ruleMatchesAllYears({ type: 'fixed', month: 7, day: 4 }, [2026, 2027], { 2026: '07-04', 2027: '07-04' }),
    true,
  );
});
