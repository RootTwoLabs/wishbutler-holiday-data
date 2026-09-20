import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promoteImage, dropImage, replaceImage, packageCodeForImageDir, referencingPackages } from './imageCuration.mjs';
import { loadCreditHints } from './imageCredits.mjs';
import { creditFromImageInfo } from './commonsFile.mjs';

const CREDITS = [
  '# Credits',
  '',
  '<!-- BEGIN:IMAGE-CREDITS (auto-generated) -->',
  '- `images/XX/day/01.jpg` — Alice · CC BY 4.0',
  '- `images/XX/day/02.jpg` — Bob · CC BY-SA 4.0',
  '- `images/XX/day/03.jpg` — Carol · CC0',
  '- `images/other/01.jpg` — Dave · CC0',
  '<!-- END:IMAGE-CREDITS -->',
  '',
].join('\n');

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'curate-'));
  const imagesRoot = join(root, 'images');
  const dir = join(imagesRoot, 'XX', 'day');
  await mkdir(dir, { recursive: true });
  for (const [name, body] of [['01.jpg', 'ONE'], ['02.jpg', 'TWO'], ['03.jpg', 'THREE'], ['01.thumb.jpg', 't1'], ['02.thumb.jpg', 't2']]) {
    await writeFile(join(dir, name), body);
  }
  const creditsPath = join(root, 'CREDITS.md');
  await writeFile(creditsPath, CREDITS);
  return { root, imagesRoot, dir, creditsPath };
}

const creditLines = async (path) =>
  (await readFile(path, 'utf8')).split('\n').filter((l) => l.startsWith('- `'));

test('packageCodeForImageDir: FUN/MEMORIAL/<CC> besitzen ihre Ordner, alles andere ist GLOBAL', () => {
  assert.equal(packageCodeForImageDir('FUN/bacon_day'), 'FUN');
  assert.equal(packageCodeForImageDir('MEMORIAL/x'), 'MEMORIAL');
  assert.equal(packageCodeForImageDir('IL/rosh_hashanah'), 'IL');
  assert.equal(packageCodeForImageDir('pentecost'), 'GLOBAL');
  assert.equal(packageCodeForImageDir('new_year'), 'GLOBAL');
});

test('promoteImage: 03 wird 01, Credits tauschen, Thumbs weg, Block sortiert', async (t) => {
  const { root, imagesRoot, dir, creditsPath } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));

  const result = await promoteImage({ imagesRoot, creditsPath, dir: 'XX/day', n: 3 });
  assert.deepEqual(result, { dir: 'XX/day', swapped: true, staleThumbs: 2 });

  assert.equal(await readFile(join(dir, '01.jpg'), 'utf8'), 'THREE');
  assert.equal(await readFile(join(dir, '03.jpg'), 'utf8'), 'ONE');
  assert.equal(await readFile(join(dir, '02.jpg'), 'utf8'), 'TWO');
  assert.deepEqual((await readdir(dir)).sort(), ['01.jpg', '02.jpg', '03.jpg']);
  // Ordnung wie die Fetcher: localeCompare auf dem Pfad (`other` vor `XX`),
  // nicht Code-Unit-Sort — sonst wuerfelt jedes promote/drop den Block um.
  assert.deepEqual(await creditLines(creditsPath), [
    '- `images/other/01.jpg` — Dave · CC0',
    '- `images/XX/day/01.jpg` — Carol · CC0',
    '- `images/XX/day/02.jpg` — Bob · CC BY-SA 4.0',
    '- `images/XX/day/03.jpg` — Alice · CC BY 4.0',
  ]);
});

test('promoteImage: n=1 ist ein No-op fuer Dateien/Credits (nur Thumbs werden entsorgt)', async (t) => {
  const { root, imagesRoot, dir, creditsPath } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const result = await promoteImage({ imagesRoot, creditsPath, dir: 'XX/day', n: 1 });
  assert.deepEqual(result, { dir: 'XX/day', swapped: false, staleThumbs: 2 });
  assert.equal(await readFile(join(dir, '01.jpg'), 'utf8'), 'ONE');
  assert.equal((await creditLines(creditsPath)).length, 4);
});

test('dropImage: 02 geloescht, 03 rueckt auf 02, Credits folgen', async (t) => {
  const { root, imagesRoot, dir, creditsPath } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));

  const result = await dropImage({ imagesRoot, creditsPath, dir: 'XX/day', n: 2 });
  assert.deepEqual(result, { dir: 'XX/day', remaining: 2, staleThumbs: 2 });
  assert.deepEqual((await readdir(dir)).sort(), ['01.jpg', '02.jpg']);
  assert.equal(await readFile(join(dir, '02.jpg'), 'utf8'), 'THREE');
  assert.deepEqual(await creditLines(creditsPath), [
    '- `images/other/01.jpg` — Dave · CC0',
    '- `images/XX/day/01.jpg` — Alice · CC BY 4.0',
    '- `images/XX/day/02.jpg` — Carol · CC0',
  ]);
});

test('promoteImage: CRLF-CREDITS.md wird LF-normalisiert geschrieben (G-2)', async (t) => {
  const { root, imagesRoot, creditsPath } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(creditsPath, CREDITS.replace(/\n/g, '\r\n'));
  await promoteImage({ imagesRoot, creditsPath, dir: 'XX/day', n: 2 });
  const text = await readFile(creditsPath, 'utf8');
  assert.equal(text.includes('\r'), false);
  assert.ok(text.includes('- `images/XX/day/01.jpg` — Bob · CC BY-SA 4.0'));
});

test('referencingPackages: findet Pakete, deren letzte Version den Ordner referenziert', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'curate-pkgs-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const write = async (code, v, images) => {
    await mkdir(join(root, code, `v${v}`), { recursive: true });
    await writeFile(join(root, code, `v${v}`, 'package.json'), JSON.stringify({ countryCode: code, version: v, images }));
  };
  await write('AA', 1, { day: [{ path: 'images/AA/day/01.jpg' }] });
  await write('BB', 1, { new_year: [{ path: 'images/new_year/01.jpg' }] });
  await write('BB', 2, { other: [{ path: 'images/other/01.jpg' }] }); // letzte Version referenziert nicht mehr
  await write('GLOBAL', 3, { new_year: [{ path: 'images/new_year/02.jpg' }], new_years: [{ path: 'images/new_years/01.jpg' }] });

  assert.deepEqual(await referencingPackages('AA/day', root), ['AA']);
  assert.deepEqual(await referencingPackages('new_year', root), ['GLOBAL']);
  assert.deepEqual(await referencingPackages('other', root), ['BB']);
  assert.deepEqual(await referencingPackages('nothing', root), []);
});

test('replaceImage: neue Bytes unter gleichem Pfad, genau eine (neue) CREDITS-Zeile, nur der eigene Thumb faellt', async (t) => {
  const { root, imagesRoot, dir, creditsPath } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));

  const result = await replaceImage({
    imagesRoot, creditsPath, dir: 'XX/day', n: 1, bytes: Buffer.from('NEW'),
    credit: 'Ministério da Defesa', license: 'CC BY 2.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:X_(1).jpg',
  });
  assert.deepEqual(result, { dir: 'XX/day', file: '01.jpg', added: false, staleThumbs: 1 });
  assert.equal(await readFile(join(dir, '01.jpg'), 'utf8'), 'NEW');
  assert.deepEqual((await readdir(dir)).sort(), ['01.jpg', '02.jpg', '02.thumb.jpg', '03.jpg']);
  const lines = await creditLines(creditsPath);
  assert.equal(lines.length, 4);
  assert.equal(lines.filter((l) => l.includes('`images/XX/day/01.jpg`')).length, 1);
  // Die Zeile ist fuer den Parser lesbar (G-10: Schreiber und Parser aus einer Quelle).
  assert.deepEqual(
    (await loadCreditHints(creditsPath)).get('images/XX/day/01.jpg'),
    { credit: 'Ministério da Defesa', license: 'CC BY 2.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:X_(1).jpg' },
  );
});

test('replaceImage: anhaengen ja, Luecke nein; unparsebarer Credit fasst nichts an', async (t) => {
  const { root, imagesRoot, dir, creditsPath } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const base = { imagesRoot, creditsPath, dir: 'XX/day', bytes: Buffer.from('NEW'), credit: 'Jane', license: 'CC0' };

  assert.equal((await replaceImage({ ...base, n: 4 })).added, true);
  await assert.rejects(replaceImage({ ...base, n: 6 }), /Luecke/);
  await assert.rejects(replaceImage({ ...base, n: 1, credit: '' }), /nicht parsebar/);
  assert.equal(await readFile(join(dir, '01.jpg'), 'utf8'), 'ONE');
});

test('creditFromImageInfo: Allowlist und Urheber werden erzwungen, nie geraten', () => {
  const info = (license, artist) => ({ thumburl: 'https://x/1280px-a.jpg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:A.jpg', extmetadata: { LicenseShortName: { value: license }, Artist: { value: artist } } });
  assert.deepEqual(creditFromImageInfo('File:A b.jpg', info('CC BY 2.0', '<a href="x">Ministério da Defesa</a>')), {
    credit: 'Ministério da Defesa', license: 'CC BY 2.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:A_b.jpg',
  });
  assert.throws(() => creditFromImageInfo('File:A.jpg', info('CC BY-NC 2.0', 'X')), /Allowlist/);
  assert.throws(() => creditFromImageInfo('File:A.jpg', info('GFDL', 'X')), /Allowlist/);
  assert.throws(() => creditFromImageInfo('File:A.jpg', info('CC BY 4.0', '')), /verlangt Namensnennung/);
  assert.throws(() => creditFromImageInfo('File:A.jpg', info('Public domain', '')), /--credit/);
  assert.throws(() => creditFromImageInfo('File:A.jpg', undefined), /nicht gefunden/);
  assert.equal(creditFromImageInfo('File:A.jpg', info('CC BY 4.0', ''), { creditOverride: 'Wellcome Collection' }).credit, 'Wellcome Collection');
});
