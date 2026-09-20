import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkPrecomputedHorizon,
  checkFunDefinitions,
  ONE_OFF_HOLIDAY_IDS,
  STALE_PRECOMPUTED_ALLOWLIST,
  checkRegions,
  checkNamedayCoverage,
  NAMEDAY_MIN_DAYS,
  checkCreditsCoverage,
  UNVERIFIED_IMAGE_PROVENANCE,
} from './validate.mjs';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLOCK_2026 = { currentYear: 2026, today: '2026-09-20' };

function precomputed(id, dates) {
  return {
    id, countryCode: id.slice(0, 2), kind: 'precomputed', labelKey: `holidays.${id.slice(3)}`,
    iconName: 'event', category: 'public', rule: { type: 'precomputed', dates },
  };
}

function run(defs, clock = CLOCK_2026) {
  const errors = [];
  const warnings = [];
  checkPrecomputedHorizon(defs[0]?.countryCode ?? 'XX', { definitions: defs }, errors, warnings, clock);
  return { errors, warnings };
}

test('G-6: precomputed mit Folgejahr ist ok; fixed/easter-Regeln werden ignoriert', () => {
  const ok = run([
    precomputed('TR_eid_al_fitr_first_day', { 2026: '03-20', 2027: '03-09' }),
    precomputed('MX_inauguration_day', { 2030: '10-01' }), // Einmaltermin in der Zukunft: nicht veraltet
    { id: 'TR_republic_day', countryCode: 'TR', kind: 'fixed', rule: { type: 'fixed', month: 10, day: 29 } },
  ]);
  assert.deepEqual(ok, { errors: [], warnings: [] });
});

test('G-6: wiederkehrende Regel, die im laufenden Jahr endet, ist ein Fehler (auch mit nur einem Jahr)', () => {
  const multi = run([precomputed('TR_eid_al_adha_first_day', { 2025: '06-06', 2026: '05-27' })]);
  assert.equal(multi.errors.length, 1);
  assert.match(multi.errors[0], /TR_eid_al_adha_first_day: precomputed rule ends 2026 \(2025–2026\), needs 2027/);
  assert.match(multi.errors[0], /build:holidays TR/);

  const single = run([precomputed('XX_some_recurring_feast', { 2026: '05-27' })]);
  assert.equal(single.errors.length, 1);
  assert.match(single.errors[0], /\(nur 2026\), needs 2027/);
  assert.deepEqual(single.warnings, []);
});

test('G-6: dokumentierte Einmaltermine sind nur eine Warnung', () => {
  assert.ok(ONE_OFF_HOLIDAY_IDS.has('BG_currency_change_day'));
  const { errors, warnings } = run([precomputed('BG_currency_change_day', { 2026: '01-01' })]);
  assert.deepEqual(errors, []);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /BG_currency_change_day: Einmaltermin \(nur 2026\)/);
});

test('G-6: Allowlist warnt bis `until` und wird danach zum Fehler', () => {
  const allow = STALE_PRECOMPUTED_ALLOWLIST.get('EG_eid_al_adha');
  assert.ok(allow?.until, 'EG_eid_al_adha muss (befristet) in der Allowlist stehen');
  const def = precomputed('EG_eid_al_adha', { 2026: '05-27' });

  const before = run([def], { currentYear: 2026, today: allow.until });
  assert.deepEqual(before.errors, []);
  assert.match(before.warnings[0], /EG_eid_al_adha: precomputed endet 2026 \(Allowlist bis/);

  const after = run([def], { currentYear: 2027, today: '2027-01-01' });
  assert.equal(after.errors.length, 1);
  assert.match(after.errors[0], /needs 2028 — Allowlist abgelaufen am/);
});

test('G-6: precomputed ohne Jahre ist ein Fehler', () => {
  const { errors } = run([precomputed('XX_empty', {})]);
  assert.match(errors[0], /precomputed rule without dates/);
});

// NUL-Byte-Nachbefund: der Artikel-Credit-Check kommt ohne '\0'-Fallback aus.
function funPackage(ref, imageCredit) {
  return {
    countryCode: 'FUN', version: 19, schemaVersion: 1,
    definitions: [{
      id: 'FUN_day', countryCode: 'FUN', kind: 'fixed', labelKey: 'holidays.day', iconName: 'party-popper',
      category: 'observance', rule: { type: 'fixed', month: 1, day: 1 },
    }],
    i18n: {
      holidays: { en: { day: 'Day' } },
      holidayInfo: { en: { day: { intro: 'x', ...(imageCredit != null ? { imageCredit } : {}) } } },
    },
    images: { day: [ref] },
  };
}

test('checkFunDefinitions: CC BY-Bild braucht Credit im Ref UND im Artikel-imageCredit', () => {
  const only = (errors) => errors.filter((e) => /imageCredit|image credit/.test(e));

  const okErrors = [];
  checkFunDefinitions(funPackage({ path: 'images/FUN/day/01.jpg', license: 'CC BY 4.0', credit: 'Jane Doe' }, 'Jane Doe · CC BY 4.0'), okErrors);
  assert.deepEqual(only(okErrors), []);

  const noArticleCredit = [];
  checkFunDefinitions(funPackage({ path: 'images/FUN/day/01.jpg', license: 'CC BY 4.0', credit: 'Jane Doe' }, undefined), noArticleCredit);
  assert.deepEqual(only(noArticleCredit), ['FUN FUN_day: article imageCredit missing or without author in "en"']);

  // Ref ohne Credit: beide Fehler (Ref-Credit fehlt, Artikel kann den Autor nicht nennen).
  const noRefCredit = [];
  checkFunDefinitions(funPackage({ path: 'images/FUN/day/01.jpg', license: 'CC BY 4.0' }, 'irgendwas'), noRefCredit);
  assert.deepEqual(only(noRefCredit), [
    'FUN FUN_day: image credit missing for images/FUN/day/01.jpg',
    'FUN FUN_day: article imageCredit missing or without author in "en"',
  ]);

  const cc0 = [];
  checkFunDefinitions(funPackage({ path: 'images/FUN/day/01.jpg', license: 'CC0' }, undefined), cc0);
  assert.deepEqual(only(cc0), []);
});

// --- G-5 / G-11 (Audit 2026-09-20, Paket 2a) --------------------------------

test('G-5: checkRegions — Regionscodes muessen mit dem Paketland beginnen', () => {
  const def = (id, regions) => ({
    id, countryCode: id.slice(0, 2), kind: 'fixed', labelKey: `holidays.${id.slice(3)}`,
    iconName: 'event', category: 'public', ...(regions ? { regions } : {}), rule: { type: 'fixed', month: 1, day: 1 },
  });
  const errors = [];
  checkRegions('DE', { definitions: [def('DE_national'), def('DE_regional', ['DE-BY', 'DE-TH'])] }, errors);
  assert.deepEqual(errors, []);

  checkRegions('AT', { definitions: [def('AT_x', ['AT-4', 'DE-BY'])] }, errors);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /AT AT_x: regions ausserhalb des Pakets \(DE-BY\)/);

  // Sammelpakete (GLOBAL/FUN/MEMORIAL) werden nicht geprueft.
  const none = [];
  checkRegions('FUN', { definitions: [def('FUN_x', ['DE-BY'])] }, none);
  assert.deepEqual(none, []);
});

test('G-11: checkNamedayCoverage — eine Sammelwarnung unter 300 Tagen, kein Fehler', () => {
  const warnings = [];
  checkNamedayCoverage([{ code: 'DE', days: 366 }, { code: 'GR', days: 176 }, { code: 'BG', days: 101 }, { code: 'IT', days: 300 }], warnings);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /unter 300\/366 Tagen: BG 101, GR 176/);
  assert.doesNotMatch(warnings[0], /IT|DE/);

  const quiet = [];
  checkNamedayCoverage([{ code: 'DE', days: 366 }, { code: 'RO', days: 0 }], quiet);
  assert.deepEqual(quiet, []);
  assert.equal(NAMEDAY_MIN_DAYS, 300);
});

test('G-5: checkRegions — regions ueber dem Full-Set des Landes ist ein Fehler (landesweit)', () => {
  const def = (id, regions) => ({
    id, countryCode: id.slice(0, 2), kind: 'fixed', labelKey: `holidays.${id.slice(3)}`,
    iconName: 'event', category: 'public', regions, rule: { type: 'fixed', month: 1, day: 1 },
  });
  const errors = [];
  checkRegions('GB', { definitions: [def('GB_new_years_day', ['GB-ENG', 'GB-NIR', 'GB-SCT', 'GB-WLS']), def('GB_2_january', ['GB-SCT'])] }, errors);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /GB GB_new_years_day: regions deckt alle 4 Regionen ab/);
  const ok = [];
  checkRegions('DE', { definitions: [def('DE_x', ['DE-BY'])] }, ok, { GB: ['GB-ENG'] });
  assert.deepEqual(ok, []);
});

// ── G-10: jede Bilddatei genau eine CREDITS-Zeile ─────────────────────────────

async function withImages(files, fn) {
  const root = await mkdtemp(join(tmpdir(), 'wb-credits-cov-'));
  try {
    for (const f of files) {
      await mkdir(dirname(join(root, f)), { recursive: true });
      await writeFile(join(root, f), 'x');
    }
    await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

const hint = (license = 'CC0') => ({ credit: 'Jane', license });

test('G-10: Bilddatei ohne CREDITS-Zeile ist ein Fehler — auch bei CC0/PD; Thumbs brauchen keine', async () => {
  await withImages(['new_year/01.jpg', 'new_year/01.thumb.jpg', 'DE/german_unity_day/02.jpg', 'MEMORIAL/candle.jpg'], async (root) => {
    const errors = [];
    const warnings = [];
    const hints = new Map([['images/new_year/01.jpg', hint('Public domain')]]);
    await checkCreditsCoverage(root, hints, errors, warnings, { allowlist: new Map(), today: '2026-09-20' });
    assert.deepEqual(warnings, []);
    assert.equal(errors.length, 2);
    assert.match(errors[0], /^images\/DE\/german_unity_day\/02\.jpg: Bilddatei ohne CREDITS-Zeile/);
    assert.match(errors[1], /^images\/MEMORIAL\/candle\.jpg: Bilddatei ohne CREDITS-Zeile/);
  });
});

test('G-10: Zeile ohne Bilddatei und doppelte Zeilen sind Fehler; vollstaendige Abdeckung ist still', async () => {
  await withImages(['new_year/01.jpg'], async (root) => {
    const errors = [];
    const hints = new Map([
      ['images/new_year/01.jpg', hint()],
      ['images/FUN/checkers_day/01.jpg', hint('CC BY-SA 4.0')],
    ]);
    await checkCreditsCoverage(root, hints, errors, [], { allowlist: new Map(), today: '2026-09-20', duplicates: ['images/new_year/01.jpg'] });
    assert.deepEqual(errors, [
      'CREDITS.md: mehrere Zeilen fuer images/new_year/01.jpg — genau eine je Bilddatei',
      'CREDITS.md: Zeile ohne Bilddatei: images/FUN/checkers_day/01.jpg',
    ]);

    const clean = [];
    await checkCreditsCoverage(root, new Map([['images/new_year/01.jpg', hint()]]), clean, [], { allowlist: new Map(), today: '2026-09-20' });
    assert.deepEqual(clean, []);
  });
});

test('G-10: unbelegte Herkunft warnt nur bis zur Frist und raeumt sich selbst auf', async () => {
  await withImages(['AU/melbourne_cup/01.jpg'], async (root) => {
    const allowlist = new Map([
      ['images/AU/melbourne_cup/01.jpg', { until: '2026-10-31', reason: 'Quelle unbekannt' }],
      ['images/GONE/x/01.jpg', { until: '2026-10-31', reason: 'Quelle unbekannt' }],
    ]);
    const before = { errors: [], warnings: [] };
    await checkCreditsCoverage(root, new Map(), before.errors, before.warnings, { allowlist, today: '2026-10-31' });
    assert.equal(before.warnings.length, 1);
    assert.match(before.warnings[0], /Herkunft unbelegt \(Frist 2026-10-31/);
    // Allowlist-Eintrag fuer eine geloeschte Datei darf nicht liegen bleiben.
    assert.deepEqual(before.errors, ['UNVERIFIED_IMAGE_PROVENANCE: images/GONE/x/01.jpg existiert nicht mehr — Eintrag streichen']);

    const after = { errors: [], warnings: [] };
    await checkCreditsCoverage(root, new Map(), after.errors, after.warnings, { allowlist: new Map([...allowlist].slice(0, 1)), today: '2026-11-01' });
    assert.deepEqual(after.warnings, []);
    assert.match(after.errors[0], /Bilddatei ohne CREDITS-Zeile.*Frist 2026-10-31 abgelaufen/);

    // Zeile nachgetragen, aber Allowlist vergessen -> Fehler statt stiller Doppelbuchfuehrung.
    const resolved = [];
    await checkCreditsCoverage(root, new Map([['images/AU/melbourne_cup/01.jpg', hint()]]), resolved, [], { allowlist: new Map([...allowlist].slice(0, 1)), today: '2026-09-20' });
    assert.match(resolved[0], /aus UNVERIFIED_IMAGE_PROVENANCE streichen/);
  });
});

test('G-10: UNVERIFIED_IMAGE_PROVENANCE ist befristet und zeigt nur auf vorhandene Dateien', () => {
  const data = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
  for (const [path, entry] of UNVERIFIED_IMAGE_PROVENANCE) {
    assert.match(entry.until, /^\d{4}-\d{2}-\d{2}$/, path);
    assert.ok(entry.reason?.trim(), path);
    assert.ok(existsSync(join(data, path)), `${path} fehlt`);
  }
});
