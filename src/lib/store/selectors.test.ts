import assert from 'node:assert/strict';
import { test } from 'node:test';

import { sortWorkoutsByLastUsed, weekStreak } from './selectors';
import type { Session, Workout } from './types';

const session = (date: Date): Session => ({
  id: date.toISOString(),
  workoutName: 'Repeaters',
  snapshot: { steps: [] },
  startedAt: date.toISOString(),
  completedAt: date.toISOString(),
  completedSets: 6,
  totalSets: 6,
  completed: true,
});

const now = new Date(2026, 8, 8, 12); // Tuesday 8 Sep 2026

test('weekStreak counts consecutive weeks back from this week', () => {
  const sessions = [
    session(new Date(2026, 8, 7)), // this week
    session(new Date(2026, 8, 2)), // last week
    session(new Date(2026, 7, 26)), // two weeks ago
  ];
  assert.equal(weekStreak(sessions, now), 3);
});

test('a week in progress without a session does not break the streak', () => {
  const sessions = [session(new Date(2026, 8, 2)), session(new Date(2026, 7, 26))];
  assert.equal(weekStreak(sessions, now), 2);
});

test('a gap week ends the streak', () => {
  const sessions = [session(new Date(2026, 8, 7)), session(new Date(2026, 7, 19))];
  assert.equal(weekStreak(sessions, now), 1);
  assert.equal(weekStreak([], now), 0);
});

test('sortWorkoutsByLastUsed puts the most recently run workout first, new ones by creation', () => {
  const w = (id: string, createdAt: string): Workout => ({
    id,
    name: id,
    steps: [],
    isPreset: false,
    createdAt,
    updatedAt: '2026-09-08T20:00:00.000Z', // a recent edit must not affect the order
  });
  const workouts = [
    w('a', '2026-09-01T10:00:00.000Z'),
    w('b', '2026-09-02T10:00:00.000Z'),
    w('c', '2026-09-08T09:00:00.000Z'),
  ];
  const sessions: Session[] = [
    { ...session(new Date(2026, 8, 7, 18)), workoutId: 'a' },
    { ...session(new Date(2026, 8, 5, 18)), workoutId: 'b' },
  ];
  assert.deepEqual(
    sortWorkoutsByLastUsed(workouts, sessions).map((x) => x.id),
    ['c', 'a', 'b'] // c is newest by creation, a ran most recently, b ran earlier
  );
});
