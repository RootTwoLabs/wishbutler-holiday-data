/** Shared configuration for the data generators. */

/**
 * Countries we build public-holiday packages for. This is the full set Nager.Date
 * exposes (https://date.nager.at/api/v3/AvailableCountries); countries that return
 * no holidays are skipped automatically by the generator.
 *
 * Israel (IL) is NOT on this list: neither Nager.Date nor OpenHolidays know it.
 * Its package is generated separately from Hebcal (fetch-holidays-hebcal.mjs,
 * curated list in lib/hebcalHolidays.mjs).
 */
export const HOLIDAY_COUNTRIES = [
  // Europe
  'AD', 'AL', 'AT', 'AX', 'BA', 'BE', 'BG', 'BY', 'CH', 'CY', 'CZ', 'DE',
  'DK', 'EE', 'ES', 'FI', 'FO', 'FR', 'GB', 'GG', 'GI', 'GR', 'HR', 'HU',
  'IE', 'IM', 'IS', 'IT', 'JE', 'LI', 'LT', 'LU', 'LV', 'MC', 'MD', 'ME',
  'MK', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'RS', 'RU', 'SE', 'SI', 'SJ',
  'SK', 'SM', 'UA', 'VA',
  // North & Central America + Caribbean
  'BB', 'BS', 'BZ', 'CA', 'CR', 'CU', 'DO', 'GD', 'GT', 'HN', 'HT',
  'JM', 'MS', 'MX', 'NI', 'PA', 'PR', 'SV', 'US',
  // South America
  'AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'GY', 'PE', 'PY', 'SR', 'UY', 'VE',
  // Africa
  'AO', 'BJ', 'BW', 'CD', 'CG', 'EG', 'GA', 'GH', 'GM', 'KE', 'LS', 'MA',
  'MG', 'MZ', 'NA', 'NE', 'NG', 'SC', 'TN', 'UG', 'ZA', 'ZW',
  // Asia & Oceania
  'AM', 'AU', 'BD', 'CN', 'GE', 'GL', 'HK', 'ID', 'JP', 'KR', 'KZ', 'MN',
  'NZ', 'PG', 'PH', 'SG', 'TR', 'VN',
];

/** Countries that ship a nameday calendar (per product requirement). */
export const NAMEDAY_COUNTRIES = [
  'PL', 'HU', 'CZ', 'SK', 'GR', 'BG', 'RO', 'HR', 'LV', 'SE', 'FI',
  'FR', 'AT', 'IT', 'DE', 'ES',
];

/** Locales we try to provide i18n strings for. */
export const LOCALES = ['de', 'en', 'fr', 'es', 'pt', 'it', 'pl', 'nl', 'sv', 'nb', 'da', 'fi', 'ru', 'uk', 'ja', 'ko', 'zh-Hant'];

/**
 * Maps a country to the locale of its `localName` field from Nager.Date.
 * Used to emit native-language holiday labels alongside the English ones.
 * English (`name`) is always emitted under `en`; unmapped countries get `en` only.
 */
export const COUNTRY_LOCALE = {
  AD: 'ca', AL: 'sq', AM: 'hy', AO: 'pt', AR: 'es', AT: 'de', AU: 'en',
  AX: 'sv', AG: 'en', BA: 'bs', BB: 'en', BD: 'bn', BE: 'nl', BG: 'bg',
  BJ: 'fr', BO: 'es', BR: 'pt', BS: 'en', BW: 'en', BY: 'be', BZ: 'en',
  CA: 'en', CD: 'fr', CG: 'fr', CH: 'de', CL: 'es', CN: 'zh', CO: 'es',
  CR: 'es', CU: 'es', CY: 'el', CZ: 'cs', DE: 'de', DK: 'da', DO: 'es',
  EC: 'es', EE: 'et', EG: 'ar', ES: 'es', FI: 'fi', FO: 'fo', FR: 'fr',
  GA: 'fr', GB: 'en', GD: 'en', GE: 'ka', GG: 'en', GH: 'en', GI: 'en',
  GL: 'kl', GM: 'en', GR: 'el', GT: 'es', GY: 'en', HK: 'zh', HN: 'es',
  HR: 'hr', HT: 'fr', HU: 'hu', ID: 'id', IE: 'en', IL: 'he', IM: 'en', IS: 'is',
  IT: 'it', JE: 'en', JM: 'en', JP: 'ja', KE: 'en', KR: 'ko', KZ: 'kk',
  LI: 'de', LS: 'en', LT: 'lt', LU: 'fr', LV: 'lv', MA: 'ar', MC: 'fr',
  MD: 'ro', ME: 'sr', MG: 'mg', MK: 'mk', MN: 'mn', MS: 'en', MT: 'mt',
  MX: 'es', MZ: 'pt', NA: 'en', NE: 'fr', NG: 'en', NI: 'es', NL: 'nl',
  NO: 'nb', NZ: 'en', PA: 'es', PE: 'es', PG: 'en', PH: 'en', PL: 'pl',
  PR: 'es', PT: 'pt', PY: 'es', RO: 'ro', RS: 'sr', RU: 'ru', SC: 'en',
  SE: 'sv', SG: 'en', SI: 'sl', SJ: 'nb', SK: 'sk', SM: 'it', SR: 'nl',
  SV: 'es', TN: 'ar', TR: 'tr', UA: 'uk', UG: 'en', US: 'en', UY: 'es',
  VA: 'it', VE: 'es', VN: 'vi', ZA: 'en', ZW: 'en',
};

/** Resolves the native locale for a country, defaulting to English. */
export function localeForCountry(cc) {
  return COUNTRY_LOCALE[cc] ?? 'en';
}

/**
 * Canonical "global" holidays already bundled in the app (in every UI language
 * with curated articles). When a generated holiday matches one of these by both
 * an alias AND the exact rule, we emit it under the global labelKey so the app
 * deduplicates it and reuses the bundled translations/articles instead of
 * showing a country-specific duplicate.
 *
 * The rule match is essential: e.g. "Labour Day" is May 1st globally but a
 * different (movable) day in NZ/US, so name alone must never trigger the merge.
 */
export const GLOBAL_RULES = {
  new_year: { type: 'fixed', month: 1, day: 1 },
  epiphany: { type: 'fixed', month: 1, day: 6 },
  valentines_day: { type: 'fixed', month: 2, day: 14 },
  womens_day: { type: 'fixed', month: 3, day: 8 },
  good_friday: { type: 'easter_relative', offsetDays: -2 },
  easter_monday: { type: 'easter_relative', offsetDays: 1 },
  ascension: { type: 'easter_relative', offsetDays: 39 },
  whit_monday: { type: 'easter_relative', offsetDays: 50 },
  corpus_christi: { type: 'easter_relative', offsetDays: 60 },
  labour_day: { type: 'fixed', month: 5, day: 1 },
  assumption: { type: 'fixed', month: 8, day: 15 },
  halloween: { type: 'fixed', month: 10, day: 31 },
  christmas: { type: 'fixed', month: 12, day: 25 },
  boxing_day: { type: 'fixed', month: 12, day: 26 },
  new_years_eve: { type: 'fixed', month: 12, day: 31 },
};

/** Nager-name slugs that should resolve to a canonical global labelKey. */
export const HOLIDAY_SLUG_ALIASES = {
  new_years_day: 'new_year',
  three_kings_day: 'epiphany',
  christmas_day: 'christmas',
  first_christmas_day: 'christmas',
  st_stephens_day: 'boxing_day',
  second_christmas_day: 'boxing_day',
  second_day_of_christmas: 'boxing_day',
  ascension_day: 'ascension',
  ascension_of_jesus: 'ascension',
  assumption_day: 'assumption',
  assumption_of_mary: 'assumption',
  assumption_of_the_virgin_mary: 'assumption',
  international_womens_day: 'womens_day',
  may_day: 'labour_day',
  new_years_eve: 'new_years_eve',
};

/**
 * Nager benennt denselben Anlass in einzelnen Jahren anders (PE 2031/2033:
 * "International Workers' Day" + "Holy Thursday", alle anderen Jahre "Labour
 * Day" + "Maundy Thursday"). Ohne Abgleich zerfaellt der Anlass in ZWEI
 * `precomputed`-Definitionen mit Jahresluecken (wie bei G-6 "(tentative
 * date)"). Der Abgleich bildet den neuen Namen auf den bisherigen ab, damit
 * die etablierte ID samt 17-Sprachen-Label bestehen bleibt. Nur je Land, nur
 * fuer belegte Faelle — kein globales Synonymwoerterbuch.
 */
export const NAGER_NAME_ALIASES = {
  PE: {
    'Labour Day': "International Workers' Day",
    'Maundy Thursday': 'Holy Thursday',
  },
};

/**
 * G-5: Vollstaendige Regionsmengen. Nager listet manche Feiertage je
 * Landesteil, obwohl JEDER Landesteil sie hat (GB New Year's Day und Summer
 * Bank Holiday in allen vier Nationen, AU King's Birthday in allen acht
 * Bundesstaaten/Territorien). Deckt die vereinigte Regionsmenge einer
 * Definition das Full-Set ab, ist der Anlass landesweit und traegt KEIN
 * `regions` — sonst behandelt die App ihn als „regional" ohne Vorauswahl.
 * Kuratiert (nicht aus Nager abgeleitet: Nager kennt z. B. fuer BA nur 2 von
 * 3 Entitaeten, fuer PT nur die 2 Inselregionen); nur Laender, bei denen
 * der Fall tatsaechlich auftritt. Codes gegen die Nager-Antworten geprueft.
 */
export const NAGER_FULL_REGION_SETS = {
  GB: ['GB-ENG', 'GB-NIR', 'GB-SCT', 'GB-WLS'],
  AU: ['AU-ACT', 'AU-NSW', 'AU-NT', 'AU-QLD', 'AU-SA', 'AU-TAS', 'AU-VIC', 'AU-WA'],
};

/** Loest einen Nager-Namen ueber NAGER_NAME_ALIASES auf (unveraendert, wenn kein Eintrag). */
export function canonicalNagerName(cc, name) {
  return NAGER_NAME_ALIASES[cc]?.[name] ?? name;
}

/**
 * Regionale Aufspaltung: Nager fuehrt manche Anlaesse unter EINEM Namen mit
 * zwei verschiedenen Terminen je Landesteil. GB „Summer Bank Holiday": erster
 * Montag im August in Schottland (`GB-SCT`), letzter Montag im August in
 * England/Wales/Nordirland. Ohne Aufspaltung landen beide Zeilen in einer
 * Definition — der letzte Eintrag gewinnt (letzter Montag), die Regionen
 * vereinigen sich zum Full-Set, und Schottland bekommt landesweit den falschen
 * Tag.
 *
 * Eine Nager-Zeile wandert in die Split-Definition, wenn ALLE ihre `counties`
 * in `counties` des Splits liegen (`regionalSplitName` in lib/nagerScope.mjs).
 * Der Rest behaelt Name und damit die etablierte ID (`GB_summer_bank_holiday`,
 * jetzt mit `regions` ENG/NIR/WLS); der Split bekommt ueber `name` eine neue ID
 * (`GB_summer_bank_holiday_scotland`). `name` ist zugleich das englische Label;
 * Labels fuer alle 17 Sprachen liegen in content/holiday-labels/, Artikel und
 * Bilder kommen ueber ARTICLE_ALIASES (content/key-map.mjs) vom Hauptanlass.
 *
 * `rule` ist die erwartete geschlossene Regel: Sie dient der Offline-Migration
 * (scripts/migrate-regional-splits.mjs — das Paket kennt die Split-Termine
 * nicht) und als Gegenprobe im Fetch (Warnung, wenn Nager etwas anderes
 * liefert). Massgeblich bleibt im Fetch die aus Nager erkannte Regel.
 * Nur je Land, nur fuer belegte Faelle.
 */
export const NAGER_REGIONAL_SPLITS = {
  GB: {
    'Summer Bank Holiday': [
      {
        counties: ['GB-SCT'],
        name: 'Summer Bank Holiday (Scotland)',
        // Bank Holidays Act 1871 / Banking and Financial Dealings Act 1971, Sched. 1:
        // Schottland erster Montag im August (weekday 1 = Montag).
        rule: { type: 'nth_weekday', month: 8, nth: 1, weekday: 1 },
      },
    ],
  },
};

/** Years to precompute for non-Gregorian / table-only feasts. */
export const PRECOMPUTE_FROM_YEAR = new Date().getFullYear();
export const PRECOMPUTE_YEARS = 10;

/** Data source endpoints. */
export const SOURCES = {
  nagerDate: (year, cc) => `https://date.nager.at/api/v3/PublicHolidays/${year}/${cc}`,
  openHolidays: 'https://openholidaysapi.org',
  // Hebcal (Israel): keyless JSON, Israel-Schema (`i=on`), Haupt-/Neben-/moderne
  // Feiertage, ohne Rosh Chodesh, Schabbat-/Parascha-Eintraege und Kerzenzeiten.
  hebcal: (year) =>
    `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&month=x&i=on` +
    '&maj=on&min=on&mod=on&nx=off&ss=off&mf=off&c=off&d=off&lg=s',
  // abalin namedays: V2/date returns all countries for a given day at once.
  abalinDate: (day, month) =>
    `https://nameday.abalin.net/api/V2/date?day=${day}&month=${month}`,
};
