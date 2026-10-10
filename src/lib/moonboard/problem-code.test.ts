import assert from 'node:assert/strict';
import { test } from 'node:test';

import { decodeProblemCode, encodeProblemCode, type SharedProblem } from './problem-code';

const problem: SharedProblem = {
  board: '2019-40',
  name: 'Slopers; anonymous',
  grade: 5,
  feet: 'follow',
  start: ['C4', 'F5'],
  hold: ['E8', 'H10', 'G13'],
  finish: ['F18'],
};

test('a problem survives the trip through its code, name punctuation included', () => {
  const code = encodeProblemCode(problem);
  assert.equal(code, 'MB1;2019-40;5;f;C4F5;E8H10G13;F18;Slopers; anonymous');
  assert.deepEqual(decodeProblemCode(code), problem);
});

test('an open grade and no middle holds are fine', () => {
  const open = { ...problem, grade: undefined, hold: [] };
  assert.deepEqual(decodeProblemCode(encodeProblemCode(open)), open);
});

test('anything else is not a problem', () => {
  assert.equal(decodeProblemCode('1234567890'), null);
  assert.equal(decodeProblemCode('MB1;2019-40;5;f;C4;;;x'), null); // no finish
  assert.equal(decodeProblemCode('MB1;1999-40;5;f;C4;;F18;x'), null); // no such board
  assert.equal(decodeProblemCode('MB1;mini2020-40;5;f;C4;;F18;x'), null); // row 18 on a Mini
  assert.equal(decodeProblemCode('MB1;2019-40;99;f;C4;;F18;x'), null);
  assert.equal(decodeProblemCode('MB1;2019-40;5;f;C4;C4;F18;x'), null); // a hold twice
  assert.equal(decodeProblemCode('MB1;2019-40;5;f;C4zz;;F18;x'), null);
});
