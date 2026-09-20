import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectRule,
  ruleMatchesAllYears,
  mmddFromRule,
  pickHolidayStart,
  isObservedShift,
  detectObservedFixed,
  rulesEqual,
} from './ruleDetection.mjs';

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

test('one-off Berlin anniversary stays limited to 2028', () => {
  assert.deepEqual(detectRule({ years: { 2028: '06-17' } }, { expectedYears: YEARS }), {
    type: 'precomputed', dates: { 2028: '06-17' },
  });
});

test('recurrence is not inferred across missing or unannounced years', () => {
  const years = { 2026: '09-25', 2027: '09-24', 2028: '09-29' };
  assert.deepEqual(detectRule({ years }, { expectedYears: YEARS }), { type: 'precomputed', dates: years });
  assert.equal(detectRule({ years: { 2026: '01-02', 2027: '01-02' } }).type, 'precomputed');
});

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

// ---------------------------------------------------------------------------
// G-1: Nager-"observed"-Ersatztage -> fixed (echte Tabellen aus Tag v13)
// ---------------------------------------------------------------------------

const FIXED = (month, day) => ({ type: 'fixed', month, day });

test('G-1: US Christmas Day 2026–2035 (Sa->Fr, So->Mo) -> fixed 12-25', () => {
  const years = {
    2026: '12-25', 2027: '12-24', 2028: '12-25', 2029: '12-25', 2030: '12-25',
    2031: '12-25', 2032: '12-24', 2033: '12-26', 2034: '12-25', 2035: '12-25',
  };
  assert.deepEqual(detectRule({ years }), FIXED(12, 25));
});

test('G-1: US Independence Day (2026 Sa->03.07., 2027 So->05.07., 2032 So->05.07.) -> fixed 07-04', () => {
  const years = {
    2026: '07-03', 2027: '07-05', 2028: '07-04', 2029: '07-04', 2030: '07-04',
    2031: '07-04', 2032: '07-05', 2033: '07-04', 2034: '07-04', 2035: '07-04',
  };
  assert.deepEqual(detectRule({ years }), FIXED(7, 4));
});

test('G-1: US New Year\'s Day — Ersatztag 12-31 ueber den Jahreswechsel (Nager: 2027-12-31 im 2028-Response) -> fixed 01-01', () => {
  const years = {
    2026: '01-01', 2027: '01-01', 2028: '12-31', 2029: '01-01', 2030: '01-01',
    2031: '01-01', 2032: '01-01', 2033: '12-31', 2034: '01-02', 2035: '01-01',
  };
  assert.deepEqual(detectRule({ years }), FIXED(1, 1));
});

test('G-1: GB St. Stephen\'s Day (2026 Sa->Mo 28.12., 2027/2032 So->Di 28.12.) -> fixed 12-26', () => {
  const years = {
    2026: '12-28', 2027: '12-28', 2028: '12-26', 2029: '12-26', 2030: '12-26',
    2031: '12-26', 2032: '12-28', 2033: '12-26', 2034: '12-26', 2035: '12-26',
  };
  assert.deepEqual(detectRule({ years }), FIXED(12, 26));
});

test('G-1: GB Christmas Day (Sa->Mo +2, So->Di +2 weil Mo = Boxing Day) -> fixed 12-25', () => {
  const years = {
    2026: '12-25', 2027: '12-27', 2028: '12-25', 2029: '12-25', 2030: '12-25',
    2031: '12-25', 2032: '12-27', 2033: '12-27', 2034: '12-25', 2035: '12-25',
  };
  assert.deepEqual(detectRule({ years }), FIXED(12, 25));
});

test('G-1: JP Constitution Memorial Day 2026 (So 03.05. -> Mi 06.05., +3 wegen Golden Week) -> fixed 05-03', () => {
  const years = {
    2026: '05-06', 2027: '05-03', 2028: '05-03', 2029: '05-03', 2030: '05-03',
    2031: '05-03', 2032: '05-03', 2033: '05-03', 2034: '05-03', 2035: '05-03',
  };
  assert.deepEqual(detectRule({ years }), FIXED(5, 3));
});

test('G-1 Gegenprobe: Abweichung > 3 Tage bleibt precomputed', () => {
  const years = {
    2026: '01-29', 2027: '01-25', 2028: '01-25', 2029: '01-25', 2030: '01-25',
    2031: '01-25', 2032: '01-25', 2033: '01-25', 2034: '01-25', 2035: '01-25',
  };
  // EG Police Day 2026: 25.01. ist ein Sonntag, Ersatz +4 -> kein Ersatztag-Muster.
  assert.equal(detectRule({ years }).type, 'precomputed');
});

test('G-1 Gegenprobe: Abweichung in einem Werktags-Jahr bleibt precomputed', () => {
  // JP Vernal Equinox: 2027 (Sa 20.03. -> So 21.03. ist +1 auf einen SONNTAG, kein Ersatztag),
  // 2031 (Do -> Fr), 2035 (Di -> Mi): astronomisch, nicht observed.
  const equinox = {
    2026: '03-20', 2027: '03-21', 2028: '03-20', 2029: '03-20', 2030: '03-20',
    2031: '03-21', 2032: '03-20', 2033: '03-20', 2034: '03-20', 2035: '03-21',
  };
  assert.equal(detectRule({ years: equinox }).type, 'precomputed');
  // Bestehender #134-Fall: 2029-07-04 ist ein Mittwoch, 07-03 also kein Ersatztag.
  const weekdayShift = { 2026: '07-04', 2027: '07-04', 2028: '07-04', 2029: '07-03', 2030: '07-04' };
  assert.equal(detectRule({ years: weekdayShift }).type, 'precomputed');
  // GB "2 January" 2034: 02.01. ist ein Montag, Kaskade (+1) -> precomputed.
  const cascade = {
    2026: '01-02', 2027: '01-02', 2028: '01-04', 2029: '01-02', 2030: '01-02',
    2031: '01-02', 2032: '01-02', 2033: '01-04', 2034: '01-03', 2035: '01-02',
  };
  assert.equal(detectRule({ years: cascade }).type, 'precomputed');
});

test('G-1 Gegenprobe: NL Koningsdag (So 27.04.2031 -> Sa 26.04.) ist ein echter Datumswechsel, kein Ersatztag', () => {
  const years = {
    2026: '04-27', 2027: '04-27', 2028: '04-27', 2029: '04-27', 2030: '04-27',
    2031: '04-26', 2032: '04-27', 2033: '04-27', 2034: '04-27', 2035: '04-27',
  };
  const rule = detectRule({ years });
  assert.equal(rule.type, 'precomputed');
  assert.deepEqual(rule.dates, years);
  assert.equal(isObservedShift(2031, '04-26', FIXED(4, 27)), false);
});

test('G-1: isObservedShift — erlaubte Muster je Wochentag des Fixdatums', () => {
  // 2026-12-26 ist ein Samstag.
  assert.equal(isObservedShift(2026, '12-25', FIXED(12, 26)), true); // Sa -> Fr (US)
  assert.equal(isObservedShift(2026, '12-28', FIXED(12, 26)), true); // Sa -> Mo (UK)
  assert.equal(isObservedShift(2026, '12-29', FIXED(12, 26)), true); // Sa -> Di (Mo belegt)
  assert.equal(isObservedShift(2026, '12-27', FIXED(12, 26)), false); // Sa -> So: kein Ersatztag
  assert.equal(isObservedShift(2026, '12-30', FIXED(12, 26)), false); // > 3 Tage
  // 2027-12-26 ist ein Sonntag.
  assert.equal(isObservedShift(2027, '12-27', FIXED(12, 26)), true); // So -> Mo
  assert.equal(isObservedShift(2027, '12-28', FIXED(12, 26)), true); // So -> Di
  assert.equal(isObservedShift(2027, '12-29', FIXED(12, 26)), true); // So -> Mi
  assert.equal(isObservedShift(2027, '12-25', FIXED(12, 26)), false); // So -> Sa: echter Datumswechsel
  // 2028-12-26 ist ein Dienstag: jede Abweichung ist ein Regelverlust.
  assert.equal(isObservedShift(2028, '12-27', FIXED(12, 26)), false);
  assert.equal(isObservedShift(2028, '12-26', FIXED(12, 26)), true);
});

test('G-1: detectObservedFixed verlangt strikte Mehrheit', () => {
  // 2 von 4 Jahren treffen -> keine Mehrheit -> null, obwohl alle Abweichungen Ersatztage waeren.
  const byYear = { 2026: '07-03', 2027: '07-05', 2028: '07-04', 2029: '07-04' };
  assert.equal(detectObservedFixed([2026, 2027, 2028, 2029], byYear), null);
  assert.deepEqual(detectObservedFixed([2026, 2027, 2028, 2029, 2030], { ...byYear, 2030: '07-04' }), FIXED(7, 4));
});

test('rulesEqual: fixed/easter_relative exakt, precomputed/nth_weekday nie', () => {
  assert.equal(rulesEqual(FIXED(12, 25), FIXED(12, 25)), true);
  assert.equal(rulesEqual(FIXED(12, 25), FIXED(12, 26)), false);
  assert.equal(rulesEqual({ type: 'easter_relative', offsetDays: -2 }, { type: 'easter_relative', offsetDays: -2 }), true);
  assert.equal(rulesEqual({ type: 'precomputed', dates: {} }, { type: 'precomputed', dates: {} }), false);
  assert.equal(rulesEqual(FIXED(1, 1), undefined), false);
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
