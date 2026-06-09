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

  // --- Batch 2: FR, IT, ES, CA, BR, PT, MX, LU, IE ---
  fr_bastille_day: { slug: 'bastille_day', countryCode: 'FR' },
  fr_armistice_day: { slug: 'armistice_day', countryCode: 'FR' },
  it_republic_day: { slug: 'republic_day', countryCode: 'IT' },
  it_liberation_day: { slug: 'liberation_day', countryCode: 'IT' },
  es_national_day: { slug: 'national_day_of_spain', countryCode: 'ES' },
  es_constitution_day: { slug: 'constitution_day', countryCode: 'ES' },
  ca_canada_day: { slug: 'canada_day', countryCode: 'CA' },
  ca_remembrance_day: { slug: 'remembrance_day', countryCode: 'CA' },
  br_independence_day: { slug: 'independence_day', countryCode: 'BR' },
  br_carnival: { slug: 'carnival', countryCode: 'BR' },
  pt_national_day: { slug: 'national_day', countryCode: 'PT' },
  pt_freedom_day: { slug: 'freedom_day', countryCode: 'PT' },
  mx_independence_day: { slug: 'independence_day', countryCode: 'MX' },
  mx_revolution_day: { slug: 'revolution_day', countryCode: 'MX' },
  lu_national_day: { slug: 'sovereigns_birthday', countryCode: 'LU' },
  lu_europe_day: { slug: 'europe_day', countryCode: 'LU' },
  ie_st_patricks_day: { slug: 'saint_patricks_day', countryCode: 'IE' },
  ie_st_brigids_day: { slug: 'saint_brigids_day', countryCode: 'IE' },

  // --- Batch 3: NO, NL, DK, SE (English-language markets) ---
  no_constitution_day: { slug: 'constitution_day', countryCode: 'NO' },
  nl_kings_day: { slug: 'kings_day', countryCode: 'NL' },
  nl_liberation_day: { slug: 'liberation_day', countryCode: 'NL' },
  dk_constitution_day: { slug: 'constitution_day', countryCode: 'DK' },
  se_national_day: { slug: 'national_day_of_sweden', countryCode: 'SE' },
  se_midsummer_eve: { slug: 'midsummer_eve', countryCode: 'SE' },

  // --- Batch 4: AR, CL, CO (LATAM, Spanish-speaking) ---
  ar_independence_day: { slug: 'independence_day', countryCode: 'AR' },
  ar_may_revolution: { slug: 'may_revolution', countryCode: 'AR' },
  cl_national_holiday: { slug: 'national_holiday', countryCode: 'CL' },
  cl_navy_day: { slug: 'navy_day', countryCode: 'CL' },
  co_independence: { slug: 'declaration_of_independence', countryCode: 'CO' },
  co_boyaca: { slug: 'battle_of_boyaca', countryCode: 'CO' },

  // --- Batch 5: AU, NZ (English-speaking, high purchasing power) ---
  au_australia_day: { slug: 'australia_day', countryCode: 'AU' },
  au_anzac_day: { slug: 'anzac_day', countryCode: 'AU' },
  nz_waitangi_day: { slug: 'waitangi_day', countryCode: 'NZ' },
  nz_anzac_day: { slug: 'anzac_day', countryCode: 'NZ' },

  // --- Batch 6: SG (English-speaking, very high purchasing power) ---
  sg_national_day: { slug: 'national_day', countryCode: 'SG' },
  sg_chinese_new_year: { slug: 'chinese_new_year', countryCode: 'SG' },

  // --- Batch 7: Asia (HK, JP, KR) + top-ups (DE, AT, CH) ---
  hk_establishment_day: {
    slug: 'hong_kong_special_administrative_region_establishment_day',
    countryCode: 'HK',
  },
  hk_dragon_boat: { slug: 'dragon_boat_festival', countryCode: 'HK' },
  jp_foundation_day: { slug: 'foundation_day', countryCode: 'JP' },
  jp_coming_of_age_day: { slug: 'coming_of_age_day', countryCode: 'JP' },
  kr_chuseok: { slug: 'chuseok', countryCode: 'KR' },
  kr_hangul_day: { slug: 'hangul_day', countryCode: 'KR' },
  de_reformation_day: { slug: 'reformation_day', countryCode: 'DE' },
  at_saint_martins_day: { slug: 'saint_martins_day', countryCode: 'AT' },
  ch_st_berchtolds_day: { slug: 'st_berchtolds_day', countryCode: 'CH' },
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
  // Batch 2
  'bastille_day',
  'armistice_day',
  'republic_day',
  'liberation_day',
  'national_day_of_spain',
  'canada_day',
  'remembrance_day',
  'carnival',
  'national_day',
  'freedom_day',
  'revolution_day',
  'sovereigns_birthday',
  'europe_day',
  'saint_patricks_day',
  'saint_brigids_day',
  // Batch 3
  'kings_day',
  'national_day_of_sweden',
  'midsummer_eve',
  // Batch 4
  'may_revolution',
  'navy_day',
  'declaration_of_independence',
  'battle_of_boyaca',
  // Batch 5
  'australia_day',
  'anzac_day',
  'waitangi_day',
  // Batch 6
  'chinese_new_year',
  // Batch 7
  'hong_kong_special_administrative_region_establishment_day',
  'dragon_boat_festival',
  'foundation_day',
  'coming_of_age_day',
  'chuseok',
  'hangul_day',
  'reformation_day',
  'saint_martins_day',
  'st_berchtolds_day',
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
