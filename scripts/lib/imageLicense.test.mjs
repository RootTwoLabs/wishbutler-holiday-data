import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyLicense, isCc0OrPd, needsCredit } from './imageLicense.mjs';

test('G-3: Allowlist akzeptiert CC0, Public Domain, CC BY und CC BY-SA', () => {
  assert.equal(classifyLicense('CC0'), 'CC0');
  assert.equal(classifyLicense('CC0 1.0'), 'CC0 1.0');
  assert.equal(classifyLicense('Public domain'), 'Public domain');
  assert.equal(classifyLicense('PD-US'), 'PD-US');
  assert.equal(classifyLicense('CC BY 4.0'), 'CC BY 4.0');
  assert.equal(classifyLicense('CC BY 2.0'), 'CC BY 2.0');
  assert.equal(classifyLicense('CC BY-SA 4.0'), 'CC BY-SA 4.0');
  assert.equal(classifyLicense('CC BY-SA 3.0'), 'CC BY-SA 3.0');
  // Commons liefert den Kurznamen gelegentlich mit HTML-Markup.
  assert.equal(classifyLicense('<a href="x">CC BY-SA 4.0</a>'), 'CC BY-SA 4.0');
});

test('G-3: NC/ND/GFDL werden abgelehnt (kein Fallback ueber "cc"/"public")', () => {
  assert.equal(classifyLicense('CC BY-NC 4.0'), null);
  assert.equal(classifyLicense('CC BY-ND 4.0'), null);
  assert.equal(classifyLicense('CC BY-NC-SA 3.0'), null);
  assert.equal(classifyLicense('CC BY-NC-ND 2.0'), null);
  assert.equal(classifyLicense('GFDL'), null);
  assert.equal(classifyLicense('GFDL 1.2'), null);
  assert.equal(classifyLicense('Fair use'), null);
  assert.equal(classifyLicense('All rights reserved'), null);
  assert.equal(classifyLicense('Creative Commons Non-Commercial'), null);
  assert.equal(classifyLicense('Public Health poster, copyrighted'), null);
  assert.equal(classifyLicense(''), null);
  assert.equal(classifyLicense(undefined), null);
});

test('isCc0OrPd / needsCredit', () => {
  assert.equal(isCc0OrPd('CC0'), true);
  assert.equal(isCc0OrPd('Public domain'), true);
  assert.equal(isCc0OrPd('CC BY 4.0'), false);
  assert.equal(needsCredit('CC BY-SA 4.0'), true);
  assert.equal(needsCredit('CC0 1.0'), false);
});
