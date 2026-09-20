/** Explicit product exclusions, independent of the upstream legal classification.
 * June 17, 2028 is a one-off Berlin holiday, not a recurring greeting occasion.
 * Keep historical packages intact; omit this definition from future imports.
 */
export const EXCLUDED_HOLIDAY_IDS = new Set([
  'DE_75th_anniversary_of_the_uprising_of_june_17_1953',
]);

/**
 * Neue Nager-IDs, fuer die noch KEINE Labels in allen 17 App-Sprachen
 * vorliegen (content/holiday-labels/<locale>.json). Sie bleiben draussen, bis
 * die Uebersetzungen nachgezogen sind — ein Anlass mit nur englischem/
 * nativem Label wuerde in 15 Sprachen roh erscheinen. Uebersetzen ist ein
 * bewusster manueller Schritt (Google-Endpoint nur lokal, nicht in CI); danach
 * den Eintrag hier entfernen und `npm run build:holidays -- <CC>` laufen lassen.
 *
 * Stand 2026-09-20 (Audit Paket 2a, Lauf gegen Nager.Date):
 */
export const UNTRANSLATED_HOLIDAY_IDS = new Set([
  'PE_battle_of_junin', // Nager neu seit 09/2026 (06.08., Public)
  'PE_battle_of_ayacucho', // Nager neu seit 09/2026 (09.12., Public)
]);

export function isSelectedHoliday(id) {
  return !EXCLUDED_HOLIDAY_IDS.has(id) && !UNTRANSLATED_HOLIDAY_IDS.has(id);
}
