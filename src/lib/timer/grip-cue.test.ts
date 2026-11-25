import assert from 'node:assert/strict';
import { test } from 'node:test';

import { gripCue } from './grip-cue';
import { expandWorkout } from './intervals';

test('the grip cue: first grip before the first hang, new grip when it changes', () => {
  const run = expandWorkout({
    steps: [
      { kind: 'prep', seconds: 10 },
      { kind: 'hang', seconds: 7, holds: ['a'] },
      { kind: 'rest', seconds: 30 },
      { kind: 'hang', seconds: 7, holds: ['a'] },
      { kind: 'rest', seconds: 30 },
      { kind: 'hang', seconds: 7, holds: ['b'] },
    ],
  });
  assert.deepEqual(gripCue(run, 0), { holds: ['a'], prefix: 'First grip' });
  assert.deepEqual(gripCue(run, 1), { holds: ['a'], prefix: null });
  assert.deepEqual(gripCue(run, 2), { holds: ['a'], prefix: null });
  assert.deepEqual(gripCue(run, 4), { holds: ['b'], prefix: 'New grip' });
});
