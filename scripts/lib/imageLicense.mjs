/**
 * License classification for holiday info images.
 *
 * G-3: Es gilt eine explizite Allowlist — CC0, Public Domain (PD-*), CC BY x.y
 * und CC BY-SA x.y. Alles andere (insbesondere NC/ND-Varianten, GFDL, Fair Use)
 * ist fuer eine kommerzielle App nicht nutzbar und wird abgelehnt. Frueher gab
 * es einen Fallback „enthaelt 'cc' oder 'public'“, der CC BY-NC/ND durchliess.
 */

const ACCEPTED_LICENSE =
  /(^public domain|^pd[ -]|^cc[ -]?0\b|^cc[ -]?by(?:[ -]sa)?(?:[ -]\d+(?:\.\d+)?)?(?:\s|$))/i;
const REJECTED_LICENSE =
  /fair use|all rights reserved|copyrighted free use|\bnc\b|\bnd\b|non[ -]?commercial|no[ -]?deriv|gfdl|gnu free doc/i;
const CC0_PD = /(^public domain|^pd[ -]|^cc[ -]?0\b)/i;

export function stripHtml(s) {
  if (!s) return '';
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/** Liefert den bereinigten Lizenz-String, wenn er auf der Allowlist steht, sonst null. */
export function classifyLicense(licenseShort) {
  const lic = stripHtml(licenseShort || '');
  if (!lic || REJECTED_LICENSE.test(lic)) return null;
  if (!ACCEPTED_LICENSE.test(lic)) return null;
  return lic;
}

export function isCc0OrPd(licenseShort) {
  const lic = stripHtml(licenseShort || '');
  return CC0_PD.test(lic) || /^public/i.test(lic);
}

export function needsCredit(licenseShort) {
  return !isCc0OrPd(licenseShort);
}
