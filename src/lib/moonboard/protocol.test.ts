import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CLEAR, chunks, encodeCorners, encodeProblem, isBoardName } from './protocol';

const problem = { start: ['A5'], hold: ['B8', 'A9'], finish: ['D18'] };

test('a problem is one line of LED numbers tagged by role, in ascending order', () => {
  // A5 = 4, A9 = 8, B8 = 18 + (17 - 7) = 28, D18 = 54 + 0 = 54
  assert.equal(encodeProblem(problem, { rows: 18 }), 'l#S4,P8,P28,E54#');
});

test('the above-hold flag goes in front of the problem', () => {
  assert.equal(encodeProblem(problem, { rows: 18, above: true }), '~D*l#S4,P8,P28,E54#');
});

test('the Mini announces itself and counts twelve rows', () => {
  assert.equal(
    encodeProblem({ start: ['A1'], hold: ['B12'], finish: [] }, { rows: 12 }),
    '~M*l#S0,P12#'
  );
});

test('holds that are not on the board are left out', () => {
  assert.equal(
    encodeProblem({ start: ['A1'], hold: ['Z9'], finish: ['A14'] }, { rows: 12 }),
    '~M*l#S0#'
  );
});

test('wiring corrections change the numbers, not the message shape', () => {
  assert.equal(
    encodeProblem({ start: ['A1'], hold: [], finish: [] }, { rows: 18, mirror: true }),
    'l#S180#'
  );
});

test('an empty problem is the clear message', () => {
  assert.equal(encodeProblem({ start: [], hold: [], finish: [] }, { rows: 18 }), CLEAR);
});

test('the corner test lights the four corners in blue', () => {
  assert.equal(encodeCorners({ rows: 18 }), 'l#P0,P17,P180,P197#');
});

test('messages are cut into twenty-byte writes that join back up', () => {
  const message = encodeProblem(problem, { rows: 18, above: true });
  const parts = chunks(message);
  assert.ok(parts.every((part) => part.length <= 20));
  assert.equal(parts.join(''), message);
  assert.deepEqual(chunks('abc', 2), ['ab', 'c']);
});

test('board names are recognised whatever their case', () => {
  assert.ok(isBoardName('MoonBoard A'));
  assert.ok(isBoardName('Moonboard 7F2C'));
  assert.ok(!isBoardName('Speaker'));
  assert.ok(!isBoardName(null));
});
