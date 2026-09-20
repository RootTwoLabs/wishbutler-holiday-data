/**
 * Closed-form rule detection for public holidays.
 *
 * Given a holiday's observed MM-DD per year, derive the most compact rule the
 * client can evaluate offline (fixed / easter_relative / nth_weekday), falling
 * back to a lossless `precomputed` table otherwise.
 *
 * #134: every derived closed-form rule is RE-VERIFIED against all known years.
 * If it does not reproduce the actual date for every year (e.g. weekend
 * "observed" shifts that detectModeFixed would paper over), we fall back to
 * `precomputed` so the client never computes a wrong date.
 */
import { computeEasterSunday } from './easter.mjs';

function pad(n) {
  return String(n).padStart(2, '0');
}

function ymd(date) {
  return `${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function dayNumber(year, mmdd) {
  const [m, d] = mmdd.split('-').map(Number);
  return Math.round(Date.UTC(year, m - 1, d) / 86400000);
}

/**
 * Reduziert alle in einem Jahr beobachteten Tage eines Feiertagsnamens auf
 * das eine Datum, das ins Paket kommt.
 *
 * Nager liefert denselben Namen mehrfach in zwei ganz verschiedenen Faellen:
 *  1. Mehrtaegiges Fest (Eid al-Adha 27.–31.05., Chuseok, Naadam, Karneval
 *     Mo+Di …): die Tage bilden eine LUECKENLOSE Kette -> der ERSTE Tag zaehlt,
 *     gratuliert wird zum Auftakt. Vorher gewann stillschweigend der zuletzt
 *     gelesene Tag (EG Eid al-Adha 2026 stand auf dem 31.05.).
 *  2. Regionale Varianten an verschiedenen Tagen (GB Summer Bank Holiday:
 *     England letzter / Schottland erster Montag im August; AU Labour Day je
 *     Bundesstaat): keine Kette -> bisheriges Verhalten (letzter gelesener
 *     Eintrag) bleibt, damit sich fuer diese Laender nichts verschiebt.
 *
 * `mmdds` in Lesereihenfolge; Duplikate (gleicher Tag, mehrere Kantone) sind ok.
 */
export function pickHolidayStart(year, mmdds) {
  if (mmdds.length === 0) return null;
  const unique = [...new Set(mmdds)].sort();
  if (unique.length === 1) return unique[0];

  let consecutive = true;
  for (let i = 1; i < unique.length; i++) {
    if (dayNumber(year, unique[i]) !== dayNumber(year, unique[i - 1]) + 1) {
      consecutive = false;
      break;
    }
  }
  return consecutive ? unique[0] : mmdds.at(-1);
}

export function easterOffsetForDate(year, mmdd) {
  const easter = computeEasterSunday(year);
  const [m, d] = mmdd.split('-').map(Number);
  const target = Date.UTC(year, m - 1, d);
  const base = Date.UTC(year, easter.getUTCMonth(), easter.getUTCDate());
  return Math.round((target - base) / 86400000);
}

/** Detects a "nth weekday of month" pattern (incl. "last weekday"). */
export function detectNthWeekday(years, byYear) {
  let month = null;
  let weekday = null;
  let firstNth = null;
  let allSameNth = true;
  let allLast = true;

  for (const y of years) {
    const [m, d] = byYear[y].split('-').map(Number);
    const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    const nth = Math.ceil(d / 7);
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const isLast = d + 7 > daysInMonth;

    if (month === null) {
      month = m;
      weekday = wd;
      firstNth = nth;
    } else if (m !== month || wd !== weekday) {
      return null;
    }
    if (nth !== firstNth) allSameNth = false;
    if (!isLast) allLast = false;
  }

  if (month === null) return null;
  if (allSameNth) return { type: 'nth_weekday', month, nth: firstNth, weekday };
  if (allLast) return { type: 'nth_weekday', month, nth: 5, weekday, last: true };
  return null;
}

/**
 * Exakte Regelgleichheit fuer das Alias-Merging auf GLOBAL_RULES (fetch-holidays
 * und migrate-observed-rules): nur fixed/easter_relative sind vergleichbar.
 */
export function rulesEqual(a, b) {
  if (!a || !b || a.type !== b.type) return false;
  if (a.type === 'fixed') return a.month === b.month && a.day === b.day;
  if (a.type === 'easter_relative') return a.offsetDays === b.offsetDays;
  return false;
}

/** Picks a fixed date when one MM-DD is a strict majority across the years. */
export function detectModeFixed(mmdds) {
  const counts = new Map();
  for (const mmdd of mmdds) counts.set(mmdd, (counts.get(mmdd) ?? 0) + 1);
  let best = null;
  for (const [mmdd, count] of counts) {
    if (!best || count > best.count) best = { mmdd, count };
  }
  if (best && best.count > mmdds.length / 2) {
    const [m, d] = best.mmdd.split('-').map(Number);
    return { type: 'fixed', month: m, day: d };
  }
  return null;
}

/** Date (UTC) of the nth (or last) `weekday` in `month` of `year`. */
function nthWeekdayDate(year, rule) {
  const { month, weekday } = rule;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (rule.last) {
    for (let d = daysInMonth; d >= 1; d--) {
      const dt = new Date(Date.UTC(year, month - 1, d));
      if (dt.getUTCDay() === weekday) return dt;
    }
  } else {
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(Date.UTC(year, month - 1, d));
      if (dt.getUTCDay() === weekday) {
        count += 1;
        if (count === rule.nth) return dt;
      }
    }
  }
  return null;
}

/** The MM-DD a closed-form rule produces for `year` (null for `precomputed`). */
export function mmddFromRule(rule, year) {
  if (rule.type === 'fixed') return `${pad(rule.month)}-${pad(rule.day)}`;
  if (rule.type === 'easter_relative') {
    const e = computeEasterSunday(year);
    const dt = new Date(Date.UTC(year, e.getUTCMonth(), e.getUTCDate()) + rule.offsetDays * 86400000);
    return ymd(dt);
  }
  if (rule.type === 'nth_weekday') {
    const dt = nthWeekdayDate(year, rule);
    return dt ? ymd(dt) : null;
  }
  return null; // precomputed — trivially matches its own table
}

/** Whether `rule` reproduces the observed MM-DD for every known year. */
export function ruleMatchesAllYears(rule, years, byYear) {
  for (const y of years) {
    const expected = mmddFromRule(rule, y);
    if (expected === null) return true; // precomputed / unverifiable -> accept
    if (expected !== byYear[y]) return false;
  }
  return true;
}

/**
 * Abstand (in Tagen) eines beobachteten MM-DD zum Fixdatum desselben Jahres —
 * ueber den Jahreswechsel hinweg: Nager liefert fuer "New Year's Day 2028"
 * (Samstag) den Ersatztag 2027-12-31 im Jahr-2028-Response, fetch-holidays
 * speichert davon nur "12-31" unter 2028. Deshalb das naechstgelegene
 * Vorkommen des MM-DD in y-1, y, y+1 nehmen.
 */
function nearestOffsetDays(year, actualMmdd, fixedMmdd) {
  const fixed = dayNumber(year, fixedMmdd);
  let best = null;
  for (const y of [year - 1, year, year + 1]) {
    const diff = dayNumber(y, actualMmdd) - fixed;
    if (best === null || Math.abs(diff) < Math.abs(best)) best = diff;
  }
  return best;
}

/**
 * G-1: Ein Fixdatum, dessen Tabelle nur "observed"-Ersatztage abweicht, ist
 * fuer die App ein `fixed`-Anlass — gratuliert wird zum Anlass, nicht zum
 * arbeitsfreien Ersatztag. Sonst stehen z. B. US-Weihnachten 2027 am 24.12.
 * (precomputed) UND das GLOBAL-Weihnachten am 25.12. nebeneinander, weil das
 * Alias-Merging auf GLOBAL nur bei exakt gleicher Regel greift.
 *
 * Akzeptiert wird die Mehrheits-Fixregel aus detectModeFixed, wenn JEDE
 * Abweichung ein Ersatztag-Muster ist:
 *   - das Fixdatum faellt in dem Jahr auf Samstag oder Sonntag, UND
 *   - der Ersatztag liegt hoechstens 3 Kalendertage entfernt, und zwar
 *     Samstag -> Freitag (-1, US-Stil) oder Montag/Dienstag (+2/+3,
 *     Commonwealth-Stil, +3 wenn der Montag schon belegt ist),
 *     Sonntag  -> Montag/Dienstag/Mittwoch (+1..+3, je nach belegten Tagen).
 * Bewusst NICHT akzeptiert: Sonntag -> Samstag (-1). Das ist kein Ersatztag,
 * sondern ein echter Datumswechsel (NL Koningsdag wird am Samstag gefeiert,
 * wenn der 27.04. ein Sonntag ist) — solche Tabellen bleiben `precomputed`.
 * Ebenso bleibt alles precomputed, was in einem Werktags-Jahr abweicht
 * (astronomische Termine wie JP-Aequinoktien, "naechster Freitag"-Regeln in
 * CL/EG, Kaskaden-Verschiebungen wie GB "2 January").
 */
export function isObservedShift(year, actualMmdd, fixedRule) {
  const fixedMmdd = mmddFromRule(fixedRule, year);
  if (actualMmdd === fixedMmdd) return true;
  const [m, d] = fixedMmdd.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, m - 1, d)).getUTCDay();
  const diff = nearestOffsetDays(year, actualMmdd, fixedMmdd);
  if (weekday === 6) return diff === -1 || diff === 2 || diff === 3;
  if (weekday === 0) return diff >= 1 && diff <= 3;
  return false;
}

/** G-1: Mehrheits-Fixdatum, dessen Abweichungen alle Ersatztage sind — sonst null. */
export function detectObservedFixed(years, byYear) {
  const candidate = detectModeFixed(years.map((y) => byYear[y]));
  if (!candidate) return null;
  return years.every((y) => isObservedShift(y, byYear[y], candidate)) ? candidate : null;
}

export function detectRule(entry, { expectedYears = [] } = {}) {
  const years = Object.keys(entry.years)
    .map(Number)
    .sort((a, b) => a - b);
  const mmdds = years.map((y) => entry.years[y]);

  // A one-off anniversary or a partially announced calendar must never become
  // an annual holiday. Only infer recurrence from a complete observation window.
  if (years.length < 3 || expectedYears.some((y) => entry.years[y] == null)) {
    return { type: 'precomputed', dates: { ...entry.years } };
  }

  let candidate = null;
  if (new Set(mmdds).size === 1) {
    const [m, d] = mmdds[0].split('-').map(Number);
    candidate = { type: 'fixed', month: m, day: d };
  } else {
    const offsets = new Set(years.map((y) => easterOffsetForDate(y, entry.years[y])));
    if (offsets.size === 1) {
      candidate = { type: 'easter_relative', offsetDays: [...offsets][0] };
    } else {
      candidate = detectNthWeekday(years, entry.years) ?? detectModeFixed(mmdds);
    }
  }

  // #134: closed-form Kandidat gegen ALLE Jahre rueckverproben; sonst precomputed.
  if (candidate && ruleMatchesAllYears(candidate, years, entry.years)) return candidate;

  // G-1: Fixdatum mit reinen Wochenend-Ersatztagen -> trotzdem fixed.
  const observedFixed = detectObservedFixed(years, entry.years);
  if (observedFixed) return observedFixed;

  return { type: 'precomputed', dates: entry.years };
}
