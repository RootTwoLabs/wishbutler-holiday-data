import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  writePackage,
  writePackageIfChanged,
  packageContentKey,
  deliveredByteLength,
  holidayDefinition,
  generatorOutputUnchanged,
} from './packageWriter.mjs';

async function withPackagesDir(fn) {
  const packagesDir = await mkdtemp(join(tmpdir(), 'pkgwriter-'));
  try {
    await fn(packagesDir);
  } finally {
    await rm(packagesDir, { recursive: true, force: true });
  }
}

const DEF = holidayDefinition({
  id: 'XX_national_day',
  countryCode: 'XX',
  slug: 'national_day',
  rule: { type: 'fixed', month: 7, day: 4 },
});
const LABELS = { en: { national_day: 'National Day' } };

test('G-4: zweimal gleicher Inhalt -> genau eine Version, zweiter Lauf changed=false', async () => {
  await withPackagesDir(async (packagesDir) => {
    const first = await writePackage('XX', [DEF], LABELS, { packagesDir });
    assert.deepEqual(first, { version: 1, changed: true });

    const second = await writePackage('XX', [DEF], LABELS, { packagesDir });
    assert.deepEqual(second, { version: 1, changed: false });

    assert.deepEqual(await readdir(join(packagesDir, 'XX')), ['v1']);
  });
});

test('G-4: geaenderter Inhalt bumpt, Namenstage/Bilder/Artikel werden uebernommen', async () => {
  await withPackagesDir(async (packagesDir) => {
    // v1 mit redaktionellem Inhalt, wie ihn build-articles/fetch-namedays hinterlassen.
    await writePackageIfChanged(
      'XX',
      {
        countryCode: 'XX',
        schemaVersion: 1,
        definitions: [DEF],
        namedays: { '01-01': ['Anna'] },
        i18n: { holidays: LABELS, holidayInfo: { en: { national_day: { intro: 'x' } } } },
        images: { national_day: [{ path: 'images/XX/national_day/01.jpg', license: 'CC0' }] },
      },
      { packagesDir },
    );

    const changedDef = { ...DEF, rule: { type: 'fixed', month: 7, day: 5 } };
    const result = await writePackage('XX', [changedDef], LABELS, { packagesDir });
    assert.deepEqual(result, { version: 2, changed: true });

    const v2 = JSON.parse(await readFile(join(packagesDir, 'XX', 'v2', 'package.json'), 'utf8'));
    assert.deepEqual(Object.keys(v2), ['countryCode', 'version', 'schemaVersion', 'definitions', 'namedays', 'i18n', 'images']);
    assert.equal(v2.version, 2);
    assert.deepEqual(v2.namedays, { '01-01': ['Anna'] });
    assert.deepEqual(v2.i18n.holidayInfo, { en: { national_day: { intro: 'x' } } });
    assert.equal(v2.images.national_day[0].path, 'images/XX/national_day/01.jpg');
    assert.equal(v2.definitions[0].rule.day, 5);

    // Ein weiterer identischer Lauf legt keine v3 an.
    assert.deepEqual(await writePackage('XX', [changedDef], LABELS, { packagesDir }), { version: 2, changed: false });
    assert.deepEqual((await readdir(join(packagesDir, 'XX'))).sort(), ['v1', 'v2']);
  });
});

test('packageContentKey ignoriert version, deliveredByteLength zaehlt LF-Bytes', () => {
  assert.equal(packageContentKey({ countryCode: 'XX', version: 3, a: 1 }), packageContentKey({ countryCode: 'XX', version: 9, a: 1 }));
  assert.notEqual(packageContentKey({ countryCode: 'XX', a: 1 }), packageContentKey({ countryCode: 'XX', a: 2 }));
  assert.equal(deliveredByteLength('{\r\n  "a": 1\r\n}\r\n'), deliveredByteLength('{\n  "a": 1\n}\n'));
  assert.equal(deliveredByteLength('{\n  "ä": 1\n}\n'), Buffer.byteLength('{\n  "ä": 1\n}\n'));
});

test('G-7: force legt auch bei byte-gleichem Inhalt eine neue Version an', async () => {
  await withPackagesDir(async (packagesDir) => {
    const content = { countryCode: 'XX', schemaVersion: 1, definitions: [DEF], i18n: { holidays: LABELS } };
    assert.deepEqual(await writePackageIfChanged('XX', content, { packagesDir }), { version: 1, changed: true });
    assert.deepEqual(await writePackageIfChanged('XX', content, { packagesDir }), { version: 1, changed: false });
    assert.deepEqual(await writePackageIfChanged('XX', content, { packagesDir, force: true }), { version: 2, changed: true });
    assert.deepEqual(await readdir(join(packagesDir, 'XX')), ['v1', 'v2']);
    const v2 = JSON.parse(await readFile(join(packagesDir, 'XX', 'v2', 'package.json'), 'utf8'));
    assert.equal(v2.version, 2);
    assert.equal(packageContentKey(v2), packageContentKey({ ...content, version: 2 }));
  });
});

test('G-4 Nachtrag: Fetch nach dem Katalog-Merge bumpt nicht (Generator kennt nur en + Landessprache)', async () => {
  await withPackagesDir(async (packagesDir) => {
    // Stand nach build-articles: 3 Sprachen aus dem Katalog, Artikel, Bilder.
    const merged = {
      countryCode: 'XX',
      schemaVersion: 1,
      definitions: [DEF],
      i18n: {
        holidays: { en: { national_day: 'National Day' }, de: { national_day: 'Nationalfeiertag' }, fr: { national_day: 'Fête nationale' } },
        holidayInfo: { en: { national_day: { intro: 'x' } } },
      },
      images: { national_day: [{ path: 'images/XX/national_day/01.jpg', license: 'CC0' }] },
    };
    await writePackageIfChanged('XX', merged, { packagesDir });

    // Monatlicher Fetch: gleiche Definitionen, nur das englische Label.
    assert.deepEqual(await writePackage('XX', [DEF], LABELS, { packagesDir }), { version: 1, changed: false });
    assert.deepEqual(await readdir(join(packagesDir, 'XX')), ['v1']);

    // Echte Aenderungen bumpen weiter: Label-Text, neuer Schluessel, Regel.
    assert.equal((await writePackage('XX', [DEF], { en: { national_day: 'Independence Day' } }, { packagesDir })).changed, true);
  });
  const prev = { definitions: [DEF], i18n: { holidays: { en: { a: 'A' }, de: { a: 'Ä' } } } };
  assert.equal(generatorOutputUnchanged(prev, [DEF], { en: { a: 'A' } }), true);
  assert.equal(generatorOutputUnchanged(prev, [DEF], { en: { a: 'A', b: 'B' } }), false);
  assert.equal(generatorOutputUnchanged(prev, [DEF], { en: { a: 'A' }, he: { a: 'א' } }), false);
  assert.equal(generatorOutputUnchanged(prev, [{ ...DEF, rule: { type: 'fixed', month: 1, day: 1 } }], { en: { a: 'A' } }), false);
});
