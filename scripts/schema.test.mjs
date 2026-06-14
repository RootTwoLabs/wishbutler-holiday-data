import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const SCHEMA = join(dirname(fileURLToPath(import.meta.url)), '..', 'schema');
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validatePackage = ajv.compile(JSON.parse(await readFile(join(SCHEMA, 'package.schema.json'), 'utf8')));
const validateIndex = ajv.compile(JSON.parse(await readFile(join(SCHEMA, 'index.schema.json'), 'utf8')));

function def(over = {}) {
  return {
    id: 'x',
    countryCode: 'DE',
    kind: 'fixed',
    labelKey: 'holidays.x',
    iconName: 'i',
    rule: { type: 'fixed', month: 1, day: 1 },
    ...over,
  };
}
function pkg(over = {}) {
  return { countryCode: 'DE', version: 1, schemaVersion: 1, definitions: [def()], ...over };
}

test('#128 akzeptiert passende kind/rule.type', () => {
  assert.equal(validatePackage(pkg()), true);
});

test('#128 lehnt kind/rule.type-Mismatch ab', () => {
  const bad = pkg({
    definitions: [def({ kind: 'fixed', rule: { type: 'precomputed', dates: { 2026: '01-01' } } })],
  });
  assert.equal(validatePackage(bad), false);
});

test('#128 toter rule.type "nameday_calendar" wird abgelehnt', () => {
  const bad = pkg({
    definitions: [def({ kind: 'fixed', rule: { type: 'nameday_calendar', countryCode: 'DE' } })],
  });
  assert.equal(validatePackage(bad), false);
});

test('#129 lehnt Bildpfad mit Traversal (..) ab', () => {
  const bad = pkg({ images: { x: [{ path: 'images/../secret.jpg' }] } });
  assert.equal(validatePackage(bad), false);
});

test('#129 akzeptiert sicheren relativen Bildpfad', () => {
  const ok = pkg({ images: { x: [{ path: 'images/x/01.jpg' }] } });
  assert.equal(validatePackage(ok), true);
});

test('#133 lehnt ungueltige baseUrl (kein uri) im Index ab', () => {
  assert.equal(validateIndex({ schemaVersion: 1, baseUrl: 'not a url', countries: [] }), false);
});

test('#133 akzeptiert gueltige https-baseUrl', () => {
  assert.equal(
    validateIndex({ schemaVersion: 1, baseUrl: 'https://cdn.jsdelivr.net/x', countries: [] }),
    true,
  );
});
