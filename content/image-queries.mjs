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
    BR: ['Brazil Independence Day parade Brasilia', 'Brazilian flag Sete de Setembro'],
    MX: ['Mexico Independence Day Zocalo flag', 'Mexican flag independence celebration'],
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
    ES: ['Spanish Constitution day Congreso Madrid', 'flag of Spain Madrid'],
    NO: ['Norway Constitution Day 17 May children parade bunad', 'Norwegian flag syttende mai Oslo'],
    DK: ['Denmark Constitution Day Grundlovsdag', 'Danish flag Dannebrog gathering'],
  },

  // --- Batch 2: FR, IT, ES, CA, BR, PT, MX, LU, IE ---
  bastille_day: {
    FR: ['Bastille Day fireworks Eiffel Tower', '14 July military parade Champs-Elysees Paris'],
  },
  armistice_day: {
    FR: ['Arc de Triomphe tomb unknown soldier Paris', 'Armistice Day 11 November wreath'],
  },
  republic_day: {
    IT: ['Festa della Repubblica parade Rome', 'Frecce Tricolori Italian flag flyover'],
  },
  liberation_day: {
    IT: ['Festa della Liberazione Italy 25 April', 'Italian partisans liberation memorial'],
    NL: [
      'Bevrijdingsdag Netherlands',
      'Netherlands Liberation Day 5 May festival',
      'Dutch liberation festival crowd',
      'Wageningen liberation parade Netherlands',
    ],
  },
  national_day_of_spain: {
    ES: ['Fiesta Nacional de Espana military parade Madrid', 'Spanish flag Madrid celebration'],
  },
  canada_day: {
    CA: ['Canada Day fireworks Parliament Hill Ottawa', 'Canadian flag celebration July 1'],
  },
  remembrance_day: {
    CA: ['Remembrance Day poppy wreath Canada', 'National War Memorial Ottawa'],
  },
  carnival: {
    BR: ['Rio Carnival samba parade Sambadrome', 'Brazil carnival costumes dancers'],
  },
  national_day: {
    PT: ['Portugal Day Lisbon celebration', 'Luis de Camoes monument Lisbon'],
  },
  freedom_day: {
    PT: ['Carnation Revolution 25 April Portugal', 'Lisbon carnations freedom day'],
  },
  revolution_day: {
    MX: ['Mexican Revolution Day parade', 'Monumento a la Revolucion Mexico City'],
  },
  sovereigns_birthday: {
    LU: ['Luxembourg National Day celebration', 'Luxembourg City fireworks flag'],
  },
  europe_day: {
    LU: ['European Union flag stars', 'Europe Day European flag'],
  },
  saint_patricks_day: {
    IE: ['Saint Patricks Day parade Dublin green', 'Ireland shamrock celebration'],
  },
  saint_brigids_day: {
    IE: ['Saint Brigid cross reeds Ireland', 'Kildare Ireland Saint Brigid'],
  },

  // --- Batch 3: NO, NL, DK, SE ---
  kings_day: {
    NL: [
      'Koningsdag Amsterdam',
      'Kings Day Netherlands orange',
      'Amsterdam canal crowd orange festival',
      'Netherlands King Willem-Alexander crowd',
      'orange crowd Netherlands celebration',
    ],
  },
  national_day_of_sweden: {
    SE: ['National Day of Sweden flag Stockholm', 'Swedish flag blue yellow celebration'],
  },
  midsummer_eve: {
    SE: ['Swedish Midsummer maypole dancing midsommar', 'Midsummer flower crown Sweden'],
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
