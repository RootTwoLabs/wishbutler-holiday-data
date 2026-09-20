import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadCreditHints, decorateImageRef, commonsFileUrl, formatCreditLine, duplicateCreditPaths } from './imageCredits.mjs';

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

test('G-2: CRLF-Zeilenenden (Windows-Checkout) liefern dieselben Hints wie LF', async () => {
  const lines = [
    '- `images/foo/01.jpg` — Jane Doe (CC BY-SA 4.0)',
    '- `images/FUN/x_day/01.jpg` — Peter Häll (CC BY-SA 4.0) — <https://commons.wikimedia.org/wiki/File:Time_clock.jpg>',
  ];
  let lfHints;
  await withCredits(lines.join('\n'), async (file) => {
    lfHints = await loadCreditHints(file);
  });
  const dir = await mkdtemp(join(tmpdir(), 'credits-crlf-'));
  const file = join(dir, 'CREDITS.md');
  try {
    await writeFile(
      file,
      `# Credits\r\n\r\n<!-- BEGIN:IMAGE-CREDITS (auto-generated) -->\r\n${lines.join('\r\n')}\r\n<!-- END:IMAGE-CREDITS -->\r\n`,
    );
    const crlfHints = await loadCreditHints(file);
    assert.equal(crlfHints.size, 2);
    assert.deepEqual([...crlfHints.entries()], [...lfHints.entries()]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
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

// ── G-10: eine Zeile je Bilddatei, Schreiber und Parser aus EINER Quelle ────────

test('G-10: formatCreditLine <-> loadCreditHints sind ein Rundlauf (auch CC0/Public Domain)', async () => {
  const items = [
    { path: 'images/new_year/01.jpg', credit: 'Vyacheslav Argenberg', license: 'CC BY 4.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Anjuna_Beach.jpg' },
    { path: 'images/IL/sukkot/01.jpg', credit: 'Leopold Pilichowski', license: 'Public domain', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Leopold_Pilichowski_Sukkot.jpg' },
    // Klammern im Autor und in der URL, keine Quell-URL, Mehrfach-Leerzeichen
    { path: 'images/whit_monday/02.jpg', credit: 'Kor!An  (Андрей Корзун)', license: 'CC BY-SA 3.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Bouquet_(1).JPG' },
    { path: 'images/MEMORIAL/candle.jpg', credit: 'USER-62114', license: 'CC0' },
  ];
  const body = items.map(formatCreditLine).join('\n');
  await withCredits(body, async (file) => {
    const hints = await loadCreditHints(file);
    assert.equal(hints.size, items.length);
    assert.deepEqual(hints.get('images/IL/sukkot/01.jpg'), {
      credit: 'Leopold Pilichowski',
      license: 'Public domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Leopold_Pilichowski_Sukkot.jpg',
    });
    assert.deepEqual(hints.get('images/whit_monday/02.jpg'), {
      credit: 'Kor!An (Андрей Корзун)',
      license: 'CC BY-SA 3.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Bouquet_(1).JPG',
    });
    assert.deepEqual(hints.get('images/MEMORIAL/candle.jpg'), { credit: 'USER-62114', license: 'CC0' });
  });
});

test('G-10: formatCreditLine wirft statt eine unparsebare Zeile zu schreiben', () => {
  const ok = { path: 'images/x/01.jpg', credit: 'Jane', license: 'CC0' };
  assert.throws(() => formatCreditLine({ ...ok, credit: '' }), /nicht parsebar/);
  assert.throws(() => formatCreditLine({ ...ok, credit: undefined }), /nicht parsebar/);
  assert.throws(() => formatCreditLine({ ...ok, license: '' }), /nicht parsebar/);
  assert.throws(() => formatCreditLine({ ...ok, license: 'CC BY (generic)' }), /nicht parsebar/);
  assert.throws(() => formatCreditLine({ ...ok, path: 'images/x`y/01.jpg' }), /nicht parsebar/);
  // Eine kaputte Quell-URL faellt weg, die Zeile bleibt gueltig.
  assert.equal(formatCreditLine({ ...ok, sourceUrl: 'not a url' }), '- `images/x/01.jpg` — Jane (CC0)');
});

test('G-10: duplicateCreditPaths findet doppelte Pfade (die Hint-Map verdeckt sie)', async () => {
  const body = [
    '- `images/a/01.jpg` — A (CC0)',
    '- `images/b/01.jpg` — B (CC BY 4.0)',
    '- `images/a/01.jpg` — Someone Else (CC BY-SA 4.0)',
  ].join('\r\n'); // CRLF-fest wie loadCreditHints
  await withCredits(body, async (file) => {
    assert.deepEqual(await duplicateCreditPaths(file), ['images/a/01.jpg']);
    assert.equal((await loadCreditHints(file)).size, 2);
  });
  await withCredits('- `images/a/01.jpg` — A (CC0)', async (file) => {
    assert.deepEqual(await duplicateCreditPaths(file), []);
  });
});
