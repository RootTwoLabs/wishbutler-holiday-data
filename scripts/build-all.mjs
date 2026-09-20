#!/usr/bin/env node
/**
 * Orchestrates the full generation pipeline:
 *   holidays -> hebcal -> namedays -> fun-occasions -> articles -> labels -> memorial -> index -> validate
 *
 * Each step is a separate module so they can also be run individually.
 *
 * FUN (kuriose Feiertage) wird ausschliesslich aus dem kuratierten Content in
 * content/fun-days/ gebaut (Labels + Artikel in allen 17 Locales als Content,
 * kein Harvest, keine Uebersetzungs-Skripte).
 *
 * G-8: Bilder holt die Pipeline NICHT mehr selbst. `fetch-images.mjs` laeuft nur
 * noch manuell (`npm run build:images [CC/slug …]`, FUN mit `--fun`), gefolgt
 * von Kuratierung (`curate-images.mjs`), `build:thumbnails` und Commit.
 * Vorher haette der monatliche CI-Cron fuer jedes Ziel ohne Bild (z. B.
 * `fathers_day_de`) bis zu drei unkuratierte Commons/Openverse-Treffer samt
 * CREDITS-Zeilen committet — ohne Thumbnails und am Kuratierungs-Workflow
 * vorbei. build-articles/build-fun-occasions referenzieren nur die
 * eingecheckten Bilddateien.
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
    // 'fetch-images.mjs' — bewusst NICHT in der Pipeline (G-8, siehe Kopf).
    'build-fun-occasions.mjs',
    'build-articles.mjs',
    'build-labels.mjs',
    'build-memorial.mjs',
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
