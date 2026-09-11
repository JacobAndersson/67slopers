import assert from 'node:assert/strict';
import { test } from 'node:test';

import { groupDigits, normalizeDigits, shareMessage } from './digits';

test('groupDigits splits into fours', () => {
  assert.equal(groupDigits('123456789'), '1234 5678 9');
  assert.equal(groupDigits('12'), '12');
  assert.equal(groupDigits(''), '');
});

test('normalizeDigits finds the code in scans, pastes and links', () => {
  assert.equal(normalizeDigits('5996554673690'), '5996554673690');
  assert.equal(normalizeDigits(' 5996 5546-7369 0 '), '5996554673690');
  assert.equal(normalizeDigits('Repeaters 7:3 · 5996 5546 7369 0'), '5996554673690');
  assert.equal(normalizeDigits('slopers67://import?code=5996554673690'), '5996554673690');
  assert.equal(normalizeDigits('Try "67slopers" slopers67://import?x=1&code=0421'), '0421');
  assert.equal(normalizeDigits('no digits'), '');
});

test('a shared message gives back its code, with or without the link', () => {
  const code = '0759966554673690';
  const message = shareMessage('Repeaters 7:3 (2024)', code);
  assert.equal(normalizeDigits(message), code);
  assert.equal(normalizeDigits(message.split('\n')[0]), code);
});
