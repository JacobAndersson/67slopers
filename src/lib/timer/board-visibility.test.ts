import assert from 'node:assert/strict';
import { test } from 'node:test';

import { shouldShowBoard } from './board-visibility';

test('shows on the first prep', () => {
  assert.equal(
    shouldShowBoard({
      phase: 'prep',
      previousHang: undefined,
      nextHang: { holds: ['a'] },
      hasBoard: true,
      finished: false,
    }),
    true
  );
});

test('hides on later preps, even with a grip change', () => {
  assert.equal(
    shouldShowBoard({
      phase: 'prep',
      previousHang: { holds: ['a'] },
      nextHang: { holds: ['b'] },
      hasBoard: true,
      finished: false,
    }),
    false
  );
});

test('shows on the opening hang when a workout starts there', () => {
  assert.equal(
    shouldShowBoard({
      phase: 'hang',
      previousHang: undefined,
      nextHang: { holds: ['b'] },
      currentHolds: ['a'],
      hasBoard: true,
      finished: false,
    }),
    true
  );
  assert.equal(
    shouldShowBoard({
      phase: 'hang',
      previousHang: undefined,
      currentHolds: [],
      hasBoard: true,
      finished: false,
    }),
    false
  );
});

test('hides during hangs after the first', () => {
  assert.equal(
    shouldShowBoard({
      phase: 'hang',
      previousHang: { holds: ['a'] },
      nextHang: { holds: ['b'] },
      currentHolds: ['a'],
      hasBoard: true,
      finished: false,
    }),
    false
  );
});

test('shows on rest and pause only when the grip changes', () => {
  for (const phase of ['rest', 'pause'] as const) {
    assert.equal(
      shouldShowBoard({
        phase,
        previousHang: { holds: ['a'] },
        nextHang: { holds: ['b'] },
        hasBoard: true,
        finished: false,
      }),
      true,
      phase
    );
    assert.equal(
      shouldShowBoard({
        phase,
        previousHang: { holds: ['a'] },
        nextHang: { holds: ['a'] },
        hasBoard: true,
        finished: false,
      }),
      false,
      `${phase} same grip`
    );
  }
});

test('hides without a board, without a next grip, or when finished', () => {
  assert.equal(
    shouldShowBoard({
      phase: 'prep',
      previousHang: undefined,
      nextHang: { holds: ['a'] },
      hasBoard: false,
      finished: false,
    }),
    false
  );
  assert.equal(
    shouldShowBoard({
      phase: 'rest',
      previousHang: { holds: ['a'] },
      nextHang: { holds: [] },
      hasBoard: true,
      finished: false,
    }),
    false
  );
  assert.equal(
    shouldShowBoard({
      phase: 'prep',
      previousHang: undefined,
      nextHang: { holds: ['a'] },
      hasBoard: true,
      finished: true,
    }),
    false
  );
});
