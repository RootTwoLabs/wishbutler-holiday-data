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
  fathers_day_de: ['Vatertag Bollerwagen Herrenpartie outing'],
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
  st_stephen: ['St Stephen cathedral Vienna Stephansdom'],
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
    CL: [
      'Chile Fiestas Patrias cueca dancing fonda',
      'Chilean flag September celebration',
      'cueca dance Chile',
      'flag of Chile',
      'Chile fonda ramada celebration',
    ],
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
    AR: [
      'Argentina Independence Day Casa de Tucuman',
      'flag of Argentina',
      'Argentine flag Buenos Aires',
      'Argentina flag celebration',
      'Casa Historica Tucuman Argentina',
    ],
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
    SG: [
      'Singapore National Day Parade Marina Bay',
      'Singapore flag celebration fireworks',
      'Singapore National Day fly past',
      'Singapore skyline Marina Bay flag',
    ],
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

  // --- Batch 4: AR, CL, CO ---
  may_revolution: {
    AR: ['Argentina May Revolution Cabildo Buenos Aires', '25 de Mayo Plaza de Mayo Argentina'],
  },
  navy_day: {
    CL: ['Chile Navy Day Glorias Navales Iquique', 'Chilean navy ship Esmeralda Arturo Prat'],
  },
  declaration_of_independence: {
    CO: ['Colombia Independence Day 20 July Bogota', 'Colombian flag celebration'],
  },
  battle_of_boyaca: {
    CO: ['Puente de Boyaca bridge monument Colombia', 'Battle of Boyaca Simon Bolivar'],
  },

  // --- Batch 5: AU, NZ ---
  australia_day: {
    AU: [
      'Australia Day Sydney celebration',
      'flag of Australia',
      'Australia Day fireworks Sydney Harbour',
      'Australian flag crowd celebration',
    ],
  },
  anzac_day: {
    AU: [
      'Anzac Day dawn service Australia',
      'Anzac Day march Australia poppy',
      'Australian War Memorial Anzac',
    ],
    NZ: [
      'Anzac Day dawn service New Zealand',
      'Anzac Day poppy New Zealand memorial',
      'Auckland War Memorial Anzac',
    ],
  },
  waitangi_day: {
    NZ: [
      'Waitangi Day New Zealand Treaty Grounds',
      'Waitangi Treaty House New Zealand',
      'Maori waka canoe Waitangi',
      'New Zealand flag Waitangi celebration',
    ],
  },

  // --- Batch 6: SG ---
  chinese_new_year: {
    SG: [
      'Singapore Chinatown Chinese New Year lights',
      'lion dance Chinese New Year Singapore',
      'Chinese New Year lanterns red Singapore',
      'Chinatown Singapore decorations new year',
    ],
  },

  // --- Batch 7: Asia + DACH top-ups ---
  reformation_day: {
    DE: [
      'Reformation Day Martin Luther Wittenberg',
      'Wittenberg Castle Church door theses',
      'Martin Luther statue Wittenberg',
    ],
  },
  saint_martins_day: {
    AT: [
      'Martinsumzug Laterne',
      'Sankt Martin Umzug',
      'lantern procession children night',
      'roast goose dinner',
      'Saint Martin of Tours',
      'Martinmas lantern',
    ],
  },
  st_berchtolds_day: {
    CH: [
      'Switzerland winter snow village New Year',
      'Swiss alps winter walk snow',
      'walnuts nuts wooden table',
    ],
  },
  hong_kong_special_administrative_region_establishment_day: {
    HK: [
      'Hong Kong flag raising ceremony',
      'Hong Kong Victoria Harbour fireworks',
      'Hong Kong skyline Victoria Harbour',
    ],
  },
  dragon_boat_festival: {
    HK: [
      'dragon boat race Hong Kong',
      'dragon boat festival paddlers drum',
      'zongzi rice dumplings bamboo',
    ],
  },
  foundation_day: {
    JP: [
      'Japan flag Hinomaru',
      'Japanese flag ceremony',
      'Japan national flag building',
    ],
  },
  coming_of_age_day: {
    JP: [
      'Coming of Age Day furisode kimono',
      'Japanese women kimono ceremony seijin',
      'furisode kimono young women Japan',
    ],
  },
  chuseok: {
    KR: [
      'Chuseok Korean harvest songpyeon',
      'Korean hanbok family Chuseok',
      'songpyeon rice cakes Korea',
    ],
  },
  hangul_day: {
    KR: [
      'King Sejong statue Gwanghwamun',
      'Hangul Korean alphabet calligraphy',
      'Hunminjeongeum Hangul manuscript',
    ],
  },

  // --- Batch 8: globale Nachzuegler (in vielen Laendern) ---
  pentecost: ['Pentecost dove stained glass', 'white dove sky', 'Pentecost church celebration'],
  saint_josephs_day: ['Saint Joseph statue church', 'Saint Joseph carpenter painting', 'zeppole San Giuseppe'],
  holy_saturday: ['Easter vigil candles church', 'Paschal candle Easter vigil', 'Holy Saturday church night'],
  christmas_day_orthodox: ['Orthodox Christmas church icon', 'Orthodox church Christmas candles', 'Orthodox Nativity icon'],
  saint_peter_and_saint_paul: ['Saint Peter and Paul icon', 'Saints Peter and Paul statue', 'Peter and Paul church painting'],

  // --- Batch 8: Israel ---
  rosh_hashanah: {
    IL: ['Rosh Hashanah apples honey pomegranate', 'shofar ram horn Rosh Hashanah', 'Rosh Hashanah round challah honey'],
  },
  yom_kippur: {
    IL: ['Yom Kippur synagogue prayer', 'Yom Kippur Jerusalem empty street', 'Western Wall prayer Jerusalem'],
  },
  sukkot: {
    IL: ['sukkah Sukkot booth decorated', 'lulav etrog four species Sukkot', 'Sukkot sukkah Jerusalem'],
  },
  hanukkah: {
    IL: ['sufganiyot', 'dreidel spinning top wooden', 'Chanukkiah lit candles', 'Hanukkah oil lamp antique silver'],
  },
  purim: {
    IL: ['Purim hamantaschen cookies', 'Purim costumes parade Israel', 'Purim megillah scroll Esther'],
  },
  passover: {
    IL: ['Passover seder plate matzah', 'Pesach seder table', 'matzah unleavened bread Passover'],
  },
  yom_haatzmaut: {
    IL: ['Israel Independence Day flag celebration', 'flag of Israel', 'Yom HaAtzmaut fireworks Israel'],
  },
  shavuot: {
    IL: ['cheesecake slice', 'wheat field harvest golden', 'Bikkurim kibbutz Shavuot', 'first fruits basket wheat'],
  },

  // --- Batch 8: DACH-Luecken ---
  world_childrens_day: {
    DE: ['Weltkindertag Kinder Fest', 'children playing festival balloons', 'Kinderfest Thüringen Weltkindertag'],
  },
  repentance_and_prayer_day: {
    DE: ['Frauenkirche Dresden interior', 'Thomaskirche Leipzig interior', 'Kreuzkirche Dresden', 'church candle prayer hands'],
  },
  saint_florians_day: {
    AT: ['Florianijünger Feuerwehr Prozession', 'Saint Florian statue fountain', 'Heiliger Florian Feuerwehr Österreich'],
  },
  saint_ruperts_day: {
    AT: ['Rupertikirtag Salzburg', 'Saint Rupert Salzburg cathedral', 'Rupertikirtag Domplatz Salzburg'],
  },
  saint_leopolds_day: {
    AT: ['Klosterneuburg Stift Leopoldi', 'Saint Leopold Klosterneuburg Fasslrutschen', 'Stift Klosterneuburg abbey'],
  },
  republic_day: {
    IT: ['Festa della Repubblica parade Rome', 'Frecce Tricolori Italian flag flyover'],
    CH: ['Neuchatel castle Switzerland', 'Neuchâtel lake town Switzerland', 'Neuchatel 1st March celebration'],
    TR: ['Republic Day Turkey Cumhuriyet Bayrami flag', 'Anitkabir Ankara Ataturk mausoleum', 'Turkish flag Istanbul Bosphorus celebration'],
  },
  nafels_procession: {
    CH: ['Näfelser Fahrt Glarus', 'Naefels Glarus Switzerland battle memorial', 'Glarus Alps Näfels village'],
  },
  geneva_prayday: {
    CH: ['Geneva Jet d Eau lake', 'Geneva Saint Pierre cathedral', 'Jeune genevois Geneva'],
  },
  federal_day_of_thanksgiving: {
    CH: ['Eidgenössischer Dank- Buss- und Bettag', 'Swiss church village mountains autumn', 'Bettag Switzerland church'],
  },
  federal_fast_monday: {
    CH: ['Vaud vineyards Lavaux Lake Geneva', 'Lavaux terraces autumn Switzerland', 'gâteau aux pruneaux plum tart'],
  },
  restoration_day: {
    CH: ['Geneva cathedral Saint-Pierre old town', 'Geneva flower clock Jardin Anglais', 'Geneva lake Mont Blanc view winter', 'flag of Geneva canton'],
  },

  // --- Batch 8: Kanada ---
  family_day: {
    CA: ['Rideau Canal skateway Ottawa skaters', 'children tobogganing snow hill', 'family snowshoeing winter forest', 'ice skating outdoor rink winter'],
  },
  victoria_day: {
    CA: ['Victoria Day fireworks Canada', 'Queen Victoria statue Canada', 'Victoria Day parade Victoria BC'],
  },
  national_aboriginal_day: {
    CA: ['National Indigenous Peoples Day Canada powwow', 'First Nations dancer regalia Canada', 'Indigenous Peoples Day Canada celebration'],
  },
  national_holiday: {
    AT: ['flag of Austria', 'Austrian national day celebration'],
    CL: [
      'Chile Fiestas Patrias cueca dancing fonda',
      'Chilean flag September celebration',
      'cueca dance Chile',
      'flag of Chile',
      'Chile fonda ramada celebration',
    ],
    CA: ['flag of Quebec fleurdelisé', 'Fête nationale du Québec 2019 Montreal', 'Quebec flag Montreal parade', 'Montreal Jean-Talon crowd Fête nationale'],
  },
  civic_holiday: {
    CA: ['Canada summer lake cottage', 'Toronto summer festival August', 'Canadian lake summer canoe'],
  },
  labour_day_ca: {
    CA: ['Labour Day parade Toronto', 'Canadian workers labour day', 'Canada labour day September'],
  },
  national_day_for_truth_and_reconciliation: {
    CA: ['Orange Shirt Day Canada', 'Truth and Reconciliation Day Canada orange', 'Every Child Matters orange shirt'],
  },
  thanksgiving: {
    CA: ['roast turkey dinner table', 'pumpkin pie slice whipped cream', 'autumn maple leaves red Canada', 'harvest pumpkins squash market autumn'],
  },

  // --- Batch 8: Australien ---
  labour_day_au: {
    AU: ['Labour Day parade Australia', 'Eight Hour Day monument Melbourne', 'Australian workers march'],
  },
  kings_birthday: {
    AU: ['King Charles III portrait', 'Australian flag Canberra Parliament', 'Kings Birthday Australia honours'],
    NZ: ['King Charles III portrait', 'New Zealand flag Wellington Beehive', 'New Zealand winter Queenstown snow'],
  },
  melbourne_cup: {
    AU: ['Melbourne Cup horse race Flemington', 'Flemington racecourse Melbourne Cup', 'Melbourne Cup fashions on the field'],
  },
  western_australia_day: {
    AU: ['Perth skyline Swan River', 'Western Australia flag', 'Perth foreshore celebration'],
  },
  canberra_day: {
    AU: ['Canberra Parliament House Australia', 'Canberra Lake Burley Griffin', 'Canberra balloon festival'],
  },
  friday_before_afl_grand_final: {
    AU: ['AFL Grand Final MCG Melbourne', 'Australian rules football crowd MCG', 'AFL grand final parade Melbourne'],
  },

  // --- Batch 8: Neuseeland ---
  matariki: {
    NZ: ['Matariki Pleiades stars night sky', 'Matariki celebration New Zealand', 'Pleiades star cluster'],
  },
  labour_day_nz: {
    NZ: ['New Zealand spring Labour Day weekend', 'Samuel Parnell eight hour day', 'New Zealand workers march Wellington'],
  },
  auckland_anniversary_day: {
    NZ: ['Auckland Anniversary Regatta sailing', 'Auckland harbour sailing regatta', 'Auckland skyline Sky Tower harbour'],
  },
  wellington_anniversary_day: {
    NZ: ['Wellington harbour New Zealand', 'Wellington waterfront summer', 'Wellington cable car city'],
  },

  // --- Batch 8: Tuerkei ---
  eid_al_fitr_first_day: {
    TR: ['Ramazan Bayramı bayram şekeri', 'Eid al-Fitr Turkey family greeting', 'Turkish baklava Eid sweets'],
  },
  eid_al_adha_first_day: {
    TR: ['Kurban Bayramı Turkey mosque', 'Eid al-Adha mosque prayer Istanbul', 'Blue Mosque Istanbul prayer'],
  },
  national_independence_childrens_day: {
    TR: ['23 Nisan children festival Turkey', 'Turkish children national costume 23 April', 'Children Day Turkey parade flags'],
  },
  ataturk_commemoration_youth_day: {
    TR: ['19 Mayıs Samsun Ataturk', 'Ataturk Samsun monument Bandirma', 'Youth and Sports Day Turkey stadium'],
  },
  democracy_and_national_unity_day: {
    TR: ['Bosphorus Bridge from Ortaköy', 'Ortaköy Mosque Bosphorus Bridge', 'Bosphorus Bridge Istanbul aerial', 'Turkish flag waving sky'],
  },
  victory_day: {
    TR: ['Anıtkabir Ankara mausoleum', 'Dumlupınar Zafer Anıtı', 'Turkish flag waving Ankara', 'Türk Yıldızları aerobatic team'],
  },

  // --- Batch 8: Aegypten ---
  eid_al_adha: {
    EG: ['Al-Azhar Mosque Cairo courtyard', 'Cairo minarets skyline sunset', 'Sultan Hassan Mosque Cairo', 'kahk Eid cookies Egypt'],
  },
  islamic_new_year: {
    EG: ['Hijri new year crescent moon', 'crescent moon mosque night', 'Islamic calendar crescent moon minaret'],
  },
  prophet_muhammads_birthday: {
    EG: ['halawet el moulid', 'Al-Hussein Mosque Cairo', 'Mawlid sweets Egypt', 'Cairo fanous lantern night'],
  },
  sinai_liberation_day: {
    EG: ['Sinai peninsula mountains Egypt', 'Mount Sinai sunrise Egypt', 'Sinai desert Egypt landscape'],
  },
  revolution_day: {
    MX: ['Mexico Revolution Day parade', 'Mexican Revolution Day celebration'],
    EG: ['flag of Egypt waving', 'Cairo Citadel Muhammad Ali mosque', 'Egyptian flag Nile Cairo'],
  },
  june_30_revolution: {
    EG: ['Egypt flag Cairo Nile', 'Cairo skyline Nile evening', 'Egyptian flag Tahrir square'],
  },
  armed_forces_day: {
    EG: ['Suez Canal Egypt ship', 'Suez Canal crossing memorial Egypt', 'Egypt Suez Canal aerial'],
  },
  revolution_day_2011_national_police_day: {
    EG: ['Tahrir Square Cairo aerial view', 'Egyptian Museum Cairo facade building', 'Cairo downtown Tahrir square obelisk'],
  },
  easter_monday_eg: {
    EG: ['Sham el-Nessim', 'feseekh salted fish Egypt', 'colored eggs basket spring', 'Nile riverbank spring Cairo park'],
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
