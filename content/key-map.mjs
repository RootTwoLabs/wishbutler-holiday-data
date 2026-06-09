/**
 * Maps bundled app article keys to holiday-data slugs.
 *
 * Global articles live in content/articles/<locale>.json and are shared across
 * all countries that define the slug. Country-specific articles live in
 * content/articles/<CC>/<locale>.json.
 */

/** App articleKey -> holiday-data slug (global, shared across countries). */
export const GLOBAL_ARTICLE_MAP = {
  new_year: 'new_year',
  valentines_day: 'valentines_day',
  womens_day: 'womens_day',
  halloween: 'halloween',
  new_years_eve: 'new_years_eve',
  good_friday: 'good_friday',
  easter_monday: 'easter_monday',
  easter_sunday: 'easter_sunday',
  labour_day: 'labour_day',
  mothers_day: 'mothers_day',
  fathers_day: 'fathers_day',
  fathers_day_de: 'fathers_day',
  whit_monday: 'whit_monday',
  ascension: 'ascension',
  christmas_eve: 'christmas_eve',
  christmas: 'christmas',
  boxing_day: 'boxing_day',
  st_stephen: 'boxing_day',
  epiphany: 'epiphany',
  corpus_christi: 'corpus_christi',
  assumption: 'assumption',
  immaculate_conception: 'immaculate_conception',
  all_saints: 'all_saints_day',
  nameday: 'nameday',
};

/**
 * App articleKey -> { slug, countryCode } for country-specific articles.
 * These are stored under content/articles/<CC>/<locale>.json.
 */
export const COUNTRY_ARTICLE_MAP = {
  german_unity: { slug: 'german_unity_day', countryCode: 'DE' },
  at_national_holiday: { slug: 'national_holiday', countryCode: 'AT' },
  ch_national_holiday: { slug: 'swiss_national_day', countryCode: 'CH' },
  mlk_day: { slug: 'martin_luther_king_jr_day', countryCode: 'US' },
  presidents_day: { slug: 'presidents_day', countryCode: 'US' },
  memorial_day: { slug: 'memorial_day', countryCode: 'US' },
  independence_day: { slug: 'independence_day', countryCode: 'US' },
  labor_day: { slug: 'labour_day_us', countryCode: 'US' },
  thanksgiving: { slug: 'thanksgiving_day', countryCode: 'US' },
  early_may_bank: { slug: 'early_may_bank_holiday', countryCode: 'GB' },
  spring_bank: { slug: 'spring_bank_holiday', countryCode: 'GB' },
  summer_bank: { slug: 'summer_bank_holiday', countryCode: 'GB' },
  mothers_day_uk: { slug: 'mothers_day', countryCode: 'GB' },
  pl_constitution: { slug: 'constitution_day', countryCode: 'PL' },
  pl_independence: { slug: 'independence_day', countryCode: 'PL' },
};

/** Slugs whose images and articles are namespaced per country. */
export const NAMESPACED_SLUGS = new Set([
  'german_unity_day',
  'national_holiday',
  'swiss_national_day',
  'martin_luther_king_jr_day',
  'presidents_day',
  'memorial_day',
  'independence_day',
  'labour_day_us',
  'thanksgiving_day',
  'early_may_bank_holiday',
  'spring_bank_holiday',
  'summer_bank_holiday',
  'constitution_day',
]);

/** Locales we ship article content for. */
export const CONTENT_LOCALES = ['de', 'en', 'fr', 'es', 'pt', 'it', 'pl'];

/** Returns all country codes that own a namespaced slug. */
export function countriesForNamespacedSlug(slug) {
  const out = [];
  for (const entry of Object.values(COUNTRY_ARTICLE_MAP)) {
    if (entry.slug === slug) out.push(entry.countryCode);
  }
  return [...new Set(out)];
}

/** Returns the sole owner of a namespaced slug, or null if shared/global. */
export function countryForNamespacedSlug(slug) {
  const all = countriesForNamespacedSlug(slug);
  return all.length === 1 ? all[0] : null;
}

/** Normalizes a raw app article object to the holiday-data schema shape. */
export function normalizeArticle(raw) {
  const funFacts = Array.isArray(raw.funFacts)
    ? raw.funFacts.filter((s) => typeof s === 'string' && s.length > 0)
    : [];
  const article = {
    intro: String(raw.intro ?? '').trim(),
    history: String(raw.history ?? '').trim(),
    traditions: String(raw.traditions ?? '').trim(),
    funFacts,
  };
  if (raw.imageCredit && String(raw.imageCredit).trim()) {
    article.imageCredit = String(raw.imageCredit).trim();
  }
  return article;
}
