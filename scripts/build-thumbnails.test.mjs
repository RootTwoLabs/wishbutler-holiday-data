import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, stat, utimes, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { buildThumbnails, thumbPathFor, findOriginals, THUMB_SIZE } from './build-thumbnails.mjs';

/** Temp-Bildwurzel mit einem 600×400-Testbild unter <root>/christmas/01.jpg. */
async function makeFixture() {
  const root = await mkdtemp(join(tmpdir(), 'wb-thumbs-'));
  const dir = join(root, 'christmas');
  await mkdir(dir, { recursive: true });
  const original = join(dir, '01.jpg');
  await sharp({
    create: { width: 600, height: 400, channels: 3, background: { r: 200, g: 40, b: 40 } },
  })
    .jpeg({ quality: 90 })
    .toFile(original);
  return { root, dir, original };
}

test('thumbPathFor: NN.jpg -> NN.thumb.jpg (auch .jpeg, case-insensitive)', () => {
  assert.equal(thumbPathFor('/x/images/christmas/01.jpg'), '/x/images/christmas/01.thumb.jpg');
  assert.equal(thumbPathFor('/x/images/FUN/bacon_day/02.JPEG'), '/x/images/FUN/bacon_day/02.thumb.jpg');
});

test('buildThumbnails: erzeugt 192×192-JPEG < 40 KB, zweiter Lauf überspringt, --force regeneriert', async () => {
  const { root, dir, original } = await makeFixture();
  try {
    // Fremddateien und ein bereits vorhandenes Thumb dürfen nicht als Original gelten.
    await writeFile(join(dir, 'notes.txt'), 'x');
    await writeFile(join(dir, '99.thumb.jpg'), 'stale');
    assert.deepEqual(await findOriginals(root), [original]);

    const first = await buildThumbnails({ imagesRoot: root });
    assert.equal(first.built, 1);
    assert.equal(first.skipped, 0);

    const thumb = thumbPathFor(original);
    const meta = await sharp(thumb).metadata();
    assert.equal(meta.width, THUMB_SIZE);
    assert.equal(meta.height, THUMB_SIZE);
    assert.equal(meta.format, 'jpeg');
    assert.equal(meta.exif, undefined, 'Thumb darf keine EXIF-Metadaten tragen');
    const size = (await stat(thumb)).size;
    assert.ok(size < 40 * 1024, `Thumb zu groß: ${size} B`);
    assert.equal(first.totalBytes, size);

    // Idempotent: Thumb ist neuer als das Original -> übersprungen.
    const second = await buildThumbnails({ imagesRoot: root });
    assert.equal(second.built, 0);
    assert.equal(second.skipped, 1);
    assert.equal(second.totalBytes, size);

    // Original neuer als Thumb -> wird neu gebaut.
    const future = new Date(Date.now() + 60_000);
    await utimes(original, future, future);
    const third = await buildThumbnails({ imagesRoot: root });
    assert.equal(third.built, 1);

    // --force regeneriert, obwohl das Thumb aktuell ist.
    const forced = await buildThumbnails({ imagesRoot: root, force: true });
    assert.equal(forced.built, 1);
    assert.equal(forced.skipped, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('buildThumbnails: Pfad-Präfix filtert exakt auf Ordner (christmas trifft nicht christmas_eve)', async () => {
  const { root, original } = await makeFixture();
  try {
    const other = join(root, 'christmas_eve');
    await mkdir(other, { recursive: true });
    await sharp(original).toFile(join(other, '01.jpg'));

    const filtered = await buildThumbnails({ imagesRoot: root, prefixes: ['christmas'] });
    assert.equal(filtered.built, 1);
    assert.deepEqual(filtered.files, [thumbPathFor(original)]);

    const all = await buildThumbnails({ imagesRoot: root });
    assert.equal(all.built, 1); // nur christmas_eve fehlte noch
    assert.equal(all.skipped, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
