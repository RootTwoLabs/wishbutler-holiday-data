/** License classification for holiday info images. */

const ACCEPTED_LICENSE =
  /(^public domain|^pd[ -]|cc[ -]?0|cc[ -]?by(?:[ -]sa)?(?:[ -]\d|$))/i;
const REJECTED_LICENSE = /fair use|all rights reserved|copyrighted free use/i;
const CC0_PD = /(^public domain|^pd[ -]|cc[ -]?0)/i;

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

export function classifyLicense(licenseShort) {
  const lic = stripHtml(licenseShort || '');
  if (!lic || REJECTED_LICENSE.test(lic)) return null;
  if (!ACCEPTED_LICENSE.test(lic) && !/public/i.test(lic) && !/cc/i.test(lic)) return null;
  return lic;
}

export function isCc0OrPd(licenseShort) {
  const lic = stripHtml(licenseShort || '');
  return CC0_PD.test(lic) || /^public/i.test(lic);
}

export function needsCredit(licenseShort) {
  return !isCc0OrPd(licenseShort);
}
