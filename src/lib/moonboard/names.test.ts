import assert from 'node:assert/strict';
import { test } from 'node:test';

import { describeHolds, displayName } from './names';

test('capitals read in sentence case; other names stay as typed', () => {
  assert.equal(displayName('THE WARM UP PROBLEM'), 'The warm up problem');
  assert.equal(displayName("SHADOW GAO'S PARTY"), "Shadow gao's party");
  assert.equal(displayName('A Wok To Remember'), 'A Wok To Remember');
  assert.equal(displayName('VV Victoria'), 'VV Victoria');
  assert.equal(displayName('6A+'), '6A+');
  assert.equal(displayName('SORRY I MISSED THE SECOND'), 'Sorry I missed the second');
  assert.equal(displayName("I'M BACK"), "I'm back");
});

test('holds read as words', () => {
  assert.equal(
    describeHolds({ start: ['A5'], hold: ['E8', 'E10'], finish: ['J18'] }),
    'Start A5. Hands E8, E10. Finish J18.'
  );
  assert.equal(describeHolds({ start: [], hold: [], finish: [] }), 'No holds yet.');
});
