/**
 * G-11 (Audit 2026-09-20): Nicht-Namen aus den abalin-Namenstagstabellen.
 *
 * abalin liefert je Tag einen kommagetrennten String, in dem neben Vornamen
 * auch Festbezeichnungen stehen (SE 06-24 „Johannes Döparens dag", HR 06-24
 * „Rodenje Ivana Krstitelja", IT 12-25 „Natale Del Signore", CZ 05-01 „Svátek
 * práce"), Rollenbeschreibungen aus zerlegten Heiligenlisten (IT „Vescovo E
 * Dottore Della Chiesa") und Muell („40", „(Weihnachten)", „hence Božidar").
 * Die App zeigt jeden Eintrag als Namenstag einer Person — solche Strings
 * duerfen deshalb nicht ins Paket.
 *
 * Grundsatz: Nur EINDEUTIGE Nicht-Namen filtern. Phrasen, die mit einem
 * Vornamen beginnen und nur einen Titel/Beinamen tragen („Santo Stefano Primo
 * Martire", „Severino Abate", „Benedikt opat", „Eva Hl."), bleiben stehen —
 * lieber ein etwas sperriger Namenstag als ein verschwundener. Ebenso bleiben
 * echte Vornamen, die zugleich Festnamen sind (FR „Noël", FI „Vappu", ES
 * „Reyes", SE „Dag").
 *
 * Die Muster sind nach Sprache gruppiert und meist am Stringanfang verankert,
 * damit sie nicht in Namen hineinmatchen. Neue Kandidaten findet man mit
 * `node scripts/prune-namedays.mjs --dry-run` (listet alles, was faellt).
 */

/** Sommerzeit-Notizen aus dem franzoesischen Kalender („Rameaux +1h", „Jude -1h"). */
const DST_SUFFIX_RE = /\s[+-]\d+h$/;

/** Bereinigt einen Rohnamen (Whitespace, Sommerzeit-Suffix). Kein Filter. */
export function normalizeName(raw) {
  return String(raw).trim().replace(DST_SUFFIX_RE, '');
}

/**
 * Muster, die einen Eintrag als Nicht-Namen kennzeichnen. Reihenfolge egal;
 * `i`-Flag ueberall, `u` fuer Unicode-Klassen.
 */
export const NON_NAME_PATTERNS = [
  // --- sprachunabhaengig -------------------------------------------------
  /^(n\/a|support ukraine)/i, // abalin-Platzhalter (bisheriger Filter)
  /^\d+$/, // „40" (DE 03-10)
  /^[^\p{L}]+$/u, // nur Satzzeichen/Ziffern: „-" (ES 08-09)
  /^\(.*\)$/, // komplett eingeklammert: „(Weihnachten)"
  /^christmas\b/i, // „Christmas (Božić]" (HR)
  /^hence\b/i, // „hence Božidar" — Rest eines zerlegten Kommentars (HR)
  // --- Schwedisch: „…dag"/„…dagen" als Festtag -----------------------------
  /^\S{3,}dagen$/i, // Nyårsdagen, Juldagen, Allhelgonadagen, Kyndelsmässodagen
  /(^|\s)\S+dag(\s|$)/i, // Trettondedag jul, Marie bebådelsedag
  /\s\S+\sdag$/i, // Johannes Döparens dag, Menlösa barns dag
  // --- Deutsch -----------------------------------------------------------
  /^neujahr$/i,
  /^\S{3,}(fest|tag)$/i, // Schutzengelfest, Christfest, Schalttag
  /^3 könige$/i,
  /^verkündigung\b/i, // „Verkündigung d." (Mariae Verkuendigung)
  // --- Tschechisch / Slowakisch -----------------------------------------
  /^(nový|štědrý) (rok|den)$/i,
  /^tři králové$/i,
  /^(svátek|sviatok)\b/i, // Svátek práce, Sviatok práce
  /^\d\. svátek\b/i, // 1./2. svátek vánoční
  /^den\s/i, // Den osvobození ČSR, Den české státnosti …
  // (?=\s|$) statt \b: \b ist ASCII-basiert, „í"/„ć"/„à" gelten nicht als Wortzeichen.
  /^(květnové povstání|upálení mistra|boží hod)(?=\s|$)/i,
  /^(památka|pamiatka) (zesnulých|zosnulých)$/i,
  /^vianoce$/i,
  // --- Kroatisch ---------------------------------------------------------
  /^(rodenje|rođenje|glavosijek|uzašašće|uzašašce|pohod|prikazanje|preobraženje|uzvišenje|posveta|prijenos)(?=\s|$)/i,
  /^(presveto|bezgrešno)\b/i, // Presveto Srce Isusovo, Bezgrešno začeče BDM
  /^(mala |žalosna )?gospa\b/i, // Marienfeste („Gospa Fatimska", „Mala Gospa")
  /^(majka božja|mb |ime marijino|rane sv|kraljica svete)\b/i,
  /^uskrsni\b/i, // Uskrsni ponedjeljak
  /^(solinski|rimski|srijemski|drinske) (muc|prvomuc)/i, // Maertyrergruppen
  /^(papa mucenik|sveti vijet)\b/i,
  // --- Italienisch -------------------------------------------------------
  /^(solennità|solennita|commemorazione|dedicazione|presentazione|trasfigurazione|assunzione|ascensione|visitazione|esaltazione|martirio|natale|natività|nativita|immacolata|pasqua|conversione|cattedra|battesimo|epifania|ognissanti)(?=\s|$)/i,
  /^(i|ii|iii|iv|v)?\s?domenica\b/i, // I Domenica Di Quaresima, Domenica Delle Palme
  /^(venerdì|venerdi) santo$/i,
  /^mercoled/i, // Mercoledi' Delle Ceneri
  /^corpus domini$/i,
  /^ss\.? trinità$/i,
  /^(santissimo|sacratissimo) (nome|cuore)\b/i,
  /^cuore immacolato\b/i,
  /^angeli custodi$/i,
  /^cristo re\b/i,
  /^(beata vergine|b\.v\.) maria\b/i, // Marienfeste
  /^maria ss\. madre\b/i,
  /^(primi|santi|ss\. innocenti)? ?martiri\b/i, // Primi Martiri, Martiri Coreani …
  /^sette fondatori\b/i,
  /^(papa|vergine|diacono|vescovo|sacerdot[ei]|abate|dottore|patron[oa]|frate|vedova|principe|anacoreta) (e |della |dell'|d'|dei |polacco|cappuccino)/i, // Rollen ohne Namen
  // --- Franzoesisch ------------------------------------------------------
  /^(jour|fête|f\. des|l\. de|rameaux|armistice|nativité|la ste croix|prés\. marie|im\. concept|christ roi|conv\. )/i,
  /^(mardi gras|vendredi saint)$/i,
  /^n\.?-d\.?\s/i, // N.-D. Lourdes, N-D Mt-Carmel
  /^(pâques|ascension|pentecôte|toussaint)$/i,
  // --- Lettisch ----------------------------------------------------------
  /\sdiena$/i, // „Visu neparasto … vārdu diena" (Tag der unueblichen Namen)
];

/** true, wenn `name` (bereinigt) ein eindeutiger Nicht-Name ist. */
export function isNonName(name) {
  const n = normalizeName(name);
  if (n.length === 0) return true;
  return NON_NAME_PATTERNS.some((re) => re.test(n));
}

/**
 * Zerlegt abalins kommagetrennten String in bereinigte Vornamen (ohne
 * Nicht-Namen, ohne Duplikate, Reihenfolge erhalten).
 */
export function parseNames(raw) {
  if (typeof raw !== 'string') return [];
  const out = [];
  for (const part of raw.split(',')) {
    const n = normalizeName(part);
    if (n.length === 0 || isNonName(n) || out.includes(n)) continue;
    out.push(n);
  }
  return out;
}

/**
 * Anzahl Kalendertage mit mindestens einem Namen (0–366) — Basis fuer
 * `namedayDays` im Index und die Abdeckungswarnung im Validator.
 */
export function countNamedayDays(table) {
  let n = 0;
  for (const names of Object.values(table ?? {})) if (Array.isArray(names) && names.length > 0) n += 1;
  return n;
}

/**
 * Wendet den Filter auf eine fertige Tabelle (`MM-DD -> [names]`) an. Tage
 * ohne verbleibende Namen fallen weg. Liefert die neue Tabelle und die Liste
 * der entfernten Eintraege (`{ day, name }`) fuer Protokoll/Dry-Run.
 */
export function pruneNamedays(table) {
  const pruned = {};
  const removed = [];
  for (const [day, names] of Object.entries(table ?? {})) {
    const kept = [];
    for (const raw of names ?? []) {
      const n = normalizeName(raw);
      if (n.length === 0 || isNonName(n)) {
        removed.push({ day, name: String(raw) });
        continue;
      }
      if (!kept.includes(n)) kept.push(n);
    }
    if (kept.length > 0) pruned[day] = kept;
  }
  return { table: pruned, removed };
}
