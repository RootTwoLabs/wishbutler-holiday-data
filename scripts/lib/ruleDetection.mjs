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

export function detectRule(entry) {
  const years = Object.keys(entry.years)
    .map(Number)
    .sort((a, b) => a - b);
  const mmdds = years.map((y) => entry.years[y]);

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
  return { type: 'precomputed', dates: entry.years };
}
