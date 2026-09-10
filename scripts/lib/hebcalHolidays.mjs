/**
 * Israel (IL) — kuratierte Feiertagsliste auf Basis der Hebcal-API.
 *
 * Weder Nager.Date noch OpenHolidays kennen Israel. Hebcal liefert den
 * juedischen Kalender tagesgenau; mit `i=on` im Israel-Schema (Pessach 7 Tage,
 * Schmini Azeret = Simchat Tora, Schawuot 1 Tag).
 *
 * Mehrtaegige Feste (Pessach, Sukkot, Chanukka) tragen genau EIN Datum: den
 * ersten Tag — das Paket-Schema kennt (noch) kein Dauer-Feld, gratuliert wird
 * am ersten Tag. Fuer Pessach und Sukkot ist der letzte Feiertag (Pessach VII,
 * Schmini Azeret) in Israel ein eigener arbeitsfreier Tag und deshalb eine
 * eigene Definition.
 *
 * Hebcal listet viele Gedenk- und Nebentage (Herzl Day, Jabotinsky Day,
 * Rosh Chodesh …); nur die Eintraege dieser Tabelle werden uebernommen.
 * Die Hebcal-Titel enthalten typografische Apostrophe (’), daher `.` im Regex.
 */
import { detectRule } from './ruleDetection.mjs';

export const ISRAEL_HOLIDAYS = [
  { slug: 'rosh_hashanah', match: /^Rosh Hashana \d{4}$/, en: 'Rosh Hashanah', he: 'ראש השנה', category: 'public' },
  { slug: 'yom_kippur', match: /^Yom Kippur$/, en: 'Yom Kippur', he: 'יום כיפור', category: 'public' },
  { slug: 'sukkot', match: /^Sukkot I$/, en: 'Sukkot', he: 'סוכות', category: 'public' },
  { slug: 'shemini_atzeret_simchat_torah', match: /^Shmini Atzeret$/, en: 'Shemini Atzeret & Simchat Torah', he: 'שמיני עצרת ושמחת תורה', category: 'public' },
  { slug: 'hanukkah', match: /^Chanukah: 1 Candle$/, en: 'Hanukkah', he: 'חנוכה', category: 'religious' },
  { slug: 'tu_bishvat', match: /^Tu BiShvat$/, en: 'Tu BiShvat', he: 'ט״ו בשבט', category: 'observance' },
  { slug: 'purim', match: /^Purim$/, en: 'Purim', he: 'פורים', category: 'religious' },
  { slug: 'passover', match: /^Pesach I$/, en: 'Passover', he: 'פסח', category: 'public' },
  { slug: 'passover_seventh_day', match: /^Pesach VII$/, en: 'Seventh Day of Passover', he: 'שביעי של פסח', category: 'public' },
  { slug: 'yom_hashoah', match: /^Yom HaShoah$/, en: 'Yom HaShoah (Holocaust Remembrance Day)', he: 'יום השואה', category: 'observance' },
  { slug: 'yom_hazikaron', match: /^Yom HaZikaron$/, en: 'Yom HaZikaron (Memorial Day)', he: 'יום הזיכרון', category: 'observance' },
  { slug: 'yom_haatzmaut', match: /^Yom HaAtzma.ut$/, en: 'Yom HaAtzmaut (Independence Day)', he: 'יום העצמאות', category: 'public' },
  { slug: 'lag_baomer', match: /^Lag BaOmer$/, en: 'Lag BaOmer', he: 'ל״ג בעומר', category: 'observance' },
  { slug: 'yom_yerushalayim', match: /^Yom Yerushalayim$/, en: 'Jerusalem Day', he: 'יום ירושלים', category: 'observance' },
  { slug: 'shavuot', match: /^Shavuot$/, en: 'Shavuot', he: 'שבועות', category: 'public' },
  // Faellt der 9. Av auf Schabbat, wird das Fasten auf Sonntag verschoben —
  // Hebcal haengt dann „(observed)“ an (z. B. 2029, 2032).
  { slug: 'tisha_bav', match: /^Tish.a B.Av( \(observed\))?$/, en: "Tisha B'Av", he: 'תשעה באב', category: 'religious' },
  { slug: 'tu_bav', match: /^Tu B.Av$/, en: "Tu B'Av", he: 'ט״ו באב', category: 'observance' },
];

/**
 * Sammelt aus Hebcal-Items (beliebig viele Jahre) pro Slug die Termine
 * `{ [year]: 'MM-DD' }`. Nur `category: 'holiday'`-Items werden betrachtet.
 * Bei mehreren Treffern pro Jahr (sollte nicht vorkommen) gewinnt der frueheste.
 */
export function collectIsraelDates(items) {
  const bySlug = new Map(ISRAEL_HOLIDAYS.map((h) => [h.slug, {}]));
  for (const item of items) {
    if (item?.category !== 'holiday' || typeof item.title !== 'string') continue;
    const m = /^(\d{4})-(\d{2}-\d{2})/.exec(String(item.date ?? ''));
    if (!m) continue;
    const [, year, mmdd] = m;
    for (const h of ISRAEL_HOLIDAYS) {
      if (!h.match.test(item.title)) continue;
      const years = bySlug.get(h.slug);
      if (years[year] == null || mmdd < years[year]) years[year] = mmdd;
    }
  }
  return bySlug;
}

/**
 * Baut Definitionen + Labels (en, he) fuer das IL-Paket. Slugs ohne einen
 * einzigen Termin werden ausgelassen und in `missing` gemeldet; Slugs, denen
 * einzelne Jahre fehlen, landen in `gaps` (der Build warnt, bricht aber nicht ab).
 */
export function buildIsraelDefinitions(items, { countryCode = 'IL' } = {}) {
  const bySlug = collectIsraelDates(items);
  const expectedYears = new Set(
    items.map((i) => /^(\d{4})/.exec(String(i?.date ?? ''))?.[1]).filter(Boolean),
  );

  const definitions = [];
  const labels = { en: {}, he: {} };
  const missing = [];
  const gaps = [];

  for (const h of ISRAEL_HOLIDAYS) {
    const years = bySlug.get(h.slug);
    const found = Object.keys(years);
    if (found.length === 0) {
      missing.push(h.slug);
      continue;
    }
    if (found.length < expectedYears.size) {
      gaps.push(`${h.slug} (${found.length}/${expectedYears.size} Jahre)`);
    }

    definitions.push({
      id: `${countryCode}_${h.slug}`,
      countryCode,
      slug: h.slug,
      category: h.category,
      rule: detectRule({ years }),
    });
    labels.en[h.slug] = h.en;
    labels.he[h.slug] = h.he;
  }

  return { definitions, labels, missing, gaps };
}
