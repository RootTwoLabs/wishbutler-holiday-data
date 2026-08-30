/**
 * Curated "fun / quirky occasions" source (e.g. "Tag des Weines").
 *
 * This is a hand-maintained SEED SET (~40 well-known unofficial observances) so
 * the feature is demonstrable end-to-end. It is intentionally source-agnostic:
 * `build-fun-occasions.mjs` turns these entries into data/packages/FUN/vN/package.json.
 * A later, larger harvest from an open/CC source (Wikipedia/Wikidata, with
 * attribution + normalisation) can append to / replace this list without any
 * schema or app changes.
 *
 * Rules enforced by build + validate:
 *  - max 3 occasions per calendar day
 *  - `slug` is unique and stable (becomes id `fun_<slug>` and labelKey `funOccasions.<slug>`)
 *  - every entry provides at least a `de` and `en` label
 *
 * `date` is "MM-DD" (fixed Gregorian). Movable observances are out of scope for now.
 * `emoji` is the primary visual (no image assets needed). `tags` are free-form
 * hints for later curation/filtering; the app does not require them yet.
 *
 * Labels are our own short wording, not copied from any proprietary list.
 */

/** @typedef {{ slug: string, date: string, emoji: string, tags: string[], labels: Record<string,string> }} FunOccasionSeed */

/** @type {FunOccasionSeed[]} */
export const FUN_OCCASIONS = [
  // January
  { slug: 'thank_you_day', date: '01-11', emoji: '🙏', tags: ['social'],
    labels: { de: 'Internationaler Dankeschön-Tag', en: 'International Thank You Day' } },
  { slug: 'hug_day', date: '01-21', emoji: '🤗', tags: ['social'],
    labels: { de: 'Tag der Umarmung', en: 'National Hugging Day' } },

  // February
  { slug: 'nutella_day', date: '02-05', emoji: '🍫', tags: ['food'],
    labels: { de: 'Welt-Nutella-Tag', en: 'World Nutella Day' } },
  { slug: 'pizza_day', date: '02-09', emoji: '🍕', tags: ['food'],
    labels: { de: 'Tag der Pizza', en: 'National Pizza Day' } },
  { slug: 'radio_day', date: '02-13', emoji: '📻', tags: ['culture'],
    labels: { de: 'Welttag des Radios', en: 'World Radio Day' } },
  { slug: 'wine_day', date: '02-18', emoji: '🍷', tags: ['drink'],
    labels: { de: 'Tag des Weines', en: 'National Drink Wine Day' } },
  { slug: 'polar_bear_day', date: '02-27', emoji: '🐻‍❄️', tags: ['animals', 'nature'],
    labels: { de: 'Tag des Eisbären', en: 'International Polar Bear Day' } },

  // March
  { slug: 'wildlife_day', date: '03-03', emoji: '🦁', tags: ['animals', 'nature'],
    labels: { de: 'Weltnaturtag', en: 'World Wildlife Day' } },
  { slug: 'pi_day', date: '03-14', emoji: '🥧', tags: ['nerd', 'science'],
    labels: { de: 'Pi-Tag', en: 'Pi Day' } },
  { slug: 'happiness_day', date: '03-20', emoji: '😊', tags: ['wellbeing'],
    labels: { de: 'Weltglückstag', en: 'International Day of Happiness' } },
  { slug: 'forest_day', date: '03-21', emoji: '🌳', tags: ['nature'],
    labels: { de: 'Tag des Waldes', en: 'International Day of Forests' } },
  { slug: 'water_day', date: '03-22', emoji: '💧', tags: ['nature'],
    labels: { de: 'Weltwassertag', en: 'World Water Day' } },

  // April
  { slug: 'childrens_book_day', date: '04-02', emoji: '📚', tags: ['culture'],
    labels: { de: 'Internationaler Kinderbuchtag', en: "International Children's Book Day" } },
  { slug: 'health_day', date: '04-07', emoji: '🩺', tags: ['wellbeing'],
    labels: { de: 'Weltgesundheitstag', en: 'World Health Day' } },
  { slug: 'earth_day', date: '04-22', emoji: '🌍', tags: ['nature'],
    labels: { de: 'Tag der Erde', en: 'Earth Day' } },
  { slug: 'beer_day', date: '04-23', emoji: '🍺', tags: ['drink', 'food'],
    labels: { de: 'Tag des deutschen Bieres', en: 'German Beer Day' } },

  // May
  { slug: 'star_wars_day', date: '05-04', emoji: '🚀', tags: ['nerd', 'pop'],
    labels: { de: 'Star-Wars-Tag', en: 'Star Wars Day' } },
  { slug: 'towel_day', date: '05-25', emoji: '🧻', tags: ['nerd', 'pop'],
    labels: { de: 'Handtuchtag', en: 'Towel Day' } },
  { slug: 'geek_pride_day', date: '05-25', emoji: '🤓', tags: ['nerd'],
    labels: { de: 'Tag des Nerd-Stolzes', en: 'Geek Pride Day' } },

  // June
  { slug: 'environment_day', date: '06-05', emoji: '🌱', tags: ['nature'],
    labels: { de: 'Weltumwelttag', en: 'World Environment Day' } },
  { slug: 'ocean_day', date: '06-08', emoji: '🌊', tags: ['nature'],
    labels: { de: 'Welttag der Ozeane', en: 'World Oceans Day' } },
  { slug: 'sushi_day', date: '06-18', emoji: '🍣', tags: ['food'],
    labels: { de: 'Internationaler Sushi-Tag', en: 'International Sushi Day' } },
  { slug: 'skateboarding_day', date: '06-21', emoji: '🛹', tags: ['sport'],
    labels: { de: 'Tag des Skateboards', en: 'Go Skateboarding Day' } },

  // July
  { slug: 'chocolate_day', date: '07-07', emoji: '🍫', tags: ['food'],
    labels: { de: 'Tag der Schokolade', en: 'World Chocolate Day' } },
  { slug: 'emoji_day', date: '07-17', emoji: '😀', tags: ['nerd', 'pop'],
    labels: { de: 'Welt-Emoji-Tag', en: 'World Emoji Day' } },
  { slug: 'moon_day', date: '07-20', emoji: '🌕', tags: ['science', 'space'],
    labels: { de: 'Tag der Mondlandung', en: 'National Moon Day' } },

  // August
  { slug: 'cat_day', date: '08-08', emoji: '🐱', tags: ['animals'],
    labels: { de: 'Weltkatzentag', en: 'International Cat Day' } },
  { slug: 'lefthanders_day', date: '08-13', emoji: '✋', tags: ['fun'],
    labels: { de: 'Weltlinkshändertag', en: 'International Lefthanders Day' } },
  { slug: 'photography_day', date: '08-19', emoji: '📷', tags: ['art'],
    labels: { de: 'Weltfototag', en: 'World Photography Day' } },
  { slug: 'whale_shark_day', date: '08-30', emoji: '🐋', tags: ['animals', 'nature'],
    labels: { de: 'Internationaler Tag des Walhais', en: 'International Whale Shark Day' } },

  // September
  { slug: 'literacy_day', date: '09-08', emoji: '📖', tags: ['culture'],
    labels: { de: 'Weltalphabetisierungstag', en: 'International Literacy Day' } },
  { slug: 'talk_like_a_pirate_day', date: '09-19', emoji: '🏴‍☠️', tags: ['fun', 'pop'],
    labels: { de: 'Sprich-wie-ein-Pirat-Tag', en: 'Talk Like a Pirate Day' } },
  { slug: 'peace_day', date: '09-21', emoji: '🕊️', tags: ['social'],
    labels: { de: 'Weltfriedenstag', en: 'International Day of Peace' } },
  { slug: 'tourism_day', date: '09-27', emoji: '✈️', tags: ['travel'],
    labels: { de: 'Welttourismustag', en: 'World Tourism Day' } },

  // October
  { slug: 'coffee_day', date: '10-01', emoji: '☕', tags: ['drink'],
    labels: { de: 'Tag des Kaffees', en: 'International Coffee Day' } },
  { slug: 'animal_day', date: '10-04', emoji: '🐾', tags: ['animals'],
    labels: { de: 'Welttierschutztag', en: 'World Animal Day' } },
  { slug: 'teachers_day', date: '10-05', emoji: '🍎', tags: ['social'],
    labels: { de: 'Weltlehrertag', en: "World Teachers' Day" } },
  { slug: 'food_day', date: '10-16', emoji: '🍎', tags: ['food'],
    labels: { de: 'Welternährungstag', en: 'World Food Day' } },

  // November
  { slug: 'kindness_day', date: '11-13', emoji: '💛', tags: ['social', 'wellbeing'],
    labels: { de: 'Welttag der Freundlichkeit', en: 'World Kindness Day' } },
  { slug: 'students_day', date: '11-17', emoji: '🎓', tags: ['social'],
    labels: { de: 'Internationaler Tag der Studierenden', en: "International Students' Day" } },
  { slug: 'mens_day', date: '11-19', emoji: '👔', tags: ['social'],
    labels: { de: 'Internationaler Männertag', en: "International Men's Day" } },
  { slug: 'hello_day', date: '11-21', emoji: '👋', tags: ['social'],
    labels: { de: 'Welt-Hallo-Tag', en: 'World Hello Day' } },

  // December
  { slug: 'human_rights_day', date: '12-10', emoji: '⚖️', tags: ['social'],
    labels: { de: 'Tag der Menschenrechte', en: 'Human Rights Day' } },
];
