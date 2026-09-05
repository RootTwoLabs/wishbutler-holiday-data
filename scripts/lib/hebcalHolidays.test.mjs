import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildIsraelDefinitions, collectIsraelDates, ISRAEL_HOLIDAYS } from './hebcalHolidays.mjs';

// Realistischer Hebcal-Ausschnitt (Israel-Schema, 2026) inkl. Rauschen, das
// NICHT uebernommen werden darf (Erev-Tage, Chol HaMoed, Gedenktage, Rosh Chodesh).
const ITEMS_2026 = [
  { title: 'Rosh Chodesh Nisan', date: '2026-03-19', category: 'roshchodesh' },
  { title: 'Erev Pesach', date: '2026-04-01', category: 'holiday', subcat: 'major' },
  { title: 'Pesach I', date: '2026-04-02', category: 'holiday', subcat: 'major', yomtov: true },
  { title: 'Pesach II (CH’’M)', date: '2026-04-03', category: 'holiday', subcat: 'major' },
  { title: 'Pesach VII', date: '2026-04-08', category: 'holiday', subcat: 'major', yomtov: true },
  { title: 'Yom HaAtzma’ut', date: '2026-04-22', category: 'holiday', subcat: 'modern' },
  { title: 'Herzl Day', date: '2026-04-27', category: 'holiday', subcat: 'modern' },
  { title: 'Rosh Hashana 5787', date: '2026-09-12', category: 'holiday', subcat: 'major', yomtov: true },
  { title: 'Rosh Hashana II', date: '2026-09-13', category: 'holiday', subcat: 'major', yomtov: true },
  { title: 'Chanukah: 1 Candle', date: '2026-12-04', category: 'holiday', subcat: 'major' },
  { title: 'Chanukah: 2 Candles', date: '2026-12-05', category: 'holiday', subcat: 'major' },
  { title: 'Tish’a B’Av', date: '2026-07-23', category: 'holiday', subcat: 'major' },
  { title: 'Tu B’Av', date: '2026-07-29', category: 'holiday', subcat: 'minor' },
];
const ITEMS_2027 = [
  { title: 'Pesach I', date: '2027-04-22', category: 'holiday', subcat: 'major', yomtov: true },
  { title: 'Rosh Hashana 5788', date: '2027-10-02', category: 'holiday', subcat: 'major', yomtov: true },
  // Verschobenes Fasten (9. Av auf Schabbat) — Hebcal-Titel mit "(observed)".
  { title: 'Tish’a B’Av (observed)', date: '2027-08-12', category: 'holiday', subcat: 'major' },
];

test('collectIsraelDates: verschobenes Tischa beAv "(observed)" wird erkannt', () => {
  const bySlug = collectIsraelDates([...ITEMS_2026, ...ITEMS_2027]);
  assert.deepEqual(bySlug.get('tisha_bav'), { 2026: '07-23', 2027: '08-12' });
});

test('collectIsraelDates: nimmt nur den ERSTEN Tag mehrtaegiger Feste', () => {
  const bySlug = collectIsraelDates(ITEMS_2026);
  assert.deepEqual(bySlug.get('passover'), { 2026: '04-02' });
  assert.deepEqual(bySlug.get('hanukkah'), { 2026: '12-04' });
  assert.deepEqual(bySlug.get('rosh_hashanah'), { 2026: '09-12' });
});

test('collectIsraelDates: Erev-Tage, Chol HaMoed und Fremd-Gedenktage bleiben draussen', () => {
  const bySlug = collectIsraelDates(ITEMS_2026);
  const all = [...bySlug.values()].flatMap((y) => Object.values(y));
  assert.ok(!all.includes('04-01'), 'Erev Pesach darf nicht auftauchen');
  assert.ok(!all.includes('04-03'), 'Chol HaMoed darf nicht auftauchen');
  assert.ok(!all.includes('04-27'), 'Herzl Day ist nicht in der Tabelle');
});

test('collectIsraelDates: typografische Apostrophe in Hebcal-Titeln matchen', () => {
  const bySlug = collectIsraelDates(ITEMS_2026);
  assert.deepEqual(bySlug.get('yom_haatzmaut'), { 2026: '04-22' });
  assert.deepEqual(bySlug.get('tisha_bav'), { 2026: '07-23' });
  assert.deepEqual(bySlug.get('tu_bav'), { 2026: '07-29' });
});

test('buildIsraelDefinitions: precomputed-Regeln, Labels en+he, Luecken gemeldet', () => {
  const { definitions, labels, missing, gaps } = buildIsraelDefinitions([...ITEMS_2026, ...ITEMS_2027]);

  const passover = definitions.find((d) => d.id === 'IL_passover');
  assert.equal(passover.countryCode, 'IL');
  assert.equal(passover.category, 'public');
  assert.deepEqual(passover.rule, { type: 'precomputed', dates: { 2026: '04-02', 2027: '04-22' } });

  assert.equal(labels.en.passover, 'Passover');
  assert.equal(labels.he.passover, 'פסח');

  // Slugs ohne jeden Termin fehlen komplett und werden gemeldet …
  assert.ok(missing.includes('yom_kippur'));
  assert.ok(!definitions.some((d) => d.slug === 'yom_kippur'));
  // … Slugs mit nur einem von zwei Jahren werden als Luecke gemeldet.
  assert.ok(gaps.some((g) => g.startsWith('hanukkah')));
});

test('ISRAEL_HOLIDAYS: Slugs eindeutig, jede Zeile hat en/he/category', () => {
  const slugs = ISRAEL_HOLIDAYS.map((h) => h.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const h of ISRAEL_HOLIDAYS) {
    assert.ok(h.en && h.he, h.slug);
    assert.ok(['public', 'religious', 'observance'].includes(h.category), h.slug);
  }
});
