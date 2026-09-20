import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, stripTentativeSuffix, canonicalSlugForTentative } from './nagerSlug.mjs';

test('slugify: bisheriges Verhalten fuer normale Namen bleibt', () => {
  assert.equal(slugify("New Year's Day"), 'new_years_day');
  assert.equal(slugify('Eid al-Fitr First Day'), 'eid_al_fitr_first_day');
  assert.equal(slugify('Día de la Constitución'), 'dia_de_la_constitucion');
  assert.equal(slugify('  St. Stephen’s Day '), 'st_stephens_day');
});

test('G-6: "(tentative date)" / "(tentative)" faellt vor dem Slug weg', () => {
  assert.equal(slugify('Eid al-Fitr First Day (tentative date)'), 'eid_al_fitr_first_day');
  assert.equal(slugify('Eid al-Fitr First Day (Tentative Date)'), 'eid_al_fitr_first_day');
  assert.equal(slugify("Prophet Muhammad's Birthday (tentative)"), 'prophet_muhammads_birthday');
  assert.equal(slugify('Friday before AFL Grand Final (tentative date)'), 'friday_before_afl_grand_final');
});

test('stripTentativeSuffix: nur am Ende, nur das Suffix, Nicht-Strings unveraendert', () => {
  assert.equal(stripTentativeSuffix('Eid al-Adha (tentative date)'), 'Eid al-Adha');
  assert.equal(stripTentativeSuffix('Ramazan Bayramı 1. Gün (Tentative Date)'), 'Ramazan Bayramı 1. Gün');
  assert.equal(stripTentativeSuffix('Tentative Day of Things'), 'Tentative Day of Things');
  assert.equal(stripTentativeSuffix('Foo (tentative date) Bar'), 'Foo (tentative date) Bar');
  assert.equal(stripTentativeSuffix(undefined), undefined);
});

test('canonicalSlugForTentative: _tentative_date / _tentative -> kanonischer Slug', () => {
  assert.equal(canonicalSlugForTentative('eid_al_fitr_first_day_tentative_date'), 'eid_al_fitr_first_day');
  assert.equal(canonicalSlugForTentative('prophet_muhammads_birthday_tentative'), 'prophet_muhammads_birthday');
  assert.equal(canonicalSlugForTentative('christmas'), 'christmas');
});
