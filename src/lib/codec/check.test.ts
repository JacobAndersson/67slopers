import assert from 'node:assert/strict';
import { test } from 'node:test';

import { checkDigit, hasValidCheckDigit, withCheckDigit } from './check';
import { mulberry32 } from './prng';

test('Damm check digit of the textbook example', () => {
  assert.equal(checkDigit('572'), 4);
  assert.ok(hasValidCheckDigit('5724'));
  assert.equal(hasValidCheckDigit('5723'), false);
  assert.equal(hasValidCheckDigit('4'), false, 'needs at least one digit before the check');
});

test('every single wrong digit and every neighbour swap is caught', () => {
  const random = mulberry32(3);
  for (let round = 0; round < 300; round++) {
    const body = Array.from({ length: 2 + Math.floor(random() * 30) }, () =>
      Math.floor(random() * 10)
    ).join('');
    const code = withCheckDigit(body);
    assert.ok(hasValidCheckDigit(code));
    for (let i = 0; i < code.length; i++) {
      for (let d = 0; d < 10; d++) {
        if (String(d) === code[i]) continue;
        assert.equal(hasValidCheckDigit(code.slice(0, i) + d + code.slice(i + 1)), false);
      }
      if (i + 1 < code.length && code[i] !== code[i + 1]) {
        const swapped = code.slice(0, i) + code[i + 1] + code[i] + code.slice(i + 2);
        assert.equal(hasValidCheckDigit(swapped), false);
      }
    }
  }
});
