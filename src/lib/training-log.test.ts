import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { LogEntry } from './moonboard/types';
import type { Session } from './store/types';
import { itemsOnDay, totalsSince, trainingLog, trainingStreak } from './training-log';

const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 9, day, hour, minute).toISOString();
const hang = (id: string, start: string, end: string) =>
  ({ id, workoutName: 'Repeaters', startedAt: start, completedAt: end }) as Session;
const climb = (id: string, when: string, sent = true) =>
  ({
    id,
    problemId: id,
    board: '2019-40',
    at: when,
    tries: 1,
    sent,
    name: id,
    grade: 5,
  }) as LogEntry;

const sessions = [hang('h1', at(7, 7, 40), at(7, 8, 4)), hang('h2', at(1, 18), at(1, 18, 16))];
const log = [
  climb('c1', at(7, 18, 5)),
  climb('c1b', at(7, 18, 30)),
  climb('c2', at(7, 18, 53)),
  climb('c3', at(9, 18)),
];
const friday = new Date(2026, 9, 9, 20);

test('timer and board sessions make one list, newest first', () => {
  const items = trainingLog(sessions, log);
  assert.deepEqual(
    items.map((i) => `${i.kind}:${i.id}`),
    ['climb:c3', 'climb:c1', 'hang:h1', 'hang:h2']
  );
  assert.equal(items[1].minutes, 48);
  assert.equal(items[2].minutes, 24);
});

test('a day shows everything trained on it', () => {
  const items = trainingLog(sessions, log);
  assert.deepEqual(
    itemsOnDay(items, new Date(2026, 9, 7)).map((i) => i.id),
    ['c1', 'h1']
  );
  assert.deepEqual(itemsOnDay(items, new Date(2026, 9, 8)), []);
});

test('the streak counts weeks with any kind of training', () => {
  assert.equal(trainingStreak(trainingLog(sessions, log), friday), 2);
  assert.equal(trainingStreak(trainingLog([], [climb('c', at(1, 10))]), friday), 1);
  assert.equal(trainingStreak([], friday), 0);
});

test('totals cover the period asked for', () => {
  const items = trainingLog(sessions, log);
  assert.deepEqual(totalsSince(items, new Date(2026, 9, 5)), { sessions: 3, minutes: 77 });
});
