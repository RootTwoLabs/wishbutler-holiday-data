import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sniffImageType, isImageContentType, MAX_IMAGE_BYTES } from './imageValidation.mjs';

test('#131 erkennt JPEG an den Magic-Bytes', () => {
  const buf = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(16)]);
  assert.equal(sniffImageType(buf), 'jpeg');
});

test('#131 erkennt PNG', () => {
  const buf = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(16),
  ]);
  assert.equal(sniffImageType(buf), 'png');
});

test('#131 erkennt WebP', () => {
  const buf = Buffer.from('RIFF\x00\x00\x00\x00WEBPVP8 ', 'latin1');
  assert.equal(sniffImageType(buf), 'webp');
});

test('#131 lehnt Nicht-Bild-Bytes ab (z. B. HTML)', () => {
  assert.equal(sniffImageType(Buffer.from('<!DOCTYPE html><html></html>')), null);
});

test('#131 isImageContentType', () => {
  assert.equal(isImageContentType('image/jpeg'), true);
  assert.equal(isImageContentType('text/html'), false);
  assert.equal(isImageContentType(undefined), false);
});

test('#131 MAX_IMAGE_BYTES ist gesetzt', () => {
  assert.ok(MAX_IMAGE_BYTES > 0);
});
