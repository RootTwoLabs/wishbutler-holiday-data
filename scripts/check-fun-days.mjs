#!/usr/bin/env node
/**
 * Prüft content/fun-days/ während der Erstellung.
 *
 * Usage: node scripts/check-fun-days.mjs [--locales=de,en] [--no-images]
 *   --locales   nur diese Locales prüfen (Default: alle 12)
 *   --no-images Bildpflicht aussetzen (solange fetch-images noch nicht lief)
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FUN_LOCALES, expectedFunDays, loadFunDays, validateFunDays } from './lib/funDays.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

const unknownFlags = args.filter((a) => a !== '--no-images' && !a.startsWith('--locales='));
if (unknownFlags.length > 0) {
  console.error(`Unbekannte Flags: ${unknownFlags.join(', ')}`);
  process.exit(2);
}

const localesArg = args.find((a) => a.startsWith('--locales='))?.slice('--locales='.length);
const locales = localesArg ? localesArg.split(',').map((s) => s.trim()).filter(Boolean) : FUN_LOCALES;
const unknownLocales = locales.filter((l) => !FUN_LOCALES.includes(l));
if (unknownLocales.length > 0) {
  console.error(`Unbekannte Locale(s): ${unknownLocales.join(', ')} (erlaubt: ${FUN_LOCALES.join(', ')})`);
  process.exit(2);
}
const requireImages = !args.includes('--no-images');

const data = await loadFunDays(join(ROOT, 'content', 'fun-days'), locales);
const errors = validateFunDays(data, { imagesRoot: join(ROOT, 'data', 'images'), requireImages });

// Erwartet werden alle Kalendertage außer den bewusst leeren Blackout-Tagen
// (content/fun-days/blackout.json).
const expected = expectedFunDays(data.blackout);
const validDates = new Set(expected);
const uniqueValidDays = new Set(
  data.days.filter((d) => typeof d.date === 'string' && validDates.has(d.date)).map((d) => d.date),
).size;
const blackoutCount = Object.keys(data.blackout ?? {}).length;

console.log(
  `fun-days: ${uniqueValidDays}/${expected.length} Tage` +
    (blackoutCount > 0 ? ` (+${blackoutCount} bewusst leer)` : '') +
    `, Locales [${locales.join(', ')}], Bildpflicht ${requireImages ? 'an' : 'aus'}`,
);
if (errors.length > 0) {
  console.error(`${errors.length} Fehler:\n` + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log('OK');
