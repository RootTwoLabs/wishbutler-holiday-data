#!/usr/bin/env node
/**
 * Autoren-Werkzeug: listet Bildkandidaten von Wikimedia Commons für einen
 * Suchbegriff, damit ein Mensch (oder Agent) das passende Foto für einen
 * kuriosen Feiertag auswählen und als `imageFile` in content/fun-days/days/
 * eintragen kann. Reine Lesehilfe, lädt nichts ins Repo.
 *
 * Usage: node scripts/commons-candidates.mjs "<term>" [--limit=8] [--qi] [--depicts] [--any-license]
 *   --qi          nur Bilder aus Category:Quality_images
 *   --depicts     Begriff über Wikidata zu einem Item auflösen und per
 *                 haswbstatement:P180=<QID> (Motiv „zeigt") suchen
 *   --any-license auch nicht-freie Lizenzstrings anzeigen (Default: nur CC0/PD/CC BY/CC BY-SA)
 *
 * Ausgabe je Zeile: File-Titel | Breite x Höhe | Lizenz | Kategorien | Thumbnail-URL (320 px)
 */
import { fetchWithTimeout } from './lib/httpClient.mjs';
import { classifyLicense, stripHtml } from './lib/imageLicense.mjs';

const USER_AGENT = 'wishbutler-holiday-data/1.0 (https://github.com/RootTwoLabs/wishbutler-holiday-data)';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

const args = process.argv.slice(2);
const term = args.filter((a) => !a.startsWith('--')).join(' ').trim();
const limit = Number(args.find((a) => a.startsWith('--limit='))?.slice(8) ?? 8);
const qiOnly = args.includes('--qi');
const depicts = args.includes('--depicts');
const anyLicense = args.includes('--any-license');

if (!term) {
  console.error('usage: node scripts/commons-candidates.mjs "<term>" [--limit=8] [--qi] [--depicts]');
  process.exit(2);
}

async function getJson(url) {
  const res = await fetchWithTimeout(url, { headers: { 'User-Agent': USER_AGENT }, timeoutMs: 20000, retries: 1 });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function resolveQid(text) {
  const url = `${WIKIDATA_API}?action=wbsearchentities&format=json&language=en&type=item&limit=1&search=${encodeURIComponent(text)}`;
  const json = await getJson(url);
  const hit = json?.search?.[0];
  return hit ? { id: hit.id, label: hit.label, description: hit.description ?? '' } : null;
}

async function main() {
  let query = term;
  if (depicts) {
    const item = await resolveQid(term);
    if (!item) {
      console.error(`Wikidata: kein Item für "${term}"`);
      process.exit(1);
    }
    console.error(`Wikidata: ${item.id} ${item.label} — ${item.description}`);
    query = `haswbstatement:P180=${item.id}`;
  }
  const parts = [query, 'filetype:bitmap'];
  if (qiOnly) parts.push('incategory:Quality_images');
  const url =
    `${COMMONS_API}?action=query&format=json&generator=search` +
    `&gsrsearch=${encodeURIComponent(parts.join(' '))}&gsrnamespace=6&gsrlimit=${limit}` +
    `&prop=imageinfo|categories&iiprop=url|size|mime|extmetadata&iiurlwidth=320` +
    `&clshow=!hidden&cllimit=12`;
  const json = await getJson(url);
  const pages = Object.values(json?.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  if (pages.length === 0) {
    console.log('(keine Treffer)');
    return;
  }
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    const licenseRaw = stripHtml(info.extmetadata?.LicenseShortName?.value ?? '');
    const license = classifyLicense(licenseRaw);
    if (!license && !anyLicense) continue;
    const cats = (page.categories ?? []).map((c) => c.title.replace(/^Category:/, '')).slice(0, 5).join('; ');
    console.log(
      `${page.title} | ${info.width}x${info.height} | ${license ?? `NICHT FREI (${licenseRaw})`} | ${cats} | ${info.thumburl}`,
    );
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
