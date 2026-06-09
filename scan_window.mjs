import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const YEAR = 2026;
const FROM = new Date(YEAR, 5, 9); // Jun 9
const TO = new Date(YEAR, 5, 16); // Jun 16

function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function nthWeekday(year, month, nth, weekday, last) {
  if (last) {
    const d = new Date(year, month, 0);
    while (d.getDay() !== weekday) d.setDate(d.getDate() - 1);
    return d;
  }
  const d = new Date(year, month - 1, 1);
  let count = 0;
  while (true) {
    if (d.getDay() === weekday) {
      count += 1;
      if (count === nth) return new Date(d);
    }
    d.setDate(d.getDate() + 1);
  }
}

function resolve(rule, year) {
  if (rule.type === 'fixed') return new Date(year, rule.month - 1, rule.day);
  if (rule.type === 'easter_relative') {
    const e = easterSunday(year);
    e.setDate(e.getDate() + rule.offsetDays);
    return e;
  }
  if (rule.type === 'nth_weekday') return nthWeekday(year, rule.month, rule.nth, rule.weekday, rule.last ?? false);
  if (rule.type === 'precomputed') {
    const mmdd = rule.dates?.[String(year)];
    if (!mmdd) return null;
    const [m, d] = mmdd.split('-').map(Number);
    return new Date(year, m - 1, d);
  }
  return null;
}

const PACKAGES = join('data', 'packages');
const countries = await readdir(PACKAGES);
const hits = [];

for (const cc of countries) {
  const dir = join(PACKAGES, cc);
  let versions;
  try {
    versions = (await readdir(dir)).filter((v) => /^v\d+$/.test(v)).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  } catch {
    continue;
  }
  const latest = versions.at(-1);
  if (!latest) continue;
  const pkg = JSON.parse(await readFile(join(dir, latest, 'package.json'), 'utf8'));
  const labels = pkg.i18n?.holidays ?? {};
  for (const def of pkg.definitions ?? []) {
    const date = resolve(def.rule, YEAR);
    if (!date || date < FROM || date > TO) continue;
    // country-specific = labelKey not a bare global slug (has i18n label in package)
    const slug = (def.labelKey || '').replace(/^holidays\./, '');
    let label = slug;
    for (const loc of Object.keys(labels)) {
      if (labels[loc]?.[slug]) { label = labels[loc][slug]; break; }
    }
    const countrySpecific = Object.values(labels).some((m) => m && m[slug]);
    hits.push({
      cc,
      version: latest,
      date: date.toISOString().slice(0, 10),
      rule: def.rule.type,
      labelKey: def.labelKey,
      label,
      countrySpecific,
    });
  }
}

hits.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.cc.localeCompare(b.cc)));
console.log(`Window ${FROM.toISOString().slice(0,10)} .. ${TO.toISOString().slice(0,10)} (${hits.length} holidays)`);
for (const h of hits) {
  console.log(`${h.date}  ${h.cc} ${h.version}  ${h.countrySpecific ? '[country]' : '[global ]'}  ${h.rule.padEnd(14)} ${h.labelKey}  ->  ${h.label}`);
}
