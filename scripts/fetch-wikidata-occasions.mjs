#!/usr/bin/env node
/**
 * Harvests "fun / quirky occasions" (e.g. "Tag des Weines", "Pi-Tag") from
 * Wikidata via the public SPARQL endpoint and writes content/fun-occasions.json.
 *
 * LICENCE: Wikidata's structured data is released under CC0 1.0 (public domain
 * dedication) — free for commercial use, no attribution required. We record the
 * source anyway for provenance. See https://www.wikidata.org/wiki/Wikidata:Licensing
 *
 * Scope decisions (kept reproducible + license-clean):
 *  - Only items that are instance of `world day` (Q2558684), `awareness day`
 *    (Q422695) or `UN observance day` (Q18369361) — the modern "World/International
 *    ... Day" awareness observances, NOT religious/public/national holidays (those
 *    are the separate holiday feature).
 *  - Only FIXED Gregorian dates (P837 -> a "Month D" day item). Movable / non-
 *    Gregorian feasts are skipped.
 *  - Occasions that vary by country across MANY dates (e.g. Teacher's/Father's Day
 *    on 20 different days) are dropped — they are not a single global "fun day".
 *  - Multilingual labels are taken straight from Wikidata (de + en required;
 *    es/fr/it/pl/pt best-effort).
 *  - Ranked by sitelink count (notability proxy), capped at 3 per calendar day.
 *
 * Resilient by design: on a network/endpoint failure or an implausibly small
 * result it KEEPS the committed JSON and exits 0, so a Wikidata hiccup never
 * breaks the monthly data build.
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
  'WishButler-FunOccasions-Harvester/1.0 (https://wishbutler.app; contact: evgeny@nekhamkin.de)';
const REQUIRED_LOCALES = ['de', 'en'];
const OPTIONAL_LOCALES = ['es', 'fr', 'it', 'pl', 'pt'];
const MAX_PER_DAY = 3;
/** Drop occasions spread across more than this many distinct dates (country-varying). */
const MAX_DATES_PER_OCCASION = 2;
/** Below this many results we assume a broken fetch and keep the existing file. */
const SANITY_MIN = 40;

/**
 * Sensitivity denylist. The "awareness/world day" classes contain many SOLEMN
 * observances (genocide remembrance, disease, violence, war, poverty…). This is
 * a light-hearted "fun occasion → create a greeting" feature, so surfacing those
 * would be tasteless. Any occasion whose de/en label contains one of these
 * substrings is dropped. Deliberately broad — false negatives (a serious day
 * slipping through) are worse than false positives here.
 */
const SENSITIVE_TERMS = [
  // death / remembrance
  'holocaust', 'genocide', 'genozid', 'völkermord', 'victim', 'opfer', 'remembrance', 'gedenk',
  'memorial', 'mourning', 'trauer', 'death', 'deceased', 'verstorben', 'todes', 'martyr', 'märtyrer',
  'bereave', 'missing', 'vermisst', 'disappear', 'verschwund', 'fallen',
  // disease / health-tragedy
  'cancer', 'krebs', 'disease', 'krankheit', 'aids', 'hiv', 'malaria', 'tuberculos', 'tuberkulose',
  'hepatitis', 'diabetes', 'alzheimer', 'epilep', 'autism', 'autismus', 'sepsis', 'stroke',
  'schlaganfall', 'obesity', 'adipositas', 'mental health', 'psychische', 'suicide', 'suizid',
  'selbstmord', 'cardiac', 'palliative', 'palliativ', 'blood donor', 'blutspend', 'immunization',
  'impf', 'polio', 'leprosy', 'lepra', 'pneumon', 'sepsis', 'organ donation', 'organspend',
  'hospice', 'hospiz', 'palliativ', 'patient', 'disabilit', 'behinder', 'deaf', 'gehörlos',
  'blindness', 'erblind', 'illness', 'autistic', 'down syndrome', 'down-syndrom', 'thalassaem',
  'sorry', 'apolog', 'kranken', 'of the sick', 'kinderarbeit', 'child labour', 'child labor',
  // causes / "against …" / "abolition of …" awareness days (not celebrations)
  'tag gegen', 'day against', 'abschaffung', 'abolition', 'soldier', 'soldat', 'homophob',
  'transphob', 'exploitation', 'ausbeutung', 'victory over', 'v-j day', 'v-e day', 'liberation',
  'befreiung', 'whore', 'huren', 'prostitut', 'sex work', 'outcast', 'ausgestoßen', 'menstru',
  // violence / abuse
  'violence', 'gewalt', 'abuse', 'missbrauch', 'mutilation', 'verstümmel', 'genital', 'trafficking',
  'menschenhandel', 'slavery', 'sklaverei', 'rape', 'vergewaltig', 'femicide', 'femizid', 'torture',
  'folter', 'bullying', 'mobbing',
  // war / conflict
  'war', 'krieg', 'terror', 'landmine', 'landmine', 'nuclear', 'nuklear', 'atomwaffe', 'weapon',
  'waffe', 'conflict', 'konflikt', 'peace', 'frieden', 'disarmament', 'abrüstung',
  // poverty / disaster / displacement
  'poverty', 'armut', 'hunger', 'famine', 'hungersnot', 'disaster', 'katastrophe', 'refugee',
  'flüchtling', 'flucht', 'migrant', 'stateless', 'staatenlos', 'homeless', 'obdachlos',
  // rights / politics / discrimination
  'discrimination', 'diskriminierung', 'racism', 'rassismus', 'apartheid', 'tolerance', 'toleranz',
  'human rights', 'menschenrecht', 'corruption', 'korruption', 'press freedom', 'pressefreiheit',
  'hijab', 'circumcision', 'beschneidung', 'justice', 'gerechtigkeit',
];

function isSensitive(labels) {
  const hay = `${labels.en ?? ''} ${labels.de ?? ''}`.toLowerCase();
  return SENSITIVE_TERMS.some((t) => hay.includes(t));
}

const MONTHS = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
};

const QUERY = `
SELECT ?item ?sitelinks ?dayEn
  (SAMPLE(?l_de) AS ?de) (SAMPLE(?l_en) AS ?en) (SAMPLE(?l_es) AS ?es)
  (SAMPLE(?l_fr) AS ?fr) (SAMPLE(?l_it) AS ?it) (SAMPLE(?l_pl) AS ?pl) (SAMPLE(?l_pt) AS ?pt)
WHERE {
  VALUES ?cls { wd:Q2558684 wd:Q422695 wd:Q18369361 }
  ?item wdt:P31 ?cls .
  ?item wdt:P837 ?day .
  ?item wikibase:sitelinks ?sitelinks .
  ?day rdfs:label ?dayEn . FILTER(LANG(?dayEn) = "en")
  FILTER(REGEX(?dayEn, "^(January|February|March|April|May|June|July|August|September|October|November|December) [0-9]{1,2}$"))
  OPTIONAL { ?item rdfs:label ?l_de . FILTER(LANG(?l_de) = "de") }
  OPTIONAL { ?item rdfs:label ?l_en . FILTER(LANG(?l_en) = "en") }
  OPTIONAL { ?item rdfs:label ?l_es . FILTER(LANG(?l_es) = "es") }
  OPTIONAL { ?item rdfs:label ?l_fr . FILTER(LANG(?l_fr) = "fr") }
  OPTIONAL { ?item rdfs:label ?l_it . FILTER(LANG(?l_it) = "it") }
  OPTIONAL { ?item rdfs:label ?l_pl . FILTER(LANG(?l_pl) = "pl") }
  OPTIONAL { ?item rdfs:label ?l_pt . FILTER(LANG(?l_pt) = "pt") }
}
GROUP BY ?item ?sitelinks ?dayEn
ORDER BY DESC(?sitelinks)`;

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** "Month D" (Wikidata day-item en label) -> "MM-DD", or null. */
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
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

async function fetchRows() {
  const url = `${ENDPOINT}?query=${encodeURIComponent(QUERY)}`;
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/sparql-results+json', 'User-Agent': USER_AGENT },
      });
      if (!res.ok) throw new Error(`SPARQL HTTP ${res.status}`);
      const json = await res.json();
      return json.results.bindings;
    } catch (err) {
      lastErr = err;
      console.warn(`fetch-wikidata-occasions: attempt ${attempt} failed (${err.message})`);
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }
  throw lastErr;
}

function build(rows) {
  // Group rows by Wikidata item: collect its distinct dates, labels, sitelinks.
  const byItem = new Map();
  for (const r of rows) {
    const qid = r.item.value.split('/').pop();
    const monthDay = toMonthDay(r.dayEn?.value);
    if (!monthDay) continue;
    let entry = byItem.get(qid);
    if (!entry) {
      const labels = {};
      for (const loc of [...REQUIRED_LOCALES, ...OPTIONAL_LOCALES]) {
        const v = r[loc]?.value?.trim();
        if (v) labels[loc] = v;
      }
      entry = { qid, sitelinks: Number(r.sitelinks?.value ?? 0), labels, dates: new Set() };
      byItem.set(qid, entry);
    }
    entry.dates.add(monthDay);
  }

  // Keep only globally-datable, bilingual occasions. Emit exactly ONE date per
  // occasion (the earliest), so each slug/id is unique — the package validator
  // rejects a repeated id across days, and an occasion is one thing, not many.
  const flat = [];
  const usedSlugs = new Set();
  for (const entry of byItem.values()) {
    if (entry.dates.size === 0 || entry.dates.size > MAX_DATES_PER_OCCASION) continue;
    if (!REQUIRED_LOCALES.every((loc) => entry.labels[loc])) continue;
    if (isSensitive(entry.labels)) continue;

    let slug = slugify(entry.labels.en);
    if (!slug) continue;
    if (usedSlugs.has(slug)) slug = `${slug}_${entry.qid.toLowerCase()}`;
    usedSlugs.add(slug);

    const date = [...entry.dates].sort()[0];
    flat.push({ slug, date, sitelinks: entry.sitelinks, wikidata: entry.qid, labels: entry.labels });
  }

  // Cap 3 per calendar day, keeping the most notable (sitelinks desc, stable by slug).
  const byDate = new Map();
  for (const occ of flat) {
    if (!byDate.has(occ.date)) byDate.set(occ.date, []);
    byDate.get(occ.date).push(occ);
  }
  const occasions = [];
  for (const date of [...byDate.keys()].sort()) {
    const list = byDate
      .get(date)
      .sort((a, b) => b.sitelinks - a.sitelinks || a.slug.localeCompare(b.slug))
      .slice(0, MAX_PER_DAY);
    for (const o of list) {
      occasions.push({ slug: o.slug, date: o.date, wikidata: o.wikidata, labels: o.labels });
    }
  }
  return occasions;
}

async function main() {
  let rows;
  try {
    rows = await fetchRows();
  } catch (err) {
    console.warn(`fetch-wikidata-occasions: giving up (${err.message}).`);
    if (existsSync(OUT)) {
      console.warn('Keeping existing content/fun-occasions.json.');
      process.exit(0);
    }
    console.error('No existing data to fall back to.');
    process.exit(1);
  }

  const occasions = build(rows);
  if (occasions.length < SANITY_MIN) {
    console.warn(
      `fetch-wikidata-occasions: only ${occasions.length} occasions (< ${SANITY_MIN}) — treating as a bad fetch.`,
    );
    if (existsSync(OUT)) {
      console.warn('Keeping existing content/fun-occasions.json.');
      process.exit(0);
    }
    process.exit(1);
  }

  const out = {
    source: 'Wikidata (SPARQL query.wikidata.org)',
    license: 'CC0-1.0',
    note: 'Structured data from Wikidata, released under CC0. Fixed Gregorian dates only; instance of world day / awareness day / UN observance day; capped 3/day by sitelink notability.',
    generatedAt: new Date().toISOString(),
    count: occasions.length,
    occasions,
  };
  await writeFile(OUT, JSON.stringify(out, null, 2) + '\n', 'utf8');

  const days = new Set(occasions.map((o) => o.date)).size;
  console.log(`fetch-wikidata-occasions: ${occasions.length} occasions on ${days} days -> content/fun-occasions.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
