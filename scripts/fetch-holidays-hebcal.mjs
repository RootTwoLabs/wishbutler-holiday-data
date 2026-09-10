#!/usr/bin/env node
/**
 * Erzeugt das Israel-Paket (IL) aus der Hebcal-API.
 *
 * Nager.Date (Basis von fetch-holidays.mjs) und OpenHolidays kennen Israel
 * nicht. Hebcal liefert den juedischen Kalender keyless als JSON, ein Request
 * pro Jahr. Welche Eintraege uebernommen werden und wie sie heissen, steht
 * kuratiert in lib/hebcalHolidays.mjs (ISRAEL_HOLIDAYS).
 *
 * Alle Termine sind nicht-gregorianisch und landen als `precomputed`-Tabelle
 * (PRECOMPUTE_YEARS Jahre Vorlauf), wie die islamischen Feiertage.
 *
 * Nutzung: node scripts/fetch-holidays-hebcal.mjs
 */
import { SOURCES, PRECOMPUTE_FROM_YEAR, PRECOMPUTE_YEARS, localeForCountry } from './config.mjs';
import { fetchJsonWithTimeout, FailureBudget } from './lib/httpClient.mjs';
import { buildIsraelDefinitions } from './lib/hebcalHolidays.mjs';
import { holidayDefinition, writePackage } from './lib/packageWriter.mjs';

const COUNTRY = 'IL';

async function fetchJson(url) {
  return fetchJsonWithTimeout(url, { timeoutMs: 15000, retries: 2, backoffMs: 500 });
}

// Nur PRECOMPUTE_YEARS Requests: schon ein einzelnes fehlendes Jahr (10 %)
// waere eine sichtbare Luecke in der Tabelle, daher enge Budgetgrenze.
const fetchBudget = new FailureBudget({ maxFailureRate: 0.1, minSamples: 1 });

async function main() {
  const years = Array.from({ length: PRECOMPUTE_YEARS }, (_, i) => PRECOMPUTE_FROM_YEAR + i);
  console.log(`Building holidays for ${COUNTRY} via Hebcal (${years[0]}-${years.at(-1)})...`);

  const items = [];
  for (const year of years) {
    try {
      const json = await fetchJson(SOURCES.hebcal(year));
      if (!Array.isArray(json?.items)) throw new Error('malformed response (no items[])');
      items.push(...json.items);
      fetchBudget.success();
    } catch (err) {
      fetchBudget.failure();
      console.warn(`  ${COUNTRY} ${year}: ${err.message}`);
    }
  }
  fetchBudget.assertWithinBudget('fetch-holidays-hebcal');

  const { definitions, labels, missing, gaps } = buildIsraelDefinitions(items, { countryCode: COUNTRY });
  for (const slug of missing) console.warn(`  ${COUNTRY}: kein Termin fuer ${slug} — ausgelassen`);
  for (const gap of gaps) console.warn(`  ${COUNTRY}: Luecke bei ${gap}`);
  if (definitions.length === 0) throw new Error(`${COUNTRY}: no holidays matched, aborting`);

  const packaged = definitions.map(({ id, countryCode, slug, rule, category }) =>
    holidayDefinition({ id, countryCode, slug, rule, category }),
  );
  const nativeLocale = localeForCountry(COUNTRY);
  const packageLabels = { en: labels.en, [nativeLocale]: labels.he };

  const version = await writePackage(COUNTRY, packaged, packageLabels);
  console.log(
    `  ${COUNTRY}: v${version}, ${packaged.length} definitions, labels: ${Object.keys(packageLabels).join('+')}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
