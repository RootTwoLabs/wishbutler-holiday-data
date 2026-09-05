#!/usr/bin/env node
/**
 * Orchestrates the full generation pipeline:
 *   holidays -> namedays -> fun-occasions -> images -> articles -> labels -> index -> validate
 *
 * Each step is a separate module so they can also be run individually.
 *
 * NICHT Teil des Builds (manuelle Kurations-Schritte, lokal ausfuehren):
 *   npm run harvest:fun-occasions    (Wikidata-SPARQL, Ergebnis schwankt)
 *   npm run translate:fun-occasions  (freier Google-Endpoint, Cache gitignored)
 * Die committete content/fun-occasions.json mit allen Sprach-Labels ist die
 * Quelle fuer build-fun-occasions.mjs. In CI wuerde der Harvest sie
 * ueberschreiben und die Uebersetzung ohne Cache ~500 Google-Calls machen,
 * die von GitHub-Runner-IPs mit 429 abgewiesen werden (Run 2026-09-05:
 * 1,5 h Laufzeit, 0 Labels, Abbruch wegen fehlendem de-Label).
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
    'build-fun-occasions.mjs',
    'fetch-images.mjs',
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
