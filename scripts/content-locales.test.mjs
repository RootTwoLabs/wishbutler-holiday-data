import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LOCALES } from './config.mjs';
import { loadLabelCatalog } from './lib/labelCatalog.mjs';
import { fileURLToPath } from 'node:url';

test('all app languages contain the English holiday label keys', async () => {
  const catalog = await loadLabelCatalog(fileURLToPath(new URL('../content/holiday-labels/', import.meta.url)));
  for (const locale of LOCALES) {
    assert.ok(catalog[locale], `Missing ${locale} catalog`);
    assert.deepEqual(Object.keys(catalog.en).filter(key => !catalog[locale][key]?.trim()), [], `${locale}: missing holiday labels`);
  }
});

test('Danish NZ article prose contains no unchanged English passages', async () => {
  const read = async locale => JSON.parse(await readFile(new URL(`../content/articles/NZ/${locale}.json`, import.meta.url), 'utf8'));
  const en = await read('en'), da = await read('da');
  for (const [slug, article] of Object.entries(en)) {
    for (const field of ['intro', 'history', 'traditions']) assert.notEqual(da[slug][field], article[field], `${slug}.${field}`);
    article.funFacts.forEach((fact, i) => assert.notEqual(da[slug].funFacts[i], fact, `${slug}.funFacts[${i}]`));
  }
});
