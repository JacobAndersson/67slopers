import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  advance,
  circuitGrades,
  circuitProblems,
  isDone,
  runSummary,
  startRun,
  toggleProblem,
} from './circuits';
import type { Circuit, Problem } from './types';

const circuit: Circuit = {
  id: 'k',
  board: '2019-40',
  name: 'Pyramid',
  problemIds: ['a', 'b', 'c'],
  createdAt: '',
};
const lookup = (id: string) =>
  id === 'b' ? undefined : ({ id, name: id, grade: id === 'a' ? 3 : 7 } as Problem);

test('a circuit skips problems that no longer exist', () => {
  const problems = circuitProblems(circuit, lookup);
  assert.deepEqual(
    problems.map((p) => p.id),
    ['a', 'c']
  );
  assert.deepEqual(circuitGrades(problems), [3, 7]);
  assert.equal(circuitGrades([]), null);
});

test('toggle adds at the end and removes', () => {
  assert.deepEqual(toggleProblem(circuit, 'd').problemIds, ['a', 'b', 'c', 'd']);
  assert.deepEqual(toggleProblem(circuit, 'b').problemIds, ['a', 'c']);
});

test('a run steps through the problems in order and then is done', () => {
  let run = startRun(circuit);
  assert.equal(isDone(run), false);
  run = advance(run, { tries: 1, sent: true });
  run = advance(run, { tries: 3, sent: false });
  assert.equal(run.index, 2);
  run = advance(run, { tries: 2, sent: true });
  assert.ok(isDone(run));
  assert.deepEqual(
    run.results.map((r) => r.problemId),
    ['a', 'b', 'c']
  );
  assert.deepEqual(runSummary(run), { total: 3, sent: 2, tries: 6 });
  assert.equal(advance(run, { tries: 1, sent: true }), run);
});
