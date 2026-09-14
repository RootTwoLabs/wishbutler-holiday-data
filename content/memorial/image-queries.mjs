/**
 * Bildsuche je Gedenk-/Aktionstag (Wikimedia Commons). Je Eintrag:
 *   terms: Suchbegriffe in Reihenfolge der Priorität (erstes Ergebnis mit
 *          freier Lizenz und ausreichender Größe gewinnt — Lizenzrang
 *          Public Domain/CC0 > CC BY > CC BY-SA, Quality Images bevorzugt)
 *   file:  optional ein kuratierter Commons-Dateititel („File:…"), der die
 *          Suche ersetzt (wie `imageFile` bei den kuriosen Tagen)
 *   avoid: optionale Wörter, die einen Kandidaten ausschließen (Titel/Kategorien)
 *
 * Motivregel: bei stillem Gedenken (topic `memorial`) Gedenkstätten, Denkmäler,
 * Kränze, Zeremonien — keine Gewaltdarstellungen, keine Leichen, keine
 * Täter-Porträts. Bei Aktionstagen (`awareness`) das Thema selbst (Flagge,
 * Ort, Beruf, Person, der der Tag gilt).
 */
export const MEMORIAL_IMAGE_QUERIES = {
  MEMORIAL_AM_armenian_genocide_remembrance_day: {
    terms: ['Tsitsernakaberd memorial Yerevan', 'Armenian Genocide memorial complex eternal flame'],
  },
  MEMORIAL_AR_day_of_remembrance_for_truth_and_justice: {
    terms: ['Parque de la Memoria Buenos Aires', 'Plaza de Mayo pañuelo Madres', 'Día de la Memoria Argentina marcha'],
  },
  MEMORIAL_AR_day_of_the_veterans_and_fallen_of_the_malvinas_war: {
    terms: ['Monumento a los Caídos en Malvinas Plaza San Martín', 'Malvinas war memorial Buenos Aires'],
  },
  MEMORIAL_AR_general_jose_de_san_martin_memorial_day: {
    terms: ['Monumento al General San Martín Buenos Aires', 'José de San Martín statue', 'San Martín mausoleum Catedral Metropolitana Buenos Aires'],
  },
  MEMORIAL_AU_anzac_day: {
    terms: ['Anzac Day dawn service Australian War Memorial', 'Australian War Memorial Canberra', 'Anzac Day march Sydney'],
  },
  MEMORIAL_BE_armistice_day: {
    terms: ['Menin Gate Ypres Last Post', 'Ypres Menin Gate memorial', 'poppies Flanders Fields'],
  },
  MEMORIAL_BY_commemoration_day: {
    terms: ["Orthodox cemetery Belarus","Belarus cemetery village graves","Radaunica"],
  },
  MEMORIAL_CA_national_day_for_truth_and_reconciliation: {
    terms: ['Orange Shirt Day', 'National Day for Truth and Reconciliation Canada', 'Every Child Matters orange shirts'],
  },
  MEMORIAL_CA_armistice_day: {
    terms: ['National War Memorial Ottawa Remembrance Day', 'Remembrance Day Ottawa ceremony'],
  },
  MEMORIAL_CA_remembrance_day: {
    file: "File:Placing poppies on the cenotaph.jpg",
    terms: ['Remembrance Day poppy Canada', 'National War Memorial Ottawa poppies', 'Remembrance Day Canada wreath'],
  },
  MEMORIAL_CD_laurent_desire_kabila_assassination: {
    terms: ['Mausolée Laurent-Désiré Kabila Kinshasa', 'Laurent-Désiré Kabila mausoleum', 'Palais de la Nation Kinshasa'],
  },
  MEMORIAL_CD_patrice_lumumba_assassination: {
    terms: ['Patrice Lumumba monument Kinshasa', 'Lumumba statue Kinshasa', 'Patrice Lumumba 1960'],
  },
  MEMORIAL_CD_congolese_genocide_day: {
    terms: ['Kinshasa memorial candles', 'Democratic Republic of the Congo flag', 'Kinshasa Boulevard du 30 Juin'],
  },
  MEMORIAL_FR_armistice_day: {
    terms: ['Arc de Triomphe tombe du Soldat inconnu flamme', '11 novembre cérémonie Arc de Triomphe', 'Bleuet de France'],
  },
  MEMORIAL_GI_workers_memorial_day: {
    terms: ['Workers Memorial Day', 'Gibraltar Rock view', 'Gibraltar Casemates Square'],
  },
  MEMORIAL_HR_remembrance_day: {
    terms: ['Vukovar Memorial Cemetery', 'Vukovar water tower', 'Ovčara memorial Vukovar'],
  },
  MEMORIAL_IL_yom_hashoah: {
    terms: ['Yad Vashem Hall of Remembrance', 'Yad Vashem Jerusalem', 'Yom HaShoah siren Israel'],
  },
  MEMORIAL_IL_yom_hazikaron: {
    terms: ['Mount Herzl military cemetery', 'Yom HaZikaron ceremony Israel', 'Har Herzl graves flags'],
  },
  MEMORIAL_IL_tisha_bav: {
    terms: ['Western Wall Tisha B\'Av', 'Kotel Jerusalem night prayer', 'Western Wall Jerusalem'],
  },
  MEMORIAL_KR_memorial_day: {
    terms: ['Seoul National Cemetery', 'Hyeonchungil Seoul National Cemetery', 'Korean Memorial Day ceremony'],
  },
  MEMORIAL_LV_commemoration_day_of_defenders_of_the_barricades_in_1991: {
    terms: ['Barikāžu muzejs Riga', 'January 1991 barricades Riga', 'Barricades memorial stones Riga Old Town'],
  },
  MEMORIAL_LV_day_of_the_international_de_jure_recognition_of_the_republic_of_latvia: {
    file: "File:Latvijas Brīvības piemineklis Rīgā.jpg",
    terms: ["Freedom Monument Riga"],
  },
  MEMORIAL_LV_world_non_governmental_organization_day: {
    terms: ['volunteers helping hands community', 'volunteering group people', 'NGO volunteers'],
  },
  MEMORIAL_LV_national_partisan_armed_resistance_remembrance_day: {
    file: "File:Memorial Site of National Partisans in Ķikuri.jpg",
    terms: ["Forest Brothers memorial Latvia"],
  },
  MEMORIAL_LV_national_resistance_movement_remembrance_day: {
    file: "File:Commemorative plaque-Konstantīns Čakste 01.JPG",
    terms: ["Konstantīns Čakste"],
  },
  MEMORIAL_LV_commemoration_day_of_victims_of_communist_terror: {
    file: "File:Cattle Car for Deportation Memorial, Near Torkakalns, Riga.jpg",
    terms: ["Torņakalns deportation memorial"],
  },
  MEMORIAL_LV_latgale_congress_day: {
    terms: ['Rēzekne Latgales Māra', 'Latgale congress Rēzekne monument', 'Rēzekne Latvia'],
  },
  MEMORIAL_LV_day_of_the_defeat_of_nazism_and_commemoration_day_of_victims_of_world_war_ii: {
    terms: ['Salaspils memorial ensemble', 'Salaspils memorial Latvia', 'World War II memorial Latvia'],
  },
  MEMORIAL_LV_europe_day: {
    file: "File:European Union Flags 2.jpg",
    terms: ["European Union flags"],
  },
  MEMORIAL_LV_international_day_of_the_family: {
    file: "File:Family Picnic Near Orchard Point Marina.jpg",
    terms: ["family picnic park"],
  },
  MEMORIAL_LV_firefighter_and_rescuer_day: {
    terms: ["fire station Riga","firefighters training fire hose","fire engine ladder truck red"],
  },
  MEMORIAL_LV_international_day_for_protection_of_children: {
    terms: ['children playing playground summer', 'children drawing chalk', 'kids balloons'],
  },
  MEMORIAL_LV_day_of_the_occupation_of_the_republic_of_latvia: {
    terms: ['Museum of the Occupation of Latvia', 'Okupācijas muzejs Riga', 'Latvian flag half mast'],
  },
  MEMORIAL_LV_medical_worker_day: {
    terms: ['Stradiņš hospital Riga', 'nurse doctor hospital corridor', 'medical staff stethoscope'],
  },
  MEMORIAL_LV_heroes_commemoration_day_anniversary_of_the_battle_of_cesis: {
    terms: ['Cēsis castle', 'Cēsu kaujas piemineklis', 'Battle of Cēsis monument'],
  },
  MEMORIAL_LV_commemoration_day_of_genocide_against_the_jews: {
    terms: ['Rumbula memorial', 'Riga ghetto memorial', 'Great Choral Synagogue memorial Riga'],
  },
  MEMORIAL_LV_day_of_the_sea_festival: {
    file: "File:Boats in Ventspils harbour - panoramio.jpg",
    terms: ['Ventspils harbour', 'Liepāja beach Baltic Sea', 'Baltic Sea Latvia coast fishing boats'],
  },
  MEMORIAL_LV_latvian_freedom_fighters_remembrance_day: {
    terms: ['Brīvības piemineklis Riga guard', 'Freedom Monument Riga honour guard', 'Latvian War of Independence monument'],
  },
  MEMORIAL_LV_day_of_the_passing_of_the_constitutional_law_on_the_status_of_the_republic_of_latvia_as_a_state: {
    terms: ['Saeima building Riga', 'Latvian parliament Saeima', 'Riga Old Town Latvian flag'],
  },
  MEMORIAL_LV_day_of_remembrance_for_victims_of_stalinism_and_nazism: {
    file: "File:BaltskýŘetěz.jpg",
    terms: ["Baltic Way 1989"],
  },
  MEMORIAL_LV_knowledge_day: {
    file: "File:Knowledge Day in Kelmentsi 2025 (01).jpg",
    terms: ["Zinību diena","first day of school flowers pupils","school bell first day pupils"],
  },
  MEMORIAL_LV_baltic_unity_day: {
    terms: ['Battle of Saule monument', 'Saulės mūšis paminklas', 'Baltic Unity Day bonfire'],
  },
  MEMORIAL_LV_international_day_of_older_persons: {
    file: "File:初冬阳光下的老年夫妇.jpg",
    terms: ["elderly couple bench"],
  },
  MEMORIAL_LV_teachers_day: {
    terms: ['teacher classroom blackboard', 'teacher with pupils classroom', 'school blackboard chalk'],
  },
  MEMORIAL_LV_official_language_day: {
    terms: ['Latvian language book', 'Latvian National Library Riga', 'Gaismas pils Riga'],
  },
  MEMORIAL_LV_border_guards_day: {
    terms: ['Latvian border guard', 'Latvia Estonia border sign', 'Valsts robežsardze'],
  },
  MEMORIAL_LV_lacplesis_day: {
    file: "File:Flickr - Saeima - Lāčplēša diena (1).jpg",
    terms: ["Lāčplēša diena"],
  },
  MEMORIAL_LV_remembrance_day_of_the_tragedy_of_21_november_2013: {
    terms: ['Zolitūde tragedy memorial', 'Zolitūdes traģēdija piemiņas vieta', 'Zolitūde memorial Riga'],
  },
  MEMORIAL_LV_police_day: {
    terms: ['Latvian State Police car', 'Valsts policija Latvia', 'police officers Riga'],
  },
  MEMORIAL_LV_commemoration_day_of_victims_of_genocide_against_the_latvian_people_by_the_totalitarian_communist_regime: {
    terms: ["Stūra māja Riga","Corner House Riga KGB","Museum of the Occupation of Latvia building"],
  },
  MEMORIAL_MD_victory_and_commemoration_day: {
    terms: ['Eternitate memorial complex Chișinău', 'Complexul Memorial Eternitate', 'Victory Day Chișinău'],
  },
  MEMORIAL_MD_memorial_day: {
    file: "File:Cimitir din or. Căinari.jpg",
    terms: ["Cimitirul Central Chișinău","Chisinau Central Cemetery","Moldova cemetery graves flowers"],
  },
  MEMORIAL_NA_cassinga_day: {
    terms: ['Heroes Acre Windhoek', 'Cassinga Day Namibia', 'Heroes Acre Namibia monument'],
  },
  MEMORIAL_NA_genocide_remembrance_day: {
    terms: ['Genocide memorial Windhoek', 'Herero Nama genocide memorial', 'Shark Island Lüderitz'],
  },
  MEMORIAL_NZ_anzac_day: {
    terms: ['Anzac Day dawn service Auckland War Memorial Museum', 'Auckland War Memorial Museum', 'Anzac Day Wellington Pukeahu'],
  },
  MEMORIAL_PG_remembrance_day: {
    terms: ['Bomana War Cemetery', 'Kokoda Track memorial', 'Port Moresby war memorial'],
  },
  MEMORIAL_PR_memorial_day: {
    terms: ['Puerto Rico National Cemetery Bayamón', 'Memorial Day flags cemetery', 'Puerto Rico veterans cemetery'],
  },
  MEMORIAL_RS_armistice_day: {
    file: "File:Ramonda nathaliae.jpg",
    terms: ["Ramonda nathaliae"],
  },
  MEMORIAL_SI_primoz_trubar_day: {
    terms: ['Primož Trubar monument Ljubljana', 'Primož Trubar statue', 'Trubar Rašica homestead'],
  },
  MEMORIAL_SI_sovereignty_day: {
    file: "File:Slovenian Flag Flying over Ljubljana Castle - Ljubljana - Slovenia (54556430852).jpg",
    terms: ["Slovenian flag Ljubljana"],
  },
  MEMORIAL_SI_unification_of_prekmurje_slovenes_with_the_mother_nation: {
    terms: ['Prekmurje landscape', 'Murska Sobota', 'Prekmurje storks village'],
  },
  MEMORIAL_SI_integration_of_primorska_into_the_homeland: {
    terms: ['Primorska coast Piran', 'Piran Slovenia', 'Slovenian Littoral coast'],
  },
  MEMORIAL_SI_slovenian_sports_day: {
    terms: ['Planica ski jumping', 'Slovenia sport Planica', 'Ljubljana stadium Stožice'],
  },
  MEMORIAL_SI_rudolf_maister_day: {
    terms: ['Rudolf Maister monument Maribor', 'Rudolf Maister statue', 'Rudolf Maister Ljubljana monument'],
  },
  MEMORIAL_SK_day_of_the_constitution_of_the_slovak_republic: {
    terms: ['Bratislava Castle Slovak flag', 'National Council of the Slovak Republic building', 'Bratislava castle'],
  },
  MEMORIAL_SK_struggle_for_freedom_and_democracy_day: {
    terms: ['Velvet Revolution memorial Bratislava', 'Velvet Revolution 1989 keys', 'Velvet Revolution memorial Prague Národní'],
  },
  MEMORIAL_SM_commemoration_of_all_those_who_died_at_war: {
    terms: ['San Marino Guaita tower', 'San Marino Monte Titano', 'Cimitero di Montalbo San Marino'],
  },
  MEMORIAL_US_lincolns_birthday: {
    terms: ['Lincoln Memorial statue', 'Abraham Lincoln statue Lincoln Memorial', 'Lincoln Memorial Washington'],
  },
  MEMORIAL_US_memorial_day: {
    terms: ['Arlington National Cemetery Memorial Day flags', 'Memorial Day Arlington flags in', 'Arlington National Cemetery headstones flags'],
  },
  MEMORIAL_VE_teachers_day: {
    file: "File:Instituto de Niños Cantores del Zulia 001.jpg",
    terms: ["aula de clases Venezuela","escuela Venezuela niños","school classroom Caracas"],
  },
  MEMORIAL_VE_youth_day: {
    file: "File:MONUMENT TO YOUTH VENEZUELA.jpg",
    terms: ["José Félix Ribas La Victoria"],
  },
  MEMORIAL_VE_slavery_abolition_anniversary: {
    file: "File:Monumento a los precursores, Paseo Los Próceres, Paseo de los Precursores.jpg",
    terms: ["Paseo Los Próceres Caracas"],
  },
  MEMORIAL_VE_foundation_anniversary_day_of_san_cristobal_tachira: {
    file: "File:Palacios de Los Leones de San Cristóbal Táchira Venezuela.jpg",
    terms: ["San Cristóbal Táchira"],
  },
  MEMORIAL_VE_journalists_day: {
    terms: ['Correo del Orinoco Angostura', 'Casa del Correo del Orinoco Ciudad Bolívar', 'old printing press newspaper'],
  },
  MEMORIAL_VE_caracas_city_foundation_day: {
    terms: ['Caracas skyline Ávila', 'Caracas Plaza Bolívar', 'Caracas Catedral Plaza Bolívar'],
  },
  MEMORIAL_VE_flag_day: {
    terms: ["Monumento a la Bandera La Vela de Coro","La Vela de Coro","Bandera de Venezuela"],
  },
  MEMORIAL_ZA_human_rights_day: {
    terms: ['Sharpeville memorial', 'Sharpeville Human Rights Precinct', 'Constitutional Court South Africa Johannesburg'],
  },
  MEMORIAL_DE_june_17_uprising: {
    terms: ['Straße des 17. Juni Berlin', 'Denkmal Volksaufstand 17. Juni 1953 Berlin', 'Gedenkstätte 17. Juni 1953 Leipziger Straße'],
  },
  MEMORIAL_DE_november_pogroms: {
    terms: ['Stolpersteine Berlin', 'Neue Synagoge Berlin Oranienburger Straße', 'Stolperstein candle'],
  },
  MEMORIAL_DE_victims_of_national_socialism: {
    terms: ['Denkmal für die ermordeten Juden Europas', 'Holocaust memorial Berlin stelae', 'Memorial to the Murdered Jews of Europe'],
  },
  MEMORIAL_SI_day_of_uprising_against_occupation: {
    terms: ["Liberation Front Slovenia monument Ljubljana","Spomenik OF Ljubljana","Ljubljana Congress Square"],
  },
  MEMORIAL_SK_slovak_national_uprising_anniversary: {
    terms: ["Slovak National Uprising Museum Banská Bystrica","SNP memorial Banska Bystrica","Banská Bystrica Museum SNP"],
  },
  MEMORIAL_HU_1956_revolution_memorial_day: {
    terms: ["Kossuth tér 1956 memorial flame Budapest", "Budapest 1956 memorial Műegyetem rakpart", "Hungarian Revolution 1956 memorial Budapest"],
    avoid: ["explanation", "plaque", "sign"],
  },
  MEMORIAL_HU_1848_revolution_memorial_day: {
    terms: ["Petőfi statue Budapest","Hungarian National Museum Budapest","Budapest March 15 cockade"],
  },
  MEMORIAL_PH_day_of_valor: {
    terms: ["Dambana ng Kagitingan Mount Samat","Shrine of Valor Bataan","Mount Samat cross"],
  },
  MEMORIAL_PH_national_heroes_day: {
    terms: ["Libingan ng mga Bayani","Bonifacio Monument Caloocan","Rizal Monument Manila"],
  },
  MEMORIAL_FR_victory_in_europe_day: {
    terms: ["Arc de Triomphe Paris tomb unknown soldier flame 2019", "Arc de Triomphe de l'Étoile Paris", "Flamme du Souvenir Arc de Triomphe"],
    avoid: ["napoléon", "1921", "centenaire"],
  },
  MEMORIAL_IT_liberation_day: {
    terms: ["25 aprile Festa della Liberazione corteo","Altare della Patria 25 aprile","Liberation Day Italy ceremony"],
  },
  MEMORIAL_NL_liberation_day: {
    terms: ["Bevrijdingsdag Wageningen","Bevrijdingsvuur","Liberation Day Netherlands 5 May"],
  },
  MEMORIAL_KR_liberation_day: {
    terms: ["Independence Hall of Korea Cheonan","Gwangbokjeol","Seodaemun Prison History Hall"],
  },
  MEMORIAL_CZ_liberation_day: {
    terms: ["Vítkov National Memorial Prague","Národní památník na Vítkově","Prague Uprising memorial"],
  },
  MEMORIAL_UA_victory_day_over_nazism_in_world_war_ii: {
    terms: ["Park of Eternal Glory Kyiv","Tomb of the Unknown Soldier Kyiv","red poppy Ukraine remembrance"],
  },
  MEMORIAL_EE_victory_day: {
    terms: ["War of Independence Victory Column Tallinn","Vabadussõja võidusammas","Freedom Square Tallinn"],
  },
  MEMORIAL_CD_martyrs_day: {
    terms: ["Kinshasa monument","Kinshasa boulevard","Democratic Republic of the Congo Kinshasa skyline"],
  },
  MEMORIAL_TN_martyrs_day: {
    terms: ["Séjoumi cemetery Tunis martyrs","Tunis Avenue Habib Bourguiba","Tunis medina panorama"],
  },
  MEMORIAL_PA_martyrs_day: {
    terms: ["Plaza de la Independencia Casco Viejo Panamá", "Casco Antiguo Panama City cathedral", "Panama City Cinta Costera"],
    avoid: ["dubrovnik", "croacia", "croatia"],
  },
  MEMORIAL_MG_martyrs_day: {
    terms: ["Moramanga memorial 1947","Antananarivo monument","Antananarivo Lake Anosy"],
  },
  MEMORIAL_UG_martyrs_day: {
    terms: ["Namugongo Martyrs Shrine","Uganda Martyrs Shrine Namugongo","Namugongo basilica"],
  },
  MEMORIAL_NA_heroes_day: {
    terms: ["Heroes' Acre Windhoek","Heroes Acre Namibia obelisk","Windhoek Heroes Acre"],
  },
  MEMORIAL_ZW_heroes_day: {
    terms: ["National Heroes Acre Harare","Heroes Acre Zimbabwe","Harare National Heroes Acre monument"],
  },
  MEMORIAL_PY_heroes_day: {
    terms: ["Panteón Nacional de los Héroes Asunción","Pantheon of Heroes Asuncion","Asunción Panteón"],
  },
  MEMORIAL_AR_general_manuel_belgrano_memorial_day: {
    terms: ["Monumento Nacional a la Bandera Rosario propileo", "National Flag Memorial Rosario Argentina", "Monumento a la Bandera Rosario"],
    avoid: ["pintos", "concierto", "concert"],
  },
  MEMORIAL_US_veterans_day: {
    terms: ["Veterans Day ceremony Arlington National Cemetery","Tomb of the Unknown Soldier Arlington wreath","Arlington National Cemetery Veterans Day"],
  },
  MEMORIAL_BD_victory_day: {
    terms: ["Jatiyo Smriti Soudho Savar","National Martyrs Memorial Bangladesh","Savar memorial Bangladesh"],
  },
  MEMORIAL_BD_language_martyrs_day: {
    terms: ["Shaheed Minar Dhaka","Central Shaheed Minar","Shaheed Minar 21 February"],
  },
  MEMORIAL_ZA_youth_day: {
    terms: ["Hector Pieterson Memorial Soweto","Hector Pieterson Museum","Soweto Orlando West memorial"],
  },
  MEMORIAL_DE_volkstrauertag: {
    terms: ["Neue Wache Berlin interior Kollwitz","Neue Wache Berlin","Volkstrauertag Kranzniederlegung"],
  },
  MEMORIAL_AT_day_of_remembrance_against_violence_and_racism: {
    terms: ["KZ-Gedenkstätte Mauthausen","Mauthausen Memorial","Mauthausen concentration camp memorial"],
  },
  MEMORIAL_GB_remembrance_sunday: {
    terms: ["The Cenotaph Whitehall Remembrance Sunday","Cenotaph London poppy wreaths","Remembrance Sunday Cenotaph"],
  },
  MEMORIAL_US_patriot_day: {
    terms: ["National September 11 Memorial reflecting pool","9/11 Memorial New York","Tribute in Light"],
    avoid: ['attack', 'collapse', 'smoke', 'plane'],
  },
  MEMORIAL_US_pearl_harbor_remembrance_day: {
    terms: ["USS Arizona Memorial","USS Arizona Memorial Pearl Harbor aerial","Pearl Harbor memorial"],
  },
  MEMORIAL_NL_remembrance_of_the_dead: {
    terms: ["Nationaal Monument Dam Amsterdam","National Monument Dam Square","Dodenherdenking Dam"],
  },
  MEMORIAL_PL_warsaw_uprising_remembrance_day: {
    terms: ["Warsaw Uprising Monument","Pomnik Powstania Warszawskiego","Warsaw Uprising Museum"],
  },
  MEMORIAL_PL_katyn_remembrance_day: {
    terms: ["Katyn Museum Warsaw","Katyń memorial Warsaw","Katyn war cemetery"],
    avoid: ['exhumation', 'bodies', 'corpse'],
  },
  MEMORIAL_PL_warsaw_ghetto_uprising_remembrance_day: {
    terms: ["Monument to the Ghetto Heroes Warsaw","Pomnik Bohaterów Getta","POLIN Museum Warsaw daffodil"],
  },
  MEMORIAL_IT_giorno_del_ricordo: {
    terms: ["Foiba di Basovizza", "Monumento nazionale Foiba di Basovizza Trieste", "Basovizza foiba"],
  },
  MEMORIAL_LT_freedom_defenders_day: {
    terms: ["Vilnius TV tower", "Vilniaus televizijos bokštas", "January 13 memorial crosses Vilnius television tower"],
  },
  MEMORIAL_EE_day_of_mourning: {
    terms: ["Memorial to the Victims of Communism Tallinn", "Kommunismiohvrite memoriaal Maarjamäe", "Tallinn Maarjamäe memorial names wall 2018"],
    avoid: ["washington"],
  },
  MEMORIAL_NO_22_july_remembrance_day: {
    terms: ["Regjeringskvartalet 22. juli minnesmerke", "Oslo Cathedral flowers July 2011", "Utøya Hegnhuset", "Oslo domkirke blomsterhav"],
    avoid: ["breivik"],
  },
  MEMORIAL_EU_day_of_remembrance_for_victims_of_terrorism: {
    terms: ["Atocha station memorial 11-M Madrid","Bosque del Recuerdo Retiro Madrid","Madrid 11M memorial"],
  },
  MEMORIAL_UN_remembrance_of_victims_of_slavery: {
    terms: ["Maison des Esclaves Gorée", "House of Slaves Gorée Island Senegal", "Door of No Return Gorée"],
    avoid: ["museum print", "engraving", "political ark"],
  },
  MEMORIAL_RW_genocide_remembrance_day: {
    terms: ["Kigali Genocide Memorial Centre", "Gisozi Genocide Memorial Kigali", "Kigali Genocide Memorial garden"],
    avoid: ["skull", "remains", "bones"],
  },
  MEMORIAL_BA_srebrenica_remembrance_day: {
    terms: ["Srebrenica Potočari Memorial cemetery gravestones", "Potočari Memorial Center Srebrenica", "Memorijalni centar Potočari"],
    avoid: ["vučić", "vucic", "exhum", "remains", "coffins", "politician"],
  },
  MEMORIAL_UA_holodomor_remembrance_day: {
    terms: ["Holodomor Genocide Museum Kyiv","National Museum of the Holodomor-Genocide","Holodomor memorial candle Kyiv"],
  },
  MEMORIAL_UA_chernobyl_remembrance_day: {
    terms: ["Chernobyl Museum Kyiv", "Chornobyl liquidators monument Kyiv", "Slavutych Chernobyl memorial"],
    avoid: ["osh", "kyrgyz", "bishkek"],
  },
  MEMORIAL_JP_hiroshima_peace_memorial_day: {
    terms: ["Hiroshima Peace Memorial Park cenotaph","Atomic Bomb Dome Hiroshima","Hiroshima Peace Memorial lanterns"],
  },
  MEMORIAL_JP_nagasaki_peace_memorial_day: {
    terms: ["Nagasaki Peace Park Peace Statue","Nagasaki Peace Statue","Nagasaki hypocenter park"],
  },
  MEMORIAL_JP_end_of_war_memorial_day: {
    terms: ["Chidorigafuchi National Cemetery","Chidorigafuchi cemetery Tokyo","Nippon Budokan"],
  },
  MEMORIAL_CN_nanjing_massacre_memorial_day: {
    terms: ["Nanjing Massacre Memorial Hall","Memorial Hall of the Victims in Nanjing Massacre","Nanjing memorial hall sculpture"],
    avoid: ['remains', 'bones', 'skull'],
  },
  MEMORIAL_TR_ataturk_memorial_day: {
    terms: ["Anıtkabir Ankara","Anitkabir mausoleum","Anıtkabir Hall of Honor"],
  },
  MEMORIAL_KR_gwangju_democratization_movement_day: {
    terms: ["May 18th National Cemetery Gwangju","5.18 National Cemetery","Gwangju 5·18 memorial"],
  },
  MEMORIAL_IN_martyrs_day: {
    terms: ["Raj Ghat Delhi","Raj Ghat Gandhi memorial","Rajghat New Delhi"],
  },
  MEMORIAL_EU_end_of_second_world_war_in_europe: {
    terms: ["Soviet War Memorial Tiergarten Berlin", "Neue Wache Berlin", "wreath laying war memorial 8 May 1945"],
    avoid: ["parade", "tank photo"],
  },
};
