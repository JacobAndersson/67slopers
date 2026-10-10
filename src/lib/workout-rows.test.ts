import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flattenSteps, moveStepTo, rowsAfterDrop, slotsFor } from './workout-rows';
import { validate, stripIds, type EditableStep } from './workout-steps';

const hang = (id: string): EditableStep => ({ id, kind: 'hang', seconds: 7 });
const rest = (id: string): EditableStep => ({ id, kind: 'rest', seconds: 3 });
const repeat = (id: string, steps: EditableStep[]): EditableStep => ({
  id,
  kind: 'repeat',
  times: 3,
  steps,
});

// prep, sets[ reps[ h1, r1 ], long ], tail, empty[]
const tree = (): EditableStep[] => [
  { id: 'prep', kind: 'prep', seconds: 10 },
  repeat('sets', [repeat('reps', [hang('h1'), rest('r1')]), rest('long')]),
  hang('tail'),
  repeat('empty', []),
];

const keys = (steps: EditableStep[]) => flattenSteps(steps).map((row) => row.key);

test('a repeat is a head, its steps and a foot', () => {
  const rows = flattenSteps(tree());
  assert.deepEqual(
    rows.map((row) => `${row.key}:${row.depth}:${row.size}`),
    [
      'prep:0:1',
      'sets:0:7',
      'reps:1:4',
      'h1:2:1',
      'r1:2:1',
      'reps/end:1:0',
      'long:1:1',
      'sets/end:0:0',
      'tail:0:1',
      'empty:0:2',
      'empty/end:0:0',
    ]
  );
});

test('a step can leave its repeat, and enter another', () => {
  const slots = slotsFor(tree(), 'h1');
  // Before prep: the top level, first.
  assert.deepEqual(slots[0], { parentId: null, index: 0, depth: 0, valid: true });
  // Right after the head of the empty repeat: inside it.
  const inEmpty = slots.findIndex((slot) => slot.parentId === 'empty');
  assert.ok(inEmpty > 0);
  const moved = moveStepTo(tree(), 'h1', 'empty', 0);
  assert.deepEqual(keys(moved), [
    'prep',
    'sets',
    'reps',
    'r1',
    'reps/end',
    'long',
    'sets/end',
    'tail',
    'empty',
    'h1',
    'empty/end',
  ]);
});

test('a repeat travels whole, and cannot nest too deep', () => {
  const slots = slotsFor(tree(), 'sets');
  // Inside `empty` would put a repeat in a repeat in a repeat.
  assert.equal(slots.find((slot) => slot.parentId === 'empty')?.valid, false);
  assert.equal(
    slots.filter((slot) => slot.parentId === null).every((slot) => slot.valid),
    true
  );
  // The inner repeat may move into the other top-level repeat.
  assert.equal(slotsFor(tree(), 'reps').find((slot) => slot.parentId === 'empty')?.valid, true);
});

test('dropping in any valid gap gives the column the drag was showing', () => {
  const steps = tree();
  for (const row of flattenSteps(steps)) {
    if (row.size === 0) {
      assert.deepEqual(slotsFor(steps, row.key), []);
      continue;
    }
    const slots = slotsFor(steps, row.key);
    assert.equal(slots.length, flattenSteps(steps).length - row.size + 1);
    slots.forEach((slot, index) => {
      if (!slot.valid) return;
      const moved = moveStepTo(steps, row.key, slot.parentId, slot.index);
      assert.deepEqual(
        keys(moved),
        rowsAfterDrop(flattenSteps(steps), row.key, index).map((r) => r.key),
        `${row.key} to slot ${index}`
      );
      assert.equal(
        validate(stripIds(moved)).some((error) => error.includes('nested')),
        false
      );
    });
  }
});

test('where a row already is counts as a valid gap', () => {
  const steps = tree();
  const rows = flattenSteps(steps);
  for (const row of rows.filter((r) => r.size > 0)) {
    const at = rows.findIndex((r) => r.key === row.key);
    const slot = slotsFor(steps, row.key)[at];
    assert.equal(slot.valid, true);
    assert.deepEqual(keys(moveStepTo(steps, row.key, slot.parentId, slot.index)), keys(steps));
  }
});
