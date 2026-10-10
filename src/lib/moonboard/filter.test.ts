import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DEFAULT_FILTER,
  activeFilterCount,
  filterProblems,
  gradeHistogram,
  gradeRange,
  hiddenByHoldSets,
} from './filter';
import type { ProblemStatus } from './logbook';
import { benchmarks } from './problems';
import type { Problem } from './types';

const p = (
  id: string,
  grade: number | undefined,
  sends: number,
  holdSets: number[] = [],
  extra = {}
) =>
  ({
    id,
    name: id,
    setter: 'Setter',
    grade,
    sends,
    stars: 4,
    holdSets,
    start: [],
    hold: [],
    finish: [],
    ...extra,
  }) as Problem;

const list = [
  p('easy', 2, 100),
  p('mid', 5, 300, [4]),
  p('hard', 9, 50),
  p('mine', undefined, 0, [], { custom: true, setter: 'You' }),
];
const status = new Map<string, ProblemStatus>([
  ['easy', { sent: true, tries: 1, sentOnTry: 1 }],
  ['hard', { sent: false, tries: 4 }],
]);
const ids = (filter = {}, holdSets = [4]) =>
  filterProblems(list, { ...DEFAULT_FILTER, ...filter }, holdSets, status).map((x) => x.id);

test('the default list is most climbed first', () => {
  assert.deepEqual(ids(), ['mid', 'easy', 'hard', 'mine']);
});

test('tabs split by what the log says', () => {
  assert.deepEqual(ids({ tab: 'sent' }), ['easy']);
  assert.deepEqual(ids({ tab: 'projects' }), ['hard']);
  assert.deepEqual(ids({ tab: 'mine' }), ['mine']);
  assert.deepEqual(
    filterProblems(list, { ...DEFAULT_FILTER, tab: 'saved' }, [4], status, ['hard']).map(
      (x) => x.id
    ),
    ['hard']
  );
});

test('the grade range keeps open own problems', () => {
  assert.deepEqual(ids({ gradeMin: 4, gradeMax: 6 }), ['mid', 'mine']);
});

test('problems that need a missing hold set are hidden unless asked for', () => {
  assert.deepEqual(ids({}, []), ['easy', 'hard', 'mine']);
  assert.deepEqual(ids({ onlyMyHolds: false }, []), ['mid', 'easy', 'hard', 'mine']);
  assert.equal(hiddenByHoldSets(list, DEFAULT_FILTER, [], status), 1);
  assert.equal(hiddenByHoldSets(list, { ...DEFAULT_FILTER, onlyMyHolds: false }, [], status), 0);
});

test('hide sent, search and sort', () => {
  assert.deepEqual(ids({ hideSent: true }), ['mid', 'hard', 'mine']);
  assert.deepEqual(ids({ query: ' HAR ' }), ['hard']);
  assert.deepEqual(ids({ query: 'you' }), ['mine']);
  assert.deepEqual(ids({ sort: 'easiest' }), ['easy', 'mid', 'hard', 'mine']);
  assert.deepEqual(ids({ sort: 'hardest' }), ['hard', 'mid', 'easy', 'mine']);
  assert.deepEqual(ids({ sort: 'name' }), ['easy', 'hard', 'mid', 'mine']);
});

test('the badge counts what was changed in the sheet', () => {
  assert.equal(activeFilterCount(DEFAULT_FILTER, [0, 16]), 0);
  assert.equal(
    activeFilterCount(
      { ...DEFAULT_FILTER, gradeMin: 2, gradeMax: 7, hideSent: true, sort: 'rated' },
      [2, 15]
    ),
    3
  );
});

test('the range and histogram describe the real list', (t) => {
  // The benchmark lists are not in the repository; a clone without them has nothing to describe.
  if (benchmarks('2019-40').length === 0) return t.skip('no benchmark lists');
  const real = benchmarks('2019-40');
  assert.deepEqual(gradeRange(real), [2, 15]);
  const histogram = gradeHistogram(real);
  assert.equal(
    histogram.reduce((a, b) => a + b, 0),
    399
  );
  assert.equal(histogram[6], 47);
  assert.deepEqual(gradeRange([]), [0, 16]);
});
