/**
 * Reine Vergleichslogik fuer `scripts/verify-credits.mjs` (ohne Netz, ohne
 * Dateisystem — offline getestet): eine CREDITS-Zeile gegen das, was Wikimedia
 * Commons HEUTE fuer die Datei meldet (`extmetadata.LicenseShortName`, `Artist`).
 *
 * Hintergrund (Audit G-10, Runde 2): Beim Nachtragen der Zeilen war jede zehnte
 * deklarierte Lizenz falsch. Lizenzen aendern sich auf Commons ausserdem
 * nachtraeglich (Loeschung, Relizenzierung, korrigierte Vorlagen) — der Abgleich
 * ist deshalb wiederholbar und nicht einmalig.
 */
import { classifyLicense, isCc0OrPd, stripHtml } from './imageLicense.mjs';

const COMMONS_FILE_URL_RE = /^https?:\/\/commons\.wikimedia\.org\/wiki\/(File:[^?#]+)/i;

/** „https://commons.wikimedia.org/wiki/File:Foo_bar.jpg" -> „File:Foo bar.jpg" (sonst null). */
export function commonsTitleFromUrl(url) {
  const m = COMMONS_FILE_URL_RE.exec(String(url ?? ''));
  if (!m) return null;
  let title;
  try {
    title = decodeURIComponent(m[1]);
  } catch {
    return null;
  }
  title = title.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return /^File:.+/.test(title) ? `File:${title.slice(5).trim()}` : null;
}

/**
 * Lizenz-Kurzname vergleichbar machen: „CC-BY-SA-4.0", „CC BY-SA 4.0" und
 * „cc by-sa 4.0" sind dieselbe Lizenz. Laenderportierungen („3.0 de") bleiben
 * unterscheidbar — sie sind eigene Lizenztexte.
 */
export function normalizeLicense(license) {
  return stripHtml(String(license ?? ''))
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^cc 0\b/, 'cc0')
    .replace(/^cc zero\b/, 'cc0')
    .replace(/^cc0 1\.0$/, 'cc0')
    .trim();
}

/** Urhebername auf seinen Kern reduzieren (fuer den Vergleich, nie fuer die Ausgabe). */
export function normalizeAuthor(author) {
  return stripHtml(String(author ?? ''))
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\b(user|benutzer|utilisateur|usuario|utente):/g, ' ')
    .replace(/\((talk|diskussion|contribs?|email|e-mail)[^)]*\)/g, ' ')
    .replace(/\b(photo|foto|photograph|photographer|author|by|from|own work|eigenes werk)\b/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Platzhalter, mit denen die Fetcher einen fehlenden Urheber fuellen — keine Namensnennung. */
const PLACEHOLDER_AUTHOR_RE = /^(wikimedia commons|openverse|anonymous|(unknown( author)?\s*)+(or not provided)?)?$/;

export function isPlaceholderAuthor(author) {
  // Bewusst NICHT normalizeAuthor: das streicht das Wort „author" und wuerde
  // Commons' doppeltes „Unknown authorUnknown author" unkenntlich machen.
  const plain = stripHtml(String(author ?? '')).toLowerCase().replace(/\s+/g, ' ').trim();
  return PLACEHOLDER_AUTHOR_RE.test(plain);
}

/**
 * „wesentlich" verschieden: kein Name steckt im anderen und die Wortmengen
 * ueberlappen kaum. Schreibweisen, Wikilink-Reste („Foo (talk)"), angehaengte
 * Ortsangaben („Foo from Berlin") und Werkangaben gelten als kosmetisch.
 */
export function authorsDifferMaterially(a, b) {
  const x = normalizeAuthor(a);
  const y = normalizeAuthor(b);
  if (!x || !y) return x !== y;
  if (x === y || x.includes(y) || y.includes(x)) return false;
  const xs = new Set(x.split(' '));
  const ys = new Set(y.split(' '));
  const common = [...xs].filter((w) => ys.has(w)).length;
  return common / Math.min(xs.size, ys.size) < 0.5;
}

/**
 * Vergleicht EINE CREDITS-Zeile mit dem Commons-Stand.
 *
 * @param {{ path: string, credit: string, license: string, sourceUrl?: string }} line
 * @param {{ missing?: boolean, license?: string, artist?: string, attribution?: string }|null|undefined} commons
 *   `null`/`undefined` = keine Commons-Quelle bekannt; `missing` = Datei auf Commons geloescht/unauffindbar.
 * @returns {{ status: string, severity: 'error'|'warn'|'ok', detail?: string, suggestion?: { license?: string, credit?: string } }}
 *
 * Status (nach Schwere):
 *   - `no-source`            Zeile ohne belegbare Commons-URL
 *   - `missing-on-commons`   Datei geloescht/verschoben ohne Weiterleitung -> Bild ersetzen
 *   - `license-not-allowed`  echte Lizenz nicht auf der Allowlist (NC/ND/GFDL/unfrei/leer) -> Bild ersetzen
 *   - `license-mismatch`     andere (erlaubte) Lizenz -> Zeile korrigieren
 *   - `author-missing`       attributionspflichtig, aber Zeile nennt nur einen Platzhalter
 *   - `author-mismatch`      attributionspflichtig, Urheber weicht wesentlich ab
 *   - `author-note`          Abweichung ohne Attributionspflicht (CC0/PD) — nur Hinweis
 *   - `ok`
 */
export function compareCredit(line, commons) {
  if (!commons) return { status: 'no-source', severity: 'warn', detail: 'keine Commons-Quelle (weder Zeile noch Paket-Ref)' };
  if (commons.missing) return { status: 'missing-on-commons', severity: 'error', detail: 'Datei auf Commons nicht (mehr) vorhanden' };

  const actual = classifyLicense(commons.license);
  if (!actual) {
    return {
      status: 'license-not-allowed',
      severity: 'error',
      detail: `Commons: "${stripHtml(commons.license ?? '') || '—'}" (nicht auf der Allowlist)`,
    };
  }
  if (normalizeLicense(actual) !== normalizeLicense(line.license)) {
    return {
      status: 'license-mismatch',
      severity: 'error',
      detail: `Zeile "${line.license}" -> Commons "${actual}"`,
      suggestion: { license: actual },
    };
  }

  // Wer genannt werden will, sagt Commons ueber `Attribution` (hat Vorrang) oder `Artist`.
  const wanted = stripHtml(commons.attribution ?? '') || stripHtml(commons.artist ?? '');
  const needsAttribution = !isCc0OrPd(actual);
  if (needsAttribution && isPlaceholderAuthor(line.credit)) {
    return wanted && !isPlaceholderAuthor(wanted)
      ? { status: 'author-missing', severity: 'error', detail: `Zeile "${line.credit}" -> Commons "${wanted}"`, suggestion: { credit: wanted } }
      : { status: 'author-missing', severity: 'error', detail: `Zeile "${line.credit}", Commons nennt keinen Urheber — von Hand klaeren` };
  }
  if (wanted && !isPlaceholderAuthor(wanted) && authorsDifferMaterially(line.credit, wanted)) {
    return needsAttribution
      ? { status: 'author-mismatch', severity: 'error', detail: `Zeile "${line.credit}" -> Commons "${wanted}"`, suggestion: { credit: wanted } }
      : { status: 'author-note', severity: 'ok', detail: `Zeile "${line.credit}" / Commons "${wanted}" (keine Attributionspflicht)` };
  }
  return { status: 'ok', severity: 'ok' };
}
