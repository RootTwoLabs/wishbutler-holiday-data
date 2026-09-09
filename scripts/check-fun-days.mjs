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
import { FUN_LOCALES, loadFunDays, validateFunDays } from './lib/funDays.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const localesArg = args.find((a) => a.startsWith('--locales='))?.slice('--locales='.length);
const locales = localesArg ? localesArg.split(',').map((s) => s.trim()).filter(Boolean) : FUN_LOCALES;
const requireImages = !args.includes('--no-images');

const data = await loadFunDays(join(ROOT, 'content', 'fun-days'), locales);
const errors = validateFunDays(data, { imagesRoot: join(ROOT, 'data', 'images'), requireImages, locales });

console.log(`fun-days: ${data.days.length}/366 Tage, Locales [${locales.join(', ')}], Bildpflicht ${requireImages ? 'an' : 'aus'}`);
if (errors.length > 0) {
  console.error(`${errors.length} Fehler:\n` + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log('OK');
