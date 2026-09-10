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
  fathers_day_de: 'fathers_day_de',
  whit_monday: 'whit_monday',
  ascension: 'ascension',
  christmas_eve: 'christmas_eve',
  christmas: 'christmas',
  boxing_day: 'boxing_day',
  st_stephen: 'st_stephen',
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
  // September 2026 content expansion
  us_juneteenth_national_independence_day: { slug: 'juneteenth_national_independence_day', countryCode: 'US' },
  us_veterans_day: { slug: 'veterans_day', countryCode: 'US' },
  fr_victory_in_europe_day: { slug: 'victory_in_europe_day', countryCode: 'FR' },
  fi_independence_day: { slug: 'independence_day', countryCode: 'FI' },
  fi_midsummer_day: { slug: 'midsummer_day', countryCode: 'FI' },
  jp_childrens_day: { slug: 'childrens_day', countryCode: 'JP' },
  jp_constitution_memorial_day: { slug: 'constitution_memorial_day', countryCode: 'JP' },
  jp_culture_day: { slug: 'culture_day', countryCode: 'JP' },
  kr_lunar_new_year: { slug: 'lunar_new_year', countryCode: 'KR' },
  kr_liberation_day: { slug: 'liberation_day', countryCode: 'KR' },
  cn_chinese_new_year_spring_festival: { slug: 'chinese_new_year_spring_festival', countryCode: 'CN' },
  cn_mid_autumn_festival: { slug: 'mid_autumn_festival', countryCode: 'CN' },
  cn_national_day: { slug: 'national_day', countryCode: 'CN' },
  sg_deepavali: { slug: 'deepavali', countryCode: 'SG' },
  sg_vesak_day: { slug: 'vesak_day', countryCode: 'SG' },
  ua_independence_day: { slug: 'independence_day', countryCode: 'UA' },
  gr_independence_day: { slug: 'independence_day', countryCode: 'GR' },
  gr_ochi_day: { slug: 'ochi_day', countryCode: 'GR' },
  cz_independent_czechoslovak_state_day: { slug: 'independent_czechoslovak_state_day', countryCode: 'CZ' },
  br_our_lady_of_aparecida: { slug: 'our_lady_of_aparecida', countryCode: 'BR' },
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
  // --- Batch 8: Israel (Hebcal), TR, EG, DACH-Luecken, CA/AU/NZ ---
  il_rosh_hashanah: { slug: 'rosh_hashanah', countryCode: 'IL' },
  il_yom_kippur: { slug: 'yom_kippur', countryCode: 'IL' },
  il_sukkot: { slug: 'sukkot', countryCode: 'IL' },
  il_hanukkah: { slug: 'hanukkah', countryCode: 'IL' },
  il_purim: { slug: 'purim', countryCode: 'IL' },
  il_passover: { slug: 'passover', countryCode: 'IL' },
  il_yom_haatzmaut: { slug: 'yom_haatzmaut', countryCode: 'IL' },
  il_shavuot: { slug: 'shavuot', countryCode: 'IL' },
  de_world_childrens_day: { slug: 'world_childrens_day', countryCode: 'DE' },
  de_repentance_and_prayer_day: { slug: 'repentance_and_prayer_day', countryCode: 'DE' },
  at_saint_florians_day: { slug: 'saint_florians_day', countryCode: 'AT' },
  at_saint_ruperts_day: { slug: 'saint_ruperts_day', countryCode: 'AT' },
  at_saint_leopolds_day: { slug: 'saint_leopolds_day', countryCode: 'AT' },
  ch_republic_day: { slug: 'republic_day', countryCode: 'CH' },
  ch_nafels_procession: { slug: 'nafels_procession', countryCode: 'CH' },
  ch_geneva_prayday: { slug: 'geneva_prayday', countryCode: 'CH' },
  ch_federal_day_of_thanksgiving: { slug: 'federal_day_of_thanksgiving', countryCode: 'CH' },
  ch_federal_fast_monday: { slug: 'federal_fast_monday', countryCode: 'CH' },
  ch_restoration_day: { slug: 'restoration_day', countryCode: 'CH' },
  ca_family_day: { slug: 'family_day', countryCode: 'CA' },
  ca_victoria_day: { slug: 'victoria_day', countryCode: 'CA' },
  ca_national_aboriginal_day: { slug: 'national_aboriginal_day', countryCode: 'CA' },
  ca_national_holiday: { slug: 'national_holiday', countryCode: 'CA' },
  ca_civic_holiday: { slug: 'civic_holiday', countryCode: 'CA' },
  ca_labour_day: { slug: 'labour_day_ca', countryCode: 'CA' },
  ca_truth_and_reconciliation: {
    slug: 'national_day_for_truth_and_reconciliation',
    countryCode: 'CA',
  },
  ca_thanksgiving: { slug: 'thanksgiving', countryCode: 'CA' },
  au_labour_day: { slug: 'labour_day_au', countryCode: 'AU' },
  au_kings_birthday: { slug: 'kings_birthday', countryCode: 'AU' },
  au_melbourne_cup: { slug: 'melbourne_cup', countryCode: 'AU' },
  au_western_australia_day: { slug: 'western_australia_day', countryCode: 'AU' },
  au_canberra_day: { slug: 'canberra_day', countryCode: 'AU' },
  au_afl_grand_final_friday: { slug: 'friday_before_afl_grand_final', countryCode: 'AU' },
  nz_matariki: { slug: 'matariki', countryCode: 'NZ' },
  nz_kings_birthday: { slug: 'kings_birthday', countryCode: 'NZ' },
  nz_labour_day: { slug: 'labour_day_nz', countryCode: 'NZ' },
  nz_auckland_anniversary: { slug: 'auckland_anniversary_day', countryCode: 'NZ' },
  nz_wellington_anniversary: { slug: 'wellington_anniversary_day', countryCode: 'NZ' },
  nz_nelson_anniversary: { slug: 'nelson_anniversary_day', countryCode: 'NZ' },
  nz_taranaki_anniversary: { slug: 'taranaki_anniversary_day', countryCode: 'NZ' },
  nz_otago_anniversary: { slug: 'otago_anniversary_day', countryCode: 'NZ' },
  nz_southland_anniversary: { slug: 'southland_anniversary_day', countryCode: 'NZ' },
  nz_canterbury_south_anniversary: { slug: 'canterbury_south_anniversary_day', countryCode: 'NZ' },
  nz_hawkes_bay_anniversary: { slug: 'hawkes_bay_anniversary_day', countryCode: 'NZ' },
  nz_marlborough_anniversary: { slug: 'marlborough_anniversary_day', countryCode: 'NZ' },
  nz_canterbury_anniversary: { slug: 'canterbury_anniversary_day', countryCode: 'NZ' },
  nz_chatham_islands_anniversary: { slug: 'chatham_islands_anniversary_day', countryCode: 'NZ' },
  nz_westland_anniversary: { slug: 'westland_anniversary_day', countryCode: 'NZ' },
  tr_eid_al_fitr: { slug: 'eid_al_fitr_first_day', countryCode: 'TR' },
  tr_eid_al_adha: { slug: 'eid_al_adha_first_day', countryCode: 'TR' },
  tr_childrens_day: { slug: 'national_independence_childrens_day', countryCode: 'TR' },
  tr_youth_day: { slug: 'ataturk_commemoration_youth_day', countryCode: 'TR' },
  tr_democracy_day: { slug: 'democracy_and_national_unity_day', countryCode: 'TR' },
  tr_victory_day: { slug: 'victory_day', countryCode: 'TR' },
  tr_republic_day: { slug: 'republic_day', countryCode: 'TR' },
  eg_eid_al_adha: { slug: 'eid_al_adha', countryCode: 'EG' },
  eg_islamic_new_year: { slug: 'islamic_new_year', countryCode: 'EG' },
  eg_mawlid: { slug: 'prophet_muhammads_birthday', countryCode: 'EG' },
  eg_sinai_liberation_day: { slug: 'sinai_liberation_day', countryCode: 'EG' },
  eg_revolution_day: { slug: 'revolution_day', countryCode: 'EG' },
  eg_june_30_revolution: { slug: 'june_30_revolution', countryCode: 'EG' },
  eg_armed_forces_day: { slug: 'armed_forces_day', countryCode: 'EG' },
  eg_police_day: { slug: 'revolution_day_2011_national_police_day', countryCode: 'EG' },
  eg_sham_el_nessim: { slug: 'easter_monday_eg', countryCode: 'EG' },
};

/**
 * Alias-Slugs -> kanonischer Slug. Nager liefert fuer viele Laender eine
 * "observed"-Variante (christmas_day neben christmas), Folgetage mehrtaegiger
 * Feste (eid_al_adha_second_day) und "(Tentative Date)"-Varianten fuer die
 * Folgejahre. Die tragen denselben Inhalt wie der kanonische Slug und
 * bekommen dessen Artikel + Bilder, statt leer zu bleiben.
 */
export const ARTICLE_ALIASES = {
  christmas_day: 'christmas',
  new_years_day: 'new_year',
  st_stephens_day: 'boxing_day',
  boxing_day_nz: 'boxing_day',
  labour_day_eg: 'labour_day',
};

/** Kanonischer Artikel-Slug fuer einen Paket-Slug (Identitaet, wenn kein Alias). */
export function canonicalArticleSlug(slug) {
  if (ARTICLE_ALIASES[slug]) return ARTICLE_ALIASES[slug];
  return slug
    .replace(/_tentative_date$/, '')
    .replace(/_(second|third|fourth|fifth)_day$/, '_first_day');
}

/** Slugs whose images and articles are namespaced per country. */
export const NAMESPACED_SLUGS = new Set([
  'juneteenth_national_independence_day',
  'veterans_day',
  'victory_in_europe_day',
  'midsummer_day',
  'childrens_day',
  'constitution_memorial_day',
  'culture_day',
  'lunar_new_year',
  'chinese_new_year_spring_festival',
  'mid_autumn_festival',
  'deepavali',
  'vesak_day',
  'ochi_day',
  'independent_czechoslovak_state_day',
  'our_lady_of_aparecida',
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
  // Batch 8 (IL, DACH, CA, AU, NZ, TR, EG)
  'rosh_hashanah',
  'yom_kippur',
  'sukkot',
  'hanukkah',
  'purim',
  'passover',
  'yom_haatzmaut',
  'shavuot',
  'world_childrens_day',
  'repentance_and_prayer_day',
  'saint_florians_day',
  'saint_ruperts_day',
  'saint_leopolds_day',
  'nafels_procession',
  'geneva_prayday',
  'federal_day_of_thanksgiving',
  'federal_fast_monday',
  'restoration_day',
  'family_day',
  'victoria_day',
  'national_aboriginal_day',
  'civic_holiday',
  'labour_day_ca',
  'national_day_for_truth_and_reconciliation',
  'thanksgiving',
  'labour_day_au',
  'kings_birthday',
  'melbourne_cup',
  'western_australia_day',
  'canberra_day',
  'friday_before_afl_grand_final',
  'matariki',
  'labour_day_nz',
  'auckland_anniversary_day',
  'wellington_anniversary_day',
  'nelson_anniversary_day',
  'taranaki_anniversary_day',
  'otago_anniversary_day',
  'southland_anniversary_day',
  'canterbury_south_anniversary_day',
  'hawkes_bay_anniversary_day',
  'marlborough_anniversary_day',
  'canterbury_anniversary_day',
  'chatham_islands_anniversary_day',
  'westland_anniversary_day',
  'eid_al_fitr_first_day',
  'eid_al_adha_first_day',
  'national_independence_childrens_day',
  'ataturk_commemoration_youth_day',
  'democracy_and_national_unity_day',
  'victory_day',
  'eid_al_adha',
  'islamic_new_year',
  'prophet_muhammads_birthday',
  'sinai_liberation_day',
  'june_30_revolution',
  'armed_forces_day',
  'revolution_day_2011_national_police_day',
  'easter_monday_eg',
]);

/** Locales we ship article content for. */
export const CONTENT_LOCALES = ['de', 'en', 'fr', 'es', 'pt', 'it', 'pl', 'nl', 'sv', 'nb', 'da', 'fi', 'ru', 'uk', 'ja', 'ko', 'zh-Hant'];

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
