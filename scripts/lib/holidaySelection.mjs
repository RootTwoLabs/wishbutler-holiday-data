/** Explicit product exclusions, independent of the upstream legal classification.
 * June 17, 2028 is a one-off Berlin holiday, not a recurring greeting occasion.
 * Keep historical packages intact; omit this definition from future imports.
 */
export const EXCLUDED_HOLIDAY_IDS = new Set([
  'DE_75th_anniversary_of_the_uprising_of_june_17_1953',
]);

export function isSelectedHoliday(id) {
  return !EXCLUDED_HOLIDAY_IDS.has(id);
}
