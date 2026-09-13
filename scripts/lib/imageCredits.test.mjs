import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadCreditHints, decorateImageRef, commonsFileUrl } from './imageCredits.mjs';

async function withCredits(body, fn) {
  const dir = await mkdtemp(join(tmpdir(), 'credits-'));
  const file = join(dir, 'CREDITS.md');
  await writeFile(
    file,
    `# Credits\n\n<!-- BEGIN:IMAGE-CREDITS (auto-generated) -->\n${body}\n<!-- END:IMAGE-CREDITS -->\n`,
  );
  try {
    await fn(file);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('loadCreditHints: Zeile ohne Quell-URL (Altformat) bleibt lesbar', async () => {
  await withCredits('- `images/foo/01.jpg` — Jane Doe (CC BY-SA 4.0)', async (file) => {
    const hints = await loadCreditHints(file);
    assert.deepEqual(hints.get('images/foo/01.jpg'), { credit: 'Jane Doe', license: 'CC BY-SA 4.0' });
  });
});

test('loadCreditHints: Zeile mit Quell-URL liefert sourceUrl', async () => {
  await withCredits(
    '- `images/FUN/x_day/01.jpg` — Peter Häll (CC BY-SA 4.0) — <https://commons.wikimedia.org/wiki/File:Time_clock.jpg>',
    async (file) => {
      const hints = await loadCreditHints(file);
      assert.deepEqual(hints.get('images/FUN/x_day/01.jpg'), {
        credit: 'Peter Häll',
        license: 'CC BY-SA 4.0',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Time_clock.jpg',
      });
    },
  );
});

test('decorateImageRef: übernimmt sourceUrl aus dem Hint, überschreibt aber keine vorhandene', () => {
  const hints = new Map([['images/a/01.jpg', { credit: 'A', license: 'CC BY 4.0', sourceUrl: 'https://c/1' }]]);
  assert.deepEqual(decorateImageRef({ path: 'images/a/01.jpg' }, hints), {
    path: 'images/a/01.jpg',
    credit: 'A',
    license: 'CC BY 4.0',
    sourceUrl: 'https://c/1',
  });
  assert.equal(decorateImageRef({ path: 'images/a/01.jpg', sourceUrl: 'https://c/2' }, hints).sourceUrl, 'https://c/2');
  assert.deepEqual(decorateImageRef({ path: 'images/b/01.jpg' }, hints), { path: 'images/b/01.jpg', license: 'CC0' });
});

test('commonsFileUrl: Titel → Dateiseite, Leerzeichen als Unterstrich, Sonderzeichen kodiert', () => {
  assert.equal(
    commonsFileUrl('File:Time clock by LM Ericsson 1950ies.jpg'),
    'https://commons.wikimedia.org/wiki/File:Time_clock_by_LM_Ericsson_1950ies.jpg',
  );
  assert.equal(
    commonsFileUrl("File:Llewellin's Machine Company time recorder.jpg"),
    "https://commons.wikimedia.org/wiki/File:Llewellin's_Machine_Company_time_recorder.jpg",
  );
  assert.equal(commonsFileUrl('File:Straße & Café.jpg'), 'https://commons.wikimedia.org/wiki/File:Stra%C3%9Fe_%26_Caf%C3%A9.jpg');
  assert.equal(commonsFileUrl('Popcorn.jpg'), undefined);
  assert.equal(commonsFileUrl(undefined), undefined);
});
