/**
 * Slug-Ableitung aus Nager.Date-Namen — geteilt von fetch-holidays.mjs und
 * migrate-tentative-rules.mjs.
 *
 * G-6 (Audit 2026-09-20): Nager haengt an noch nicht amtlich bestaetigte
 * Termine (islamische Feste, AFL Grand Final …) das Suffix "(tentative date)"
 * an den Namen. Bisher wurde daraus eine EIGENE Definition
 * (`TR_eid_al_fitr_first_day` nur 2026 + `…_tentative_date` 2027–2030): Die
 * vom Nutzer aktivierte ID endete 2026, ab 2027 fehlte das Fest. Der Anlass ist
 * derselbe — das Suffix wird deshalb vor dem Slug entfernt, sodass alle Jahre in
 * einer Definition landen.
 */

/** Nager-Suffixe, die keinen eigenen Anlass bezeichnen (case-insensitiv, am Ende). */
const TENTATIVE_SUFFIX = /\s*\((?:tentative(?:\s+date)?|provisional(?:\s+date)?)\)\s*$/i;

/** Entfernt "(tentative date)" / "(tentative)" am Namensende. */
export function stripTentativeSuffix(name) {
  if (typeof name !== 'string') return name;
  return name.replace(TENTATIVE_SUFFIX, '').trim();
}

/** Slug-ID-Suffix, das die bisherige Slugify-Logik aus dem Nager-Suffix machte. */
export const TENTATIVE_SLUG_SUFFIX = /_tentative(?:_date)?$/;

/** Kanonischer Slug ohne `_tentative_date`/`_tentative`; identisch, wenn kein Suffix. */
export function canonicalSlugForTentative(slug) {
  return slug.replace(TENTATIVE_SLUG_SUFFIX, '');
}

/** Nager-Name -> Slug (Kleinbuchstaben, ASCII, `_`); Tentative-Suffix wird vorher entfernt. */
export function slugify(name) {
  return stripTentativeSuffix(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/['’‘]/g, '') // Apostrophe fallen weg: "New Year's" -> "new_years"
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
