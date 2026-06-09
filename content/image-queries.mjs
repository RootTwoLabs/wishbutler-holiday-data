/**
 * Wikimedia Commons / Openverse search terms per holiday slug.
 * Derived from wishbutler_app/scripts/fetch-holiday-images.cjs.
 *
 * Global slugs: { terms: string[] }
 * Country-namespaced: { '<CC>': { terms: string[] } } or nested under slug key.
 */

/** @type {Record<string, string[] | Record<string, string[]>>} */
export const IMAGE_QUERIES = {
  // --- global ---
  new_year: ['New Year fireworks night sky'],
  valentines_day: ['red roses heart valentine bouquet'],
  womens_day: ['mimosa flowers international womens day'],
  halloween: ['jack o lantern halloween pumpkin'],
  new_years_eve: [
    'fireworks city skyline night',
    'New Year fireworks celebration',
    'champagne glasses toast celebration',
    'sparklers night party',
  ],
  good_friday: [
    'wooden cross hill sky',
    'crucifix church',
    'cross silhouette sunset',
    'Jesus crucifixion painting',
    'Good Friday procession',
  ],
  easter_monday: ['easter eggs basket spring'],
  easter_sunday: ['easter eggs decoration colorful'],
  labour_day: ['workers solidarity may day'],
  mothers_day: ['mothers day flowers bouquet pink'],
  fathers_day: ['father child happy outdoors'],
  whit_monday: [
    'Pentecost stained glass window',
    'white dove sky',
    'Holy Spirit dove flames',
    'Pentecost church',
    'dove flying blue sky',
  ],
  ascension: ['sky clouds sunshine landscape'],
  christmas_eve: ['Christmas tree lights decoration'],
  christmas: ['Christmas tree presents'],
  boxing_day: ['Christmas presents wrapped gifts'],
  epiphany: ['three kings nativity scene'],
  corpus_christi: ['corpus christi procession catholic'],
  assumption: ['Assumption Mary statue church'],
  immaculate_conception: ['Mary statue immaculate conception'],
  all_saints_day: ['cemetery candles all saints'],
  nameday: ['name day flower bouquet'],

  // --- country-namespaced ---
  german_unity_day: {
    DE: ['German Unity Day Reichstag Berlin', 'Brandenburg Gate Berlin'],
  },
  national_holiday: {
    AT: ['flag of Austria', 'Austrian national day celebration'],
  },
  swiss_national_day: {
    CH: ['flag of Switzerland mountain', 'Swiss national day fireworks'],
  },
  martin_luther_king_jr_day: {
    US: ['Martin Luther King portrait', 'Martin Luther King memorial Washington'],
  },
  presidents_day: {
    US: ['George Washington portrait', 'Mount Rushmore'],
  },
  memorial_day: {
    US: ['arlington cemetery flag american', 'memorial day american flag'],
  },
  independence_day: {
    US: ['American flag fireworks july 4', 'Independence Day USA celebration'],
    PL: ['Warsaw Polish Independence Day', 'flag of Poland Warsaw'],
  },
  labour_day_us: {
    US: ['American workers labor day parade'],
  },
  thanksgiving_day: {
    US: ['roast turkey thanksgiving dinner', 'thanksgiving harvest table'],
  },
  early_may_bank_holiday: {
    GB: ['spring blossom may flowers UK', 'maypole dancing England'],
  },
  spring_bank_holiday: {
    GB: ['English garden spring', 'spring flowers UK countryside'],
  },
  summer_bank_holiday: {
    GB: ['British seaside beach summer', 'UK summer holiday beach'],
  },
  constitution_day: {
    PL: ['flag of Poland Warsaw', 'Polish constitution day'],
  },
};

/** Resolves search terms for a slug, optionally scoped to a country. */
export function termsForSlug(slug, countryCode = null) {
  const entry = IMAGE_QUERIES[slug];
  if (!entry) return [];
  if (Array.isArray(entry)) return entry;
  if (countryCode && entry[countryCode]) return entry[countryCode];
  const first = Object.values(entry)[0];
  return Array.isArray(first) ? first : [];
}

/** Lists all image fetch targets: { slug, countryCode? }. */
export function listImageTargets() {
  const targets = [];
  for (const [slug, entry] of Object.entries(IMAGE_QUERIES)) {
    if (Array.isArray(entry)) {
      targets.push({ slug, countryCode: null });
    } else {
      for (const cc of Object.keys(entry)) {
        targets.push({ slug, countryCode: cc });
      }
    }
  }
  return targets;
}
