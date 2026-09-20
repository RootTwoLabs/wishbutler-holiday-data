import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyNamedays, withNamedays } from './fetch-namedays.mjs';
import { writePackageIfChanged } from './lib/packageWriter.mjs';

const BASE = {
  countryCode: 'XX',
  schemaVersion: 1,
  definitions: [{ id: 'XX_day', countryCode: 'XX', kind: 'fixed', labelKey: 'holidays.day', iconName: 'event', category: 'public', rule: { type: 'fixed', month: 1, day: 1 } }],
  namedays: { '01-01': ['Anna'], '01-02': ['Bert'] },
  i18n: { holidays: { en: { day: 'Day' } } },
  images: { day: [{ path: 'images/XX/day/01.jpg', license: 'CC0' }] },
};

async function withPackagesDir(fn) {
  const packagesDir = await mkdtemp(join(tmpdir(), 'namedays-'));
  try {
    await fn(packagesDir);
  } finally {
    await rm(packagesDir, { recursive: true, force: true });
  }
}

test('withNamedays: kanonische Feldreihenfolge, ohne version', () => {
  const out = withNamedays({ ...BASE, version: 3 }, { '02-02': ['Cleo'] });
  assert.deepEqual(Object.keys(out), ['countryCode', 'schemaVersion', 'definitions', 'namedays', 'i18n', 'images']);
  assert.deepEqual(out.namedays, { '02-02': ['Cleo'] });
});

test('G-7: neue Namenstage -> neue Version, alte Version bleibt unangetastet', async () => {
  await withPackagesDir(async (packagesDir) => {
    await writePackageIfChanged('XX', BASE, { packagesDir });
    const v1Before = await readFile(join(packagesDir, 'XX', 'v1', 'package.json'), 'utf8');

    const result = await applyNamedays('XX', { '01-01': ['Anna'], '01-02': ['Bert'], '01-03': ['Cleo'] }, { packagesDir });
    assert.deepEqual(result, { status: 'written', version: 2, prev: 1 });
    assert.deepEqual(await readdir(join(packagesDir, 'XX')), ['v1', 'v2']);
    assert.equal(await readFile(join(packagesDir, 'XX', 'v1', 'package.json'), 'utf8'), v1Before);

    const v2 = JSON.parse(await readFile(join(packagesDir, 'XX', 'v2', 'package.json'), 'utf8'));
    assert.equal(v2.version, 2);
    assert.deepEqual(Object.keys(v2.namedays), ['01-01', '01-02', '01-03']);
    assert.deepEqual(v2.images, BASE.images);
    assert.deepEqual(v2.i18n, BASE.i18n);
  });
});

test('G-7: identische Namenstage -> kein Bump; lueckenhaftere Tabelle wird nicht uebernommen', async () => {
  await withPackagesDir(async (packagesDir) => {
    await writePackageIfChanged('XX', BASE, { packagesDir });

    assert.deepEqual(await applyNamedays('XX', BASE.namedays, { packagesDir }), { status: 'unchanged', version: 1, prev: 1 });
    assert.deepEqual(await applyNamedays('XX', { '01-01': ['Anna'] }, { packagesDir }), { status: 'kept', version: 1, existing: 2, entries: 1 });
    assert.deepEqual(await readdir(join(packagesDir, 'XX')), ['v1']);

    assert.deepEqual(await applyNamedays('YY', { '01-01': ['Anna'] }, { packagesDir }), { status: 'no-package' });
  });
});
