import assert from 'node:assert/strict';
import { test } from 'node:test';

import { EMPTY_HOLDS, draftProblem, draftSummary, roleOf, tapHold } from './draft';
import { MAX_HOLDS } from './protocol';
import type { ProblemHolds } from './types';

test('a free hold takes the chosen role and a second tap removes it', () => {
  const one = tapHold(EMPTY_HOLDS, 'A5', 'start');
  assert.deepEqual(one.start, ['A5']);
  assert.equal(roleOf(one, 'A5'), 'start');
  assert.deepEqual(tapHold(one, 'A5', 'start'), EMPTY_HOLDS);
});

test('tapping with another role changes the hold', () => {
  const changed = tapHold(tapHold(EMPTY_HOLDS, 'A5', 'start'), 'A5', 'hold');
  assert.deepEqual(changed, { start: [], hold: ['A5'], finish: [] });
});

test('a third start or finish replaces the oldest', () => {
  let holds: ProblemHolds = EMPTY_HOLDS;
  for (const hold of ['A1', 'B1', 'C1']) holds = tapHold(holds, hold, 'start');
  assert.deepEqual(holds.start, ['B1', 'C1']);
});

test('a problem never outgrows what the lights can show', () => {
  let holds: ProblemHolds = EMPTY_HOLDS;
  for (let row = 1; row <= 18; row += 1) {
    holds = tapHold(tapHold(holds, `A${row}`, 'hold'), `B${row}`, 'hold');
  }
  assert.equal(holds.hold.length, MAX_HOLDS);
});

test('a draft needs a start and a finish', () => {
  assert.equal(draftProblem(EMPTY_HOLDS), 'add a start hold');
  const started = tapHold(EMPTY_HOLDS, 'A5', 'start');
  assert.equal(draftProblem(started), 'add a finish hold');
  const done = tapHold(tapHold(started, 'C9', 'hold'), 'D18', 'finish');
  assert.equal(draftProblem(done), null);
  assert.equal(draftSummary(done), '1 start · 1 hold · 1 finish');
});
