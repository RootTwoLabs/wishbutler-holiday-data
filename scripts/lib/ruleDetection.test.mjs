import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectRule, ruleMatchesAllYears, mmddFromRule, pickHolidayStart } from './ruleDetection.mjs';

test('pickHolidayStart: mehrtaegiges Fest (Kette) -> erster Tag, egal in welcher Reihenfolge', () => {
  // Eid al-Adha 2026 (EG) kommt von Nager als 5 Eintraege 27.–31.05.
  assert.equal(pickHolidayStart(2026, ['05-27', '05-28', '05-29', '05-30', '05-31']), '05-27');
  assert.equal(pickHolidayStart(2027, ['06-20', '06-18', '06-19']), '06-18');
  // Kette ueber den Monatswechsel (Naadam-artig)
  assert.equal(pickHolidayStart(2026, ['07-31', '08-01', '08-02']), '07-31');
  // Schaltjahr: 28.02. -> 29.02. -> 01.03. ist eine Kette
  assert.equal(pickHolidayStart(2028, ['02-28', '02-29', '03-01']), '02-28');
});

test('pickHolidayStart: regionale Varianten (keine Kette) -> bisheriges Verhalten, letzter Eintrag', () => {
  // GB Summer Bank Holiday: Schottland 1. Montag, England letzter Montag im August.
  assert.equal(pickHolidayStart(2026, ['08-03', '08-31']), '08-31');
  // Schaltjahr-Gegenprobe: 28.02. und 01.03. sind 2027 KEINE Kette.
  assert.equal(pickHolidayStart(2027, ['03-01', '02-28']), '02-28');
});

test('pickHolidayStart: Duplikate gleicher Tage (mehrere Kantone) und Einzeltage', () => {
  assert.equal(pickHolidayStart(2026, ['01-06', '01-06', '01-06']), '01-06');
  assert.equal(pickHolidayStart(2026, ['12-25']), '12-25');
  assert.equal(pickHolidayStart(2026, []), null);
});

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
