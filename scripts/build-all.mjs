#!/usr/bin/env node
/**
 * Orchestrates the full generation pipeline:
 *   holidays -> namedays -> images -> index -> validate
 *
 * Each step is a separate module so they can also be run individually.
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
    'fetch-namedays.mjs',
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
