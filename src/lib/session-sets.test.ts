import assert from 'node:assert/strict';
import { test } from 'node:test';

import { sessionVerdict, setResults } from './session-sets';

const maxHangs = {
  steps: [
    { kind: 'prep' as const, seconds: 10 },
    {
      kind: 'repeat' as const,
      times: 5,
      steps: [
        { kind: 'hang' as const, seconds: 10 },
        { kind: 'rest' as const, seconds: 180 },
      ],
    },
  ],
};

test('hangs add up per set; sets never reached are not run', () => {
  const sets = setResults(maxHangs, [
    { planned: 10, actual: 10 },
    { planned: 10, actual: 10 },
    { planned: 10, actual: 6 },
  ]);
  assert.deepEqual(sets, [
    { planned: 10, actual: 10, ran: true },
    { planned: 10, actual: 10, ran: true },
    { planned: 10, actual: 6, ran: true },
    { planned: 10, actual: 0, ran: false },
    { planned: 10, actual: 0, ran: false },
  ]);
});

test('the verdict in words', () => {
  assert.equal(sessionVerdict(true, 6), 'All six sets, every hang to the end.');
  assert.equal(sessionVerdict(false, 5), 'Ended early. Saved with the sets you finished.');
});
