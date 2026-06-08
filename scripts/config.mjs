/** Shared configuration for the data generators. */

/** Countries we build public-holiday packages for (extend freely). */
export const HOLIDAY_COUNTRIES = [
  'DE', 'AT', 'CH', 'GB', 'US', 'PL', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE',
  'SE', 'FI', 'NO', 'DK', 'IE', 'CZ', 'SK', 'HU', 'GR', 'BG', 'RO', 'HR',
  'LV', 'LT', 'EE', 'CA', 'AU', 'NZ', 'BR', 'MX', 'JP',
];

/** Countries that ship a nameday calendar (per product requirement). */
export const NAMEDAY_COUNTRIES = [
  'PL', 'HU', 'CZ', 'SK', 'GR', 'BG', 'RO', 'HR', 'LV', 'SE', 'FI',
  'FR', 'AT', 'IT', 'DE', 'ES',
];

/** Locales we try to provide i18n strings for. */
export const LOCALES = ['de', 'en', 'fr', 'es', 'pt', 'it', 'pl'];

/** Years to precompute for non-Gregorian / table-only feasts. */
export const PRECOMPUTE_FROM_YEAR = new Date().getFullYear();
export const PRECOMPUTE_YEARS = 10;

/** Data source endpoints. */
export const SOURCES = {
  nagerDate: (year, cc) => `https://date.nager.at/api/v3/PublicHolidays/${year}/${cc}`,
  openHolidays: 'https://openholidaysapi.org',
  // Calendarific requires an API key (set CALENDARIFIC_API_KEY in CI secrets).
  calendarific: (year, cc, key) =>
    `https://calendarific.com/api/v2/holidays?api_key=${key}&country=${cc}&year=${year}`,
  // abalin namedays.
  abalin: (cc) => `https://nameday.abalin.net/api/V1/getdata?country=${cc.toLowerCase()}`,
};
