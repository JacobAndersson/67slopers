import assert from 'node:assert/strict';
import { test as run } from 'node:test';

import { LAYOUTS, boardKey } from './boards';
import { parseHold } from './grid';
import { MAX_HOLDS } from './protocol';
import {
  allProblems,
  benchmarks,
  climbable,
  countClimbable,
  findProblem,
  benchmarkCount,
  countUsing,
  holdCount,
  sampleProblem,
} from './problems';
import type { BoardKey, CustomProblem } from './types';

// The benchmark lists are not in the repository; a clone without them skips what reads them.
const test = benchmarkCount('2019-40') > 0 ? run : run.skip;

const BOARDS = LAYOUTS.flatMap((l) => l.angles.map((angle) => boardKey({ layout: l.id, angle })));

test('every layout and angle has its benchmark list', () => {
  for (const board of BOARDS) assert.ok(benchmarks(board).length > 50, board);
  assert.equal(benchmarks('2019-40').length, 399);
});

test('every bundled problem fits its board and the lights', () => {
  for (const board of BOARDS) {
    const layout = LAYOUTS.find((l) => board.startsWith(l.id))!;
    for (const p of benchmarks(board)) {
      assert.ok(p.start.length >= 1 && p.finish.length >= 1, `${board} ${p.name}`);
      assert.ok(holdCount(p) <= MAX_HOLDS, `${board} ${p.name}`);
      for (const hold of [...p.start, ...p.hold, ...p.finish]) {
        assert.ok(parseHold(hold, layout.rows), `${board} ${p.name} ${hold}`);
      }
      for (const set of p.holdSets) assert.ok(layout.holdSets.includes(set), `${board} ${p.name}`);
    }
  }
});

test('ids are unique per board and prefixed', () => {
  for (const board of BOARDS) {
    const ids = benchmarks(board).map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.every((id) => id.startsWith('b')));
  }
});

test('a problem is climbable when the wall has every hold set it needs', () => {
  const [first] = benchmarks('2019-40');
  assert.ok(climbable(first, first.holdSets));
  assert.ok(!climbable(first, first.holdSets.slice(1)));
  assert.equal(countClimbable('2019-40', [0, 1, 2, 4, 5, 6]), 399);
  assert.equal(countClimbable('2019-40', [0, 1, 2, 5, 6]), 245);
});

test('own problems come first and are found by id', () => {
  const own: CustomProblem = {
    id: 'c1',
    board: '2019-40',
    name: 'Mine',
    feet: 'any',
    start: ['A1'],
    hold: [],
    finish: ['A18'],
    createdAt: '2026-10-09T10:00:00.000Z',
  };
  const other: CustomProblem = { ...own, id: 'c2', board: '2016-40' as BoardKey };
  const list = allProblems('2019-40', [own, other]);
  assert.equal(list[0].id, 'c1');
  assert.equal(list.length, 400);
  assert.equal(findProblem('2019-40', [own], 'c1')?.custom, true);
  assert.equal(findProblem('2019-40', [own], list[1].id)?.name, list[1].name);
  assert.equal(findProblem('2019-40', [], 'c1'), undefined);
});

test('the summary agrees with the lists it stands in for', () => {
  for (const board of BOARDS) {
    const list = benchmarks(board);
    assert.equal(benchmarkCount(board), list.length, board);
    assert.deepEqual(sampleProblem(board), list[0], board);
    for (const set of LAYOUTS.find((l) => board.startsWith(l.id))!.holdSets) {
      assert.equal(countUsing(board, set), list.filter((p) => p.holdSets.includes(set)).length);
    }
  }
});
