import assert from 'node:assert/strict';
import { test } from 'node:test';

import { COUNT_MS, countUp } from './count-up';

test('a count-up starts at zero and lands exactly on the value', () => {
  assert.equal(countUp(37, 0), 0);
  assert.equal(countUp(37, -20), 0);
  assert.equal(countUp(37, COUNT_MS), 37);
  assert.equal(countUp(37, COUNT_MS * 3), 37);
});

test('it only climbs, in whole numbers, and never passes the value', () => {
  let last = 0;
  for (let ms = 0; ms <= COUNT_MS; ms += 16) {
    const n = countUp(1250, ms);
    assert.ok(Number.isInteger(n));
    assert.ok(n >= last && n <= 1250, `${n} at ${ms} ms`);
    last = n;
  }
});

test('it is quick at first: past half the value a quarter of the way in', () => {
  assert.ok(countUp(100, COUNT_MS / 4) > 50);
});

test('zero stays zero', () => {
  assert.equal(countUp(0, COUNT_MS / 2), 0);
});
