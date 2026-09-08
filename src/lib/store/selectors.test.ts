import assert from 'node:assert/strict';
import { test } from 'node:test';

import { weekStreak } from './selectors';
import type { Session } from './types';

const session = (date: Date): Session => ({
  id: date.toISOString(),
  workoutName: 'Repeaters',
  snapshot: { prepSeconds: 10, blocks: [] },
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
