import assert from 'node:assert/strict';
import { test } from 'node:test';

import { holdName, ledIndex, parseHold } from './grid';

test('parseHold reads a column letter and a row from the bottom', () => {
  assert.deepEqual(parseHold('A1'), { col: 0, row: 0 });
  assert.deepEqual(parseHold('K18'), { col: 10, row: 17 });
  assert.deepEqual(parseHold('e6'), { col: 4, row: 5 });
});

test('parseHold rejects what is not on the board', () => {
  assert.equal(parseHold('L3'), null);
  assert.equal(parseHold('A0'), null);
  assert.equal(parseHold('A19'), null);
  assert.equal(parseHold('A13', 12), null);
  assert.equal(parseHold(''), null);
});

test('the strip runs up one column and down the next from A1', () => {
  const led = (hold: string, rows = 18) => ledIndex(parseHold(hold, rows)!, rows);
  assert.equal(led('A1'), 0);
  assert.equal(led('A18'), 17);
  assert.equal(led('B18'), 18);
  assert.equal(led('B1'), 35);
  assert.equal(led('C1'), 36);
  assert.equal(led('K18'), 197);
  assert.equal(led('B12', 12), 12);
  assert.equal(led('K12', 12), 131);
});

test('every hold has its own LED', () => {
  for (const rows of [12, 18]) {
    const seen = new Set<number>();
    for (let col = 0; col < 11; col += 1) {
      for (let row = 0; row < rows; row += 1) seen.add(ledIndex({ col, row }, rows));
    }
    assert.equal(seen.size, 11 * rows);
    assert.equal(Math.max(...seen), 11 * rows - 1);
  }
  assert.equal(holdName({ col: 10, row: 17 }), 'K18');
});

test('mirror and reverse correct a strip wired the other way', () => {
  const a1 = parseHold('A1')!;
  assert.equal(ledIndex(a1, 18, { mirror: true }), ledIndex(parseHold('K1')!, 18));
  assert.equal(ledIndex(a1, 18, { reverse: true }), ledIndex(parseHold('A18')!, 18));
});
