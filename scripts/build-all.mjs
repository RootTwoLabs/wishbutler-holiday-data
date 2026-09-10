#!/usr/bin/env node
/**
 * Orchestrates the full generation pipeline:
 *   holidays -> hebcal -> namedays -> images -> fun-occasions -> articles -> labels -> index -> validate
 *
 * Each step is a separate module so they can also be run individually.
 *
 * FUN (kuriose Feiertage) wird ausschliesslich aus dem kuratierten Content in
 * content/fun-days/ gebaut (Labels + Artikel in allen 17 Locales als Content,
 * kein Harvest, keine Uebersetzungs-Skripte). Die FUN-Bilder holt der CI-Lauf
 * nie selbst (fetch-images.mjs ohne --fun ueberspringt FUN); sie werden lokal
 * mit `node scripts/fetch-images.mjs --fun` kuratiert und eingecheckt.
 * build-fun-occasions.mjs laeuft NACH fetch-images.mjs, weil das Paket die
 * vorhandenen Bilddateien referenziert.
 */
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(__dirname, script)], { stdio: 'inherit' });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${script} exited ${code}`))));
  });
}

async function main() {
  const steps = [
    'fetch-holidays.mjs',
    'fetch-holidays-hebcal.mjs',
    'fetch-namedays.mjs',
    'fetch-images.mjs',
    'build-fun-occasions.mjs',
    'build-articles.mjs',
    'build-labels.mjs',
    'build-index.mjs',
    'validate.mjs',
  ];
  for (const step of steps) {
    console.log(`\n=== ${step} ===`);
    await run(step);
  }
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
