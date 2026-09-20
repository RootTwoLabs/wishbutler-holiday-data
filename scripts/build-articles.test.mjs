import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildGlobalContent, isGlobalImageFolder } from './build-articles.mjs';

test('isGlobalImageFolder: nur snake_case-Slugs, keine Paket-Namensraeume (G-13 c)', () => {
  for (const slug of ['new_year', 'christmas', 'st_stephen', 'womens_day']) {
    assert.equal(isGlobalImageFolder(slug), true, slug);
  }
  for (const ns of ['DE', 'US', 'FUN', 'MEMORIAL', 'Memorial', '.cache', '']) {
    assert.equal(isGlobalImageFolder(ns), false, ns);
  }
});

test('buildGlobalContent: MEMORIAL-/FUN-/Laenderordner werden kein Bild-Key im GLOBAL-Paket', async () => {
  const dataRoot = await mkdtemp(join(tmpdir(), 'wb-global-'));
  try {
    const files = [
      'images/new_year/01.jpg',
      'images/new_year/01.thumb.jpg',
      'images/MEMORIAL/candle.jpg', // Symbolmotiv direkt im Paketordner — war der Ausloeser
      'images/MEMORIAL/us_memorial_day/01.jpg',
      'images/FUN/pi_day/01.jpg',
      'images/DE/german_unity_day/01.jpg',
    ];
    for (const f of files) {
      await mkdir(join(dataRoot, f, '..'), { recursive: true });
      await writeFile(join(dataRoot, f), 'x');
    }
    const hints = new Map([
      ['images/new_year/01.jpg', { credit: 'Jane Doe', license: 'CC BY 4.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg' }],
    ]);
    const pkg = await buildGlobalContent({}, hints, { imagesDataRoot: dataRoot });
    assert.deepEqual(Object.keys(pkg.images), ['new_year']);
    assert.deepEqual(pkg.images.new_year, [
      {
        path: 'images/new_year/01.jpg',
        primary: true,
        credit: 'Jane Doe',
        license: 'CC BY 4.0',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg',
      },
    ]);
  } finally {
    await rm(dataRoot, { recursive: true, force: true });
  }
});
