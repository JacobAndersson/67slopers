import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { RepeatStep, Step, TimedStep } from '../store/types';
import { countSets, expandWorkout, totalSeconds, trimTrailingRests } from './intervals';

const prep = (seconds: number): TimedStep => ({ kind: 'prep', seconds });
const hang = (seconds: number, label?: string): TimedStep =>
  label ? { kind: 'hang', seconds, label } : { kind: 'hang', seconds };
const rest = (seconds: number): TimedStep => ({ kind: 'rest', seconds });
const repeat = (times: number, steps: Step[], skipLastRest = true): RepeatStep => ({
  kind: 'repeat',
  times,
  skipLastRest,
  steps,
});

const repeaters = { steps: [prep(10), repeat(6, [repeat(6, [hang(7), rest(3)]), rest(180)])] };
const maxHangs = { steps: [prep(10), repeat(5, [hang(10), rest(180)])] };

const phases = (steps: Step[]) => expandWorkout({ steps }).map((i) => i.phase);

test('repeaters unroll into sets of reps with pauses inside and rests between', () => {
  const intervals = expandWorkout(repeaters);
  const count = (phase: string) => intervals.filter((i) => i.phase === phase).length;
  assert.equal(intervals[0].phase, 'prep');
  assert.equal(count('hang'), 36);
  assert.equal(count('pause'), 30);
  assert.equal(count('rest'), 5);
  assert.equal(intervals.at(-1)?.phase, 'done');
  assert.equal(totalSeconds(intervals), 10 + 6 * (6 * 7 + 5 * 3) + 5 * 180);
});

test('outer rounds are sets and inner rounds are reps', () => {
  const intervals = expandWorkout(repeaters);
  const hangs = intervals.filter((i) => i.phase === 'hang');
  assert.deepEqual(
    hangs.slice(0, 2).map((i) => [i.setIndex, i.setCount, i.repIndex, i.repCount]),
    [
      [0, 6, 0, 6],
      [0, 6, 1, 6],
    ]
  );
  // Set 2, rep 3 is the 6 + 2 = 8th hang.
  assert.deepEqual([hangs[8].setIndex, hangs[8].repIndex], [1, 2]);
  const firstRest = intervals.find((i) => i.phase === 'rest');
  assert.equal(firstRest?.setIndex, 0, 'the rest after a set keeps that set index');
});

test('a single-level repeat has no reps and its rests stay rests', () => {
  const intervals = expandWorkout(maxHangs);
  const hangs = intervals.filter((i) => i.phase === 'hang');
  assert.equal(hangs.length, 5);
  assert.ok(hangs.every((i) => i.repIndex === 0 && i.repCount === 1));
  assert.deepEqual(
    phases(maxHangs.steps).filter((p) => p === 'pause'),
    [],
    'no pause at depth one'
  );
  assert.deepEqual(phases([repeat(3, [hang(7), rest(3)])]), [
    'hang',
    'rest',
    'hang',
    'rest',
    'hang',
    'done',
  ]);
});

test('skipLastRest drops only the trailing rest of the final round', () => {
  assert.equal(phases([repeat(3, [hang(7), rest(3)])]).filter((p) => p === 'rest').length, 2);
  assert.equal(
    phases([repeat(3, [hang(7), rest(3)], false)]).filter((p) => p === 'rest').length,
    3
  );
  // Rests that are not trailing survive the final round.
  assert.deepEqual(phases([repeat(2, [rest(5), hang(7), rest(3)])]), [
    'rest',
    'hang',
    'rest',
    'rest',
    'hang',
    'done',
  ]);
  assert.deepEqual(trimTrailingRests([hang(7), rest(3), rest(4)]), [hang(7)]);
  assert.deepEqual(trimTrailingRests([rest(3)]), []);
});

test('top-level hangs count as sets and top-level rests belong to the set before them', () => {
  const steps = [prep(5), hang(10, 'warm up'), rest(60), repeat(2, [hang(7), rest(30)])];
  assert.equal(countSets(steps), 3);
  const intervals = expandWorkout({ steps });
  assert.deepEqual(
    intervals.map((i) => `${i.phase} ${i.setIndex}/${i.setCount}`),
    ['prep 0/3', 'hang 0/3', 'rest 0/3', 'hang 1/3', 'rest 1/3', 'hang 2/3', 'done 2/3']
  );
  assert.equal(intervals[1].label, 'warm up');
  assert.equal('label' in intervals[2], false, 'unlabelled steps carry no label key');
});

test('zero-length steps are skipped and an empty workout is just done', () => {
  assert.deepEqual(phases([prep(0), hang(7), rest(0)]), ['hang', 'done']);
  const empty = expandWorkout({ steps: [] });
  assert.deepEqual(empty, [
    { phase: 'done', seconds: 0, setIndex: 0, setCount: 0, repIndex: 0, repCount: 1 },
  ]);
});
