import assert from 'node:assert/strict';
import { test } from 'node:test';

import { normalizeDigits } from './digits';

test('normalizeDigits reads QR data and links, and nothing else', () => {
  assert.equal(normalizeDigits('5996554673690'), '5996554673690');
  assert.equal(normalizeDigits(' 0421\n'), '0421');
  assert.equal(normalizeDigits('slopers67://import?code=5996554673690'), '5996554673690');
  assert.equal(normalizeDigits('slopers67://import?x=1&code=0421'), '0421');
  assert.equal(normalizeDigits('https://example.com/?id=42'), '');
  assert.equal(normalizeDigits('Repeaters 7:3 · 5996 5546'), '');
  assert.equal(normalizeDigits(''), '');
});
