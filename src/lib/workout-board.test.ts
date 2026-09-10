import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Step } from './store/types';
import { validateWorkout } from './workout-board';

const hangOn = (holds: string[]): Step => ({ kind: 'hang', seconds: 7, holds });

test('validateWorkout accepts real grips on the chosen board', () => {
  assert.deepEqual(
    validateWorkout({
      board: 'beastmaker-1000',
      steps: [
        { kind: 'prep', seconds: 10 },
        {
          kind: 'repeat',
          times: 3,
          skipLastRest: true,
          steps: [hangOn(['edge-medium-l', 'edge-medium-r']), { kind: 'rest', seconds: 3 }],
        },
        hangOn(['sloper-20']),
      ],
    }),
    []
  );
  assert.deepEqual(validateWorkout({ steps: [{ kind: 'hang', seconds: 7 }] }), []);
});

test('validateWorkout refuses holds without a board, foreign holds and half pairs', () => {
  assert.deepEqual(validateWorkout({ steps: [hangOn(['sloper-20'])] }), [
    'Pick a hangboard or clear the hold choices.',
  ]);
  assert.match(
    validateWorkout({
      board: 'beastmaker-2000',
      steps: [hangOn(['edge-medium-l', 'edge-medium-r'])],
    })[0],
    /Unknown holds for the Beastmaker 2000/
  );
  assert.match(
    validateWorkout({ board: 'beastmaker-1000', steps: [hangOn(['jug-l'])] })[0],
    /Unknown holds/
  );
  // Step problems still come first.
  assert.equal(
    validateWorkout({ board: 'beastmaker-1000', steps: [{ kind: 'rest', seconds: 5 }] })[0],
    'Add at least one hang.'
  );
});
