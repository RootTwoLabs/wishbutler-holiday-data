import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveArticle, canonicalArticleSlug } from './contentLoader.mjs';

test('canonicalArticleSlug: explizite Aliase und Regelaliase', () => {
  assert.equal(canonicalArticleSlug('christmas_day'), 'christmas');
  assert.equal(canonicalArticleSlug('new_years_day'), 'new_year');
  assert.equal(canonicalArticleSlug('eid_al_adha_second_day'), 'eid_al_adha_first_day');
  assert.equal(canonicalArticleSlug('eid_al_fitr_third_day_tentative_date'), 'eid_al_fitr_first_day');
  assert.equal(canonicalArticleSlug('prophet_muhammads_birthday_tentative_date'), 'prophet_muhammads_birthday');
  // Identitaet fuer alles andere
  assert.equal(canonicalArticleSlug('matariki'), 'matariki');
  assert.equal(canonicalArticleSlug('eid_al_adha_first_day'), 'eid_al_adha_first_day');
});

const GLOBAL = { en: { christmas: { intro: 'global christmas' } } };
const COUNTRY = {
  TR: { en: { eid_al_adha_first_day: { intro: 'TR eid' } } },
  IL: { en: { passover: { intro: 'IL passover' } } },
};

test('resolveArticle: Alias faellt auf den kanonischen (globalen) Artikel zurueck', () => {
  assert.deepEqual(resolveArticle('christmas_day', 'AU', 'en', GLOBAL, COUNTRY), { intro: 'global christmas' });
});

test('resolveArticle: Eid-Folgetag/Tentative faellt auf den Erster-Tag-Artikel des Landes zurueck', () => {
  assert.deepEqual(resolveArticle('eid_al_adha_third_day', 'TR', 'en', GLOBAL, COUNTRY), { intro: 'TR eid' });
  assert.deepEqual(
    resolveArticle('eid_al_adha_first_day_tentative_date', 'TR', 'en', GLOBAL, COUNTRY),
    { intro: 'TR eid' },
  );
});

test('resolveArticle: namespaced Slug leakt nicht in ein fremdes Land', () => {
  // `passover` gehoert IL; ein anderes Land mit gleichem Slug bekommt nichts.
  assert.equal(resolveArticle('passover', 'US', 'en', GLOBAL, COUNTRY), null);
  assert.deepEqual(resolveArticle('passover', 'IL', 'en', GLOBAL, COUNTRY), { intro: 'IL passover' });
});
