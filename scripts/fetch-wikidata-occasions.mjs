#!/usr/bin/env node
/**
 * Harvests GENUINELY FUN, quirky occasions (e.g. "World Chocolate Day",
 * "Talk Like a Pirate Day", "International Cat Day") from Wikidata via the
 * public SPARQL endpoint and writes content/fun-occasions.json.
 *
 * LICENCE: Wikidata's structured data is CC0 1.0 (public domain) — free for
 * commercial use, no attribution required. Multilingual labels are taken
 * straight from Wikidata (also CC0), so no machine translation is needed for
 * the harvested items.
 *
 * WHY the rewrite (2026-09): The old harvester queried only three
 * "observance day" classes (world/awareness/UN day) — those are overwhelmingly
 * SERIOUS (health, remembrance, politics, campaigns) and yielded almost no fun
 * days. Wikidata has NO clean "fun day" class, so instead we take the FULL pool
 * of items with a fixed periodic date (P837) and keep only those whose English
 * name matches a positive FUN allowlist (food/drink, animals, games/hobbies,
 * whimsy), while dropping serious topics and non-"day" entities (cities,
 * universities, prefectures, religious feasts, regional festivals). Everything
 * here is a REAL, verifiable observance — nothing invented.
 *
 * Two-pass: (1) fetch every P837-dated item's EN label + sitelinks cheaply and
 * filter locally; (2) fetch the 12-language labels only for the selected items.
 *
 * Resilient: on a network/endpoint failure or an implausibly small result it
 * KEEPS the committed JSON and exits 0.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'content', 'fun-occasions.json');

const ENDPOINT = 'https://query.wikidata.org/sparql';
const USER_AGENT =
  'WishButler-FunOccasions-Harvester/2.0 (https://wishbutler.app; contact: evgeny@nekhamkin.de)';
const ALL_LOCALES = ['de', 'en', 'es', 'fr', 'it', 'pl', 'pt', 'nl', 'sv', 'nb', 'da', 'fi', 'ru', 'uk', 'ja', 'ko', 'zh-Hant'];
const MAX_PER_DAY = 3;
const MAX_DATES_PER_OCCASION = 2;
const SANITY_MIN = 30;

/**
 * Positive FUN signal — an occasion is kept only if its English name matches one
 * of these. Deliberately generous within clearly light-hearted themes.
 */
const FUN_ALLOWLIST = [
  // food & drink
  /\b(pizza|chocolate|nutella|pasta|spaghetti|lasagne|burger|hamburger|cheese|coffee|tea|beer|wine|whisky|whiskey|cocktail|rum|vodka|gin|tequila|sake|cider|pancake|waffle|donut|doughnut|cookie|biscuit|cake|dessert|ice.?cream|gelato|sorbet|candy|caramel|toffee|fudge|honey|popcorn|pretzel|bagel|sushi|taco|nacho|guacamole|avocado|banana|apple|strawberry|blueberry|lemon|mango|peach|cherry|pineapple|potato|fries|\bpie\b|croissant|sandwich|hummus|falafel|bacon|\begg\b|noodle|ramen|curry|dumpling|pierogi|paella|risotto|marshmallow|licorice|liquorice|gingerbread|scone|brownie|cupcake|muffin|kebab|pancakes|maple syrup|vanilla|cinnamon|nutmeg|almond|peanut|walnut|pistachio|coconut|pumpkin|mushroom|garlic|pickle|tofu|oyster|lobster|shrimp|prosecco|champagne|espresso|cappuccino|latte|milkshake|smoothie|bubble tea)\b/i,
  // animals (appreciation)
  /\b(cat|dog|puppy|kitten|penguin|panda|zebra|ostrich|sparrow|hedgehog|otter|sloth|capybara|quokka|hippo|dolphin|whale|shark|tiger|lion|koala|kangaroo|turtle|tortoise|frog|\bbee\b|butterfly|ladybug|owl|\bfox\b|polar bear|rabbit|hamster|parrot|flamingo|peacock|hummingbird|seahorse|octopus|squirrel|meerkat|llama|alpaca|axolotl|narwhal|manatee|platypus|pangolin|puffin)\b/i,
  // games, hobbies, culture-fun
  /\b(chess|puzzle|jigsaw|lego|video ?game|board ?game|\bdance\b|dancing|jazz|karaoke|comic|superhero|pirate|ninja|dragon|unicorn|magic|origami|kite|yo.?yo|skateboard|juggl|balloon|bubble|puppet|circus|fireworks night|guitar|piano|ukulele|saxophone|record player|vinyl)\b/i,
  // whimsy & feel-good
  /\b(emoji|\bpi day\b|mathematics|happiness|joke|laughter|compliment|\bhug\b|\bkiss\b|smile|wink|high.?five|left.?hand|selfie|umbrella|\bsock\b|moustache|mustache|freckle|\bpun\b|trivia|\bnap\b|pajama|pyjama|talk like|towel|star wars|opposite day|picnic|paper airplane|handwriting|penmanship|tongue twister|dad joke|sundae|bubble wrap)\b/i,
];

/**
 * Hard drop — serious topics AND non-"fun-day" entities that slip through the
 * allowlist (regional festivals, religious feasts, places, orgs).
 */
const REJECT_LIST = [
  /\b(cancer|disease|health|awareness|memorial|victim|violence|\bwar\b|genocide|suicide|abuse|slavery|trafficking|refugee|poverty|hunger|disaster|prevention|remembrance|martyr|mourning|funeral|cunnilingus|sex|porn)\b/i,
  /\b(prefecture|university|college|institute|city|town|province|county|kingdom|republic|festival|carnival|matsuri|parade|feast|saint|st\.|nativity|assumption|immaculate|transfiguration|annunciation|candlemas|epiphany|souls|cross|church|cathedral|prix|regatta|marathon|grand prix|anniversary of|founding|foundation day)\b/i,
];

/**
 * Einzelne Treffer, die durch Allow/Reject rutschen, aber keine universellen
 * Fun-Tage sind (regionale Events, Nicht-Tage, cause-y). Per slug ausgeschlossen.
 */
const EXCLUDE_SLUGS = new Set([
  'happiness_week',
  'international_women_in_mathematics_day',
  'international_day_of_women_s_happiness',
  'oak_apple_day',
  'mushono_dainembutsu_dance',
  'cosmic_turtle_drop',
  'pirate_bash',
  'russian_jazz_day',
  'kiss_day',
]);

function isFun(en) {
  if (!en) return false;
  if (REJECT_LIST.some((re) => re.test(en))) return false;
  return FUN_ALLOWLIST.some((re) => re.test(en));
}

const MONTHS = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toMonthDay(dayEn) {
  const m = /^([A-Za-z]+) ([0-9]{1,2})$/.exec(dayEn ?? '');
  if (!m) return null;
  const month = MONTHS[m[1]];
  const day = Number(m[2]);
  if (!month || day < 1 || day > 31) return null;
  return `${pad2(month)}-${pad2(day)}`;
}

function slugify(label) {
  return label
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

async function sparql(query) {
  const url = `${ENDPOINT}?query=${encodeURIComponent(query)}`;
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/sparql-results+json', 'User-Agent': USER_AGENT },
      });
      if (!res.ok) throw new Error(`SPARQL HTTP ${res.status}`);
      return (await res.json()).results.bindings;
    } catch (err) {
      lastErr = err;
      console.warn(`fetch-wikidata-occasions: attempt ${attempt} failed (${err.message})`);
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }
  throw lastErr;
}

const PASS1 = `
SELECT ?item ?en ?dayEn ?sitelinks WHERE {
  ?item wdt:P837 ?day .
  ?item wikibase:sitelinks ?sitelinks .
  ?day rdfs:label ?dayEn . FILTER(LANG(?dayEn) = "en")
  FILTER(REGEX(?dayEn, "^(January|February|March|April|May|June|July|August|September|October|November|December) [0-9]{1,2}$"))
  ?item rdfs:label ?en . FILTER(LANG(?en) = "en")
}`;

/** Batch-fetch multilingual labels for a set of QIDs. */
function labelsQuery(qids) {
  const values = qids.map((q) => `wd:${q}`).join(' ');
  const optionals = ALL_LOCALES.map(
    (loc) =>
      `  OPTIONAL { ?item rdfs:label ?l_${loc.replace('-', '')} . FILTER(LANG(?l_${loc.replace('-', '')}) = "${loc}") }`,
  ).join('\n');
  const selects = ALL_LOCALES.map((loc) => `(SAMPLE(?l_${loc.replace('-', '')}) AS ?${loc.replace('-', '')})`).join(' ');
  return `
SELECT ?item ${selects} WHERE {
  VALUES ?item { ${values} }
${optionals}
}
GROUP BY ?item`;
}

function build(pass1Rows) {
  // Group by item: earliest date, EN label, sitelinks, distinct dates.
  const byItem = new Map();
  for (const r of pass1Rows) {
    const qid = r.item.value.split('/').pop();
    const md = toMonthDay(r.dayEn?.value);
    if (!md) continue;
    const en = r.en?.value?.trim();
    if (!isFun(en)) continue;
    let e = byItem.get(qid);
    if (!e) {
      e = { qid, en, sitelinks: Number(r.sitelinks?.value ?? 0), dates: new Set() };
      byItem.set(qid, e);
    }
    e.dates.add(md);
  }
  const selected = [];
  const usedSlugs = new Set();
  for (const e of byItem.values()) {
    if (e.dates.size === 0 || e.dates.size > MAX_DATES_PER_OCCASION) continue;
    let slug = slugify(e.en);
    if (!slug) continue;
    if (EXCLUDE_SLUGS.has(slug)) continue;
    if (usedSlugs.has(slug)) slug = `${slug}_${e.qid.toLowerCase()}`;
    usedSlugs.add(slug);
    selected.push({ slug, qid: e.qid, en: e.en, sitelinks: e.sitelinks, date: [...e.dates].sort()[0] });
  }
  return selected;
}

async function main() {
  let pass1;
  try {
    pass1 = await sparql(PASS1);
  } catch (err) {
    console.warn(`fetch-wikidata-occasions: pass1 failed (${err.message}).`);
    if (existsSync(OUT)) { console.warn('Keeping existing content/fun-occasions.json.'); process.exit(0); }
    process.exit(1);
  }

  const selected = build(pass1);
  console.log(`fetch-wikidata-occasions: ${selected.length} fun items selected from ${pass1.length} dated rows.`);
  if (selected.length < SANITY_MIN) {
    console.warn(`Only ${selected.length} (< ${SANITY_MIN}) — treating as a bad fetch.`);
    if (existsSync(OUT)) { console.warn('Keeping existing content/fun-occasions.json.'); process.exit(0); }
    process.exit(1);
  }

  // Pass 2: multilingual labels for the selected QIDs (batched by 120).
  const labelsByQid = new Map();
  const qids = selected.map((s) => s.qid);
  for (let i = 0; i < qids.length; i += 120) {
    const batch = qids.slice(i, i + 120);
    let rows;
    try {
      rows = await sparql(labelsQuery(batch));
    } catch (err) {
      console.warn(`labels batch ${i} failed (${err.message}) — EN-only for these.`);
      continue;
    }
    for (const r of rows) {
      const qid = r.item.value.split('/').pop();
      const labels = {};
      for (const loc of ALL_LOCALES) {
        const v = r[loc.replace('-', '')]?.value?.trim();
        if (v) labels[loc] = v;
      }
      labelsByQid.set(qid, labels);
    }
  }

  // Cap 3/day by sitelinks; attach labels (EN always present as fallback).
  const byDate = new Map();
  for (const s of selected) {
    (byDate.get(s.date) ?? byDate.set(s.date, []).get(s.date)).push(s);
  }
  const occasions = [];
  for (const date of [...byDate.keys()].sort()) {
    const list = byDate.get(date).sort((a, b) => b.sitelinks - a.sitelinks || a.slug.localeCompare(b.slug)).slice(0, MAX_PER_DAY);
    for (const s of list) {
      const labels = labelsByQid.get(s.qid) ?? {};
      if (!labels.en) labels.en = s.en;
      occasions.push({ slug: s.slug, date: s.date, wikidata: s.qid, labels });
    }
  }

  const out = {
    source: 'Wikidata (SPARQL query.wikidata.org)',
    license: 'CC0-1.0',
    note: 'CC0 structured data. Full P837-dated pool filtered to a genuinely-fun allowlist (food/drink, animals, games, whimsy); serious topics and non-day entities dropped. Real observances only. Cap 3/day by sitelink notability.',
    generatedAt: new Date().toISOString(),
    count: occasions.length,
    occasions,
  };
  await writeFile(OUT, JSON.stringify(out, null, 2) + '\n', 'utf8');
  const days = new Set(occasions.map((o) => o.date)).size;
  console.log(`fetch-wikidata-occasions: ${occasions.length} fun occasions on ${days} days -> content/fun-occasions.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
