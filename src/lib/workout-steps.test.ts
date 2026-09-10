import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Step } from './store/types';
import {
  appendTo,
  canNest,
  clearHolds,
  countTimedSteps,
  depthOf,
  duplicateStep,
  findStep,
  holdsInWorkout,
  LIMITS,
  maxDepth,
  moveIntoRepeat,
  moveOutOfRepeat,
  moveStep,
  newRepeat,
  newTimedStep,
  parentOf,
  removeStep,
  reorderWithin,
  stripIds,
  updateStep,
  validate,
  withFreshIds,
  withIds,
  type EditableRepeatStep,
  type EditableStep,
} from './workout-steps';

const repeaters: Step[] = [
  { kind: 'prep', seconds: 10 },
  {
    kind: 'repeat',
    times: 6,
    skipLastRest: true,
    steps: [
      {
        kind: 'repeat',
        times: 6,
        skipLastRest: true,
        steps: [
          { kind: 'hang', seconds: 7, label: '20 mm' },
          { kind: 'rest', seconds: 3 },
        ],
      },
      { kind: 'rest', seconds: 180 },
    ],
  },
];

const ids = (steps: EditableStep[]): string[] =>
  steps.flatMap((s) => [s.id, ...(s.kind === 'repeat' ? ids(s.steps) : [])]);
const outer = (steps: EditableStep[]) => steps[1] as EditableRepeatStep;
const inner = (steps: EditableStep[]) => outer(steps).steps[0] as EditableRepeatStep;

test('withIds and stripIds round-trip and ids are unique', () => {
  const editable = withIds(repeaters);
  const all = ids(editable);
  assert.equal(all.length, 6);
  assert.equal(new Set(all).size, 6);
  assert.deepEqual(stripIds(editable), repeaters);
  const fresh = withFreshIds(editable);
  assert.deepEqual(stripIds(fresh), repeaters);
  assert.ok(ids(fresh).every((id) => !all.includes(id)));
});

test('queries: find, parent, depth, counts', () => {
  const s = withIds(repeaters);
  const hangId = inner(s).steps[0].id;
  assert.equal(findStep(s, hangId)?.kind, 'hang');
  assert.equal(parentOf(s, hangId)?.id, inner(s).id);
  assert.equal(parentOf(s, s[0].id), null);
  assert.equal(parentOf(s, 'nope'), undefined);
  assert.equal(depthOf(s, hangId), 2);
  assert.equal(depthOf(s, outer(s).id), 0);
  assert.equal(countTimedSteps(repeaters), 4);
  assert.equal(maxDepth(repeaters), 2);
});

test('updateStep patches one node anywhere in the tree', () => {
  const s = withIds(repeaters);
  const hangId = inner(s).steps[0].id;
  const next = updateStep(s, hangId, { seconds: 10, label: 'sloper' });
  assert.deepEqual(stripIds(next)[1], {
    kind: 'repeat',
    times: 6,
    skipLastRest: true,
    steps: [
      {
        kind: 'repeat',
        times: 6,
        skipLastRest: true,
        steps: [
          { kind: 'hang', seconds: 10, label: 'sloper' },
          { kind: 'rest', seconds: 3 },
        ],
      },
      { kind: 'rest', seconds: 180 },
    ],
  });
  const kindChange = updateStep(next, hangId, { kind: 'rest' });
  assert.equal(findStep(kindChange, hangId)?.kind, 'rest');
  assert.notEqual(s, next, 'returns a new tree');
});

test('removeStep and duplicateStep work at any depth', () => {
  const s = withIds(repeaters);
  const restId = inner(s).steps[1].id;
  assert.equal(countTimedSteps(stripIds(removeStep(s, restId))), 3);

  const dup = duplicateStep(s, inner(s).id);
  assert.equal(outer(dup).steps.length, 3);
  assert.equal(outer(dup).steps[1].kind, 'repeat');
  assert.notEqual(outer(dup).steps[1].id, inner(s).id, 'the copy gets fresh ids');
  assert.deepEqual(stripIds([outer(dup).steps[1]]), stripIds([inner(s)]));
});

test('moveStep swaps neighbours and stops at the ends', () => {
  const s = withIds(repeaters);
  const up = moveStep(s, outer(s).id, -1);
  assert.equal(up[0].kind, 'repeat');
  assert.equal(up[1].kind, 'prep');
  assert.equal(moveStep(s, s[0].id, -1), s, 'no-op at the top');
  const restId = outer(s).steps[1].id;
  const moved = moveStep(s, restId, -1);
  assert.equal(outer(moved).steps[0].kind, 'rest');
});

test('reorderWithin follows the given order and keeps unlisted steps', () => {
  const s = withIds(repeaters);
  const [a, b] = inner(s).steps.map((x) => x.id);
  const reordered = reorderWithin(s, inner(s).id, [b, a]);
  assert.deepEqual(
    inner(reordered).steps.map((x) => x.kind),
    ['rest', 'hang']
  );
  const partial = reorderWithin(s, null, [outer(s).id]);
  assert.deepEqual(
    partial.map((x) => x.kind),
    ['repeat', 'prep']
  );
});

test('moving in and out of repeats respects the depth limit', () => {
  const s = withIds(repeaters);
  const rest180 = outer(s).steps[1].id;
  const out = moveOutOfRepeat(s, rest180);
  assert.deepEqual(
    out.map((x) => x.kind),
    ['prep', 'repeat', 'rest']
  );
  assert.equal(outer(out).steps.length, 1);

  const back = moveIntoRepeat(out, out[2].id, outer(out).id);
  assert.equal(outer(back).steps.length, 2);
  assert.equal(outer(back).steps[1].kind, 'rest');

  // The inner repeat cannot take another repeat, and a repeat cannot be moved into itself.
  const extra = appendTo(s, null, newRepeat());
  const extraId = extra[2].id;
  assert.equal(canNest(extra, inner(extra).id, extra[2]), false);
  assert.equal(moveIntoRepeat(extra, extraId, inner(extra).id), extra);
  assert.equal(moveIntoRepeat(extra, extraId, extraId), extra);
  // The outer repeat cannot take a repeat that itself contains a repeat.
  const deep = appendTo(s, outer(s).id, withFreshIds([outer(s)])[0]);
  assert.equal(deep, s);
  assert.equal(appendTo(s, inner(s).id, newTimedStep('hang')).length, 2);
});

test('validate reports missing hangs, size, depth and ranges', () => {
  assert.deepEqual(validate(repeaters), []);
  assert.deepEqual(validate([{ kind: 'rest', seconds: 30 }]), ['Add at least one hang.']);
  const tooMany: Step[] = Array.from({ length: LIMITS.maxSteps + 1 }, () => ({
    kind: 'hang',
    seconds: 7,
  }));
  assert.ok(validate(tooMany).some((e) => e.includes(String(LIMITS.maxSteps))));
  const tooDeep: Step[] = [
    {
      kind: 'repeat',
      times: 2,
      skipLastRest: true,
      steps: [
        {
          kind: 'repeat',
          times: 2,
          skipLastRest: true,
          steps: [
            { kind: 'repeat', times: 2, skipLastRest: true, steps: [{ kind: 'hang', seconds: 7 }] },
          ],
        },
      ],
    },
  ];
  assert.ok(validate(tooDeep).some((e) => e.includes('nested')));
  assert.ok(validate([{ kind: 'hang', seconds: 0 }]).some((e) => e.includes('range')));
  assert.ok(
    validate([
      { kind: 'repeat', times: 100, skipLastRest: true, steps: [{ kind: 'hang', seconds: 7 }] },
    ]).some((e) => e.includes('range'))
  );
});

test('holds survive ids, cloning and patches, and can be cleared', () => {
  const withHolds: Step[] = [
    {
      kind: 'repeat',
      times: 2,
      skipLastRest: true,
      steps: [
        { kind: 'hang', seconds: 7, holds: ['edge-medium-l', 'edge-medium-r'] },
        { kind: 'rest', seconds: 3 },
      ],
    },
    { kind: 'hang', seconds: 10, holds: ['sloper-20'] },
  ];
  const editable = withIds(withHolds);
  assert.deepEqual(stripIds(editable), withHolds);
  assert.deepEqual(holdsInWorkout(withHolds), ['edge-medium-l', 'edge-medium-r', 'sloper-20']);
  const patched = updateStep(editable, editable[1].id, { holds: ['jug-l', 'jug-r'] });
  assert.deepEqual(holdsInWorkout(stripIds(patched)).slice(-2), ['jug-l', 'jug-r']);
  const cleared = clearHolds(editable);
  assert.deepEqual(holdsInWorkout(stripIds(cleared)), []);
  assert.equal(stripIds(cleared).length, 2);
});
