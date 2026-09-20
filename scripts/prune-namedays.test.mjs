import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pruneCountry } from './prune-namedays.mjs';
import { writePackageIfChanged } from './lib/packageWriter.mjs';

const BASE = {
  countryCode: 'XX',
  schemaVersion: 1,
  definitions: [{ id: 'XX_day', countryCode: 'XX', kind: 'fixed', labelKey: 'holidays.day', iconName: 'event', category: 'public', rule: { type: 'fixed', month: 1, day: 1 } }],
  namedays: { '01-01': ['Nový rok', 'Anna'], '06-24': ['Johannes Döparens dag'], '12-26': ['Krunoslav'] },
  i18n: { holidays: { en: { day: 'Day' } } },
  images: { day: [{ path: 'images/XX/day/01.jpg', license: 'CC0' }] },
};

async function withPackagesDir(fn) {
  const packagesDir = await mkdtemp(join(tmpdir(), 'prune-namedays-'));
  try {
    await fn(packagesDir);
  } finally {
    await rm(packagesDir, { recursive: true, force: true });
  }
}

test('G-11: prune schreibt bereinigte Tabelle als neue Version, alte bleibt byte-gleich', async () => {
  await withPackagesDir(async (packagesDir) => {
    await writePackageIfChanged('XX', BASE, { packagesDir });
    const v1Before = await readFile(join(packagesDir, 'XX', 'v1', 'package.json'), 'utf8');

    const dry = await pruneCountry('XX', { packagesDir, dryRun: true });
    assert.equal(dry.status, 'dry-run');
    assert.equal(dry.removed.length, 2);
    assert.deepEqual(await readdir(join(packagesDir, 'XX')), ['v1']);

    const r = await pruneCountry('XX', { packagesDir });
    assert.equal(r.status, 'written');
    assert.deepEqual({ version: r.version, prev: r.prev, days: r.days }, { version: 2, prev: 1, days: 2 });
    assert.deepEqual(r.removed, [
      { day: '01-01', name: 'Nový rok' },
      { day: '06-24', name: 'Johannes Döparens dag' },
    ]);
    assert.equal(await readFile(join(packagesDir, 'XX', 'v1', 'package.json'), 'utf8'), v1Before);

    const v2 = JSON.parse(await readFile(join(packagesDir, 'XX', 'v2', 'package.json'), 'utf8'));
    assert.equal(v2.version, 2);
    assert.deepEqual(v2.namedays, { '01-01': ['Anna'], '12-26': ['Krunoslav'] });
    assert.deepEqual(v2.definitions, BASE.definitions);
    assert.deepEqual(v2.images, BASE.images);
    assert.deepEqual(Object.keys(v2), ['countryCode', 'version', 'schemaVersion', 'definitions', 'namedays', 'i18n', 'images']);

    // Zweiter Lauf: nichts mehr zu entfernen, kein Bump.
    const again = await pruneCountry('XX', { packagesDir });
    assert.equal(again.status, 'unchanged');
    assert.deepEqual(await readdir(join(packagesDir, 'XX')), ['v1', 'v2']);
  });
});

test('G-11: Pakete ohne Namenstage oder ohne Version werden uebersprungen', async () => {
  await withPackagesDir(async (packagesDir) => {
    const { namedays, ...noNamedays } = BASE;
    await writePackageIfChanged('YY', noNamedays, { packagesDir });
    assert.equal((await pruneCountry('YY', { packagesDir })).status, 'no-namedays');
    assert.equal((await pruneCountry('ZZ', { packagesDir })).status, 'no-package');
    assert.deepEqual(await readdir(join(packagesDir, 'YY')), ['v1']);
  });
});
