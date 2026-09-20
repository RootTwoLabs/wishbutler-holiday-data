/**
 * Eine kuratierte Commons-Datei holen (curate-images.mjs `replace`): Metadaten
 * per API, Lizenz gegen die Allowlist, 1280-px-JPEG-Rendition wie bei
 * fetch-images — mit denselben Download-Haertungen (https, Content-Type,
 * Groessenlimit, Magic Bytes). Netzteil bewusst getrennt von der offline
 * getesteten Dateilogik in imageCuration.mjs.
 */
import { classifyLicense, isCc0OrPd, stripHtml } from './imageLicense.mjs';
import { commonsFileUrl } from './imageCredits.mjs';
import { fetchWithTimeout } from './httpClient.mjs';
import { sniffImageType, isImageContentType, MAX_IMAGE_BYTES } from './imageValidation.mjs';

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'wishbutler-holiday-data/1.0 (https://github.com/RootTwoLabs/wishbutler-holiday-data)';
export const RENDITION_WIDTH = 1280;

/**
 * Aus der API-Antwort (`imageinfo[0]`) den Credit ableiten — rein, testbar.
 * Wirft, statt zu raten: unfreie Lizenz, oder attributionspflichtig ohne
 * Urheber (dann muss der Mensch ihn belegt per `creditOverride` angeben).
 */
export function creditFromImageInfo(title, info, { creditOverride } = {}) {
  if (!info?.thumburl && !info?.url) throw new Error(`${title}: auf Commons nicht gefunden`);
  const license = classifyLicense(info.extmetadata?.LicenseShortName?.value);
  if (!license) {
    throw new Error(`${title}: Lizenz "${stripHtml(info.extmetadata?.LicenseShortName?.value ?? '') || '—'}" steht nicht auf der Allowlist (CC0/PD/CC BY/CC BY-SA)`);
  }
  const artist = stripHtml(info.extmetadata?.Artist?.value ?? '');
  const credit = (creditOverride ?? '').trim() || artist;
  if (!credit) {
    if (!isCc0OrPd(license)) throw new Error(`${title}: ${license} verlangt Namensnennung, Commons nennt keinen Urheber — belegt per --credit="…" angeben oder anderes Bild waehlen`);
    throw new Error(`${title}: Commons nennt keinen Urheber — per --credit="…" angeben (z. B. "Unknown author")`);
  }
  return { credit, license, sourceUrl: commonsFileUrl(title) ?? info.descriptionurl };
}

export async function fetchCommonsImageInfo(title, width = RENDITION_WIDTH) {
  const url =
    `${COMMONS_API}?action=query&format=json&redirects=1&titles=${encodeURIComponent(title)}` +
    `&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=${width}`;
  const res = await fetchWithTimeout(url, { headers: { 'User-Agent': USER_AGENT }, timeoutMs: 20000, retries: 2, backoffMs: 800 });
  if (!res.ok) throw new Error(`Commons info HTTP ${res.status}`);
  const page = Object.values((await res.json())?.query?.pages ?? {})[0];
  return { title: page?.title ?? title, info: page?.imageinfo?.[0] };
}

/** Laedt die Rendition und gibt die JPEG-Bytes zurueck (kein Schreiben ins Repo). */
export async function downloadJpeg(url, maxBytes = MAX_IMAGE_BYTES) {
  if (!/^https:\/\//.test(String(url))) throw new Error('non-https image url');
  const res = await fetchWithTimeout(url, { headers: { 'User-Agent': USER_AGENT }, timeoutMs: 30000, retries: 2, backoffMs: 800 });
  if (!res.ok) throw new Error(`download HTTP ${res.status}`);
  if (!isImageContentType(res.headers.get('content-type'))) throw new Error(`unexpected content-type ${res.headers.get('content-type') ?? 'none'}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > maxBytes) throw new Error(`image too large (${buf.length} bytes > ${maxBytes})`);
  if (sniffImageType(buf) !== 'jpeg') throw new Error('not a JPEG (nur JPEG-Quellen — Pakete referenzieren NN.jpg)');
  return buf;
}
