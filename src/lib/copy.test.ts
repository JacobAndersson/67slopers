import assert from 'node:assert/strict';
import { test } from 'node:test';

import { greetingLines, sessionLine, shortDay, weekBars, weekSummary } from './copy';
import type { LogItem } from './training-log';

const NOW = new Date(2026, 10, 19, 8, 30); // Thursday 19 November 2026

const hang = (day: number, minutes: number, done = 6): LogItem => {
  const at = new Date(2026, 10, day, 7, 30).toISOString();
  return {
    kind: 'hang',
    id: `h${day}`,
    at,
    minutes,
    session: {
      id: `h${day}`,
      workoutName: 'Repeaters 7:3',
      snapshot: { steps: [] },
      startedAt: at,
      completedAt: at,
      completedSets: done,
      totalSets: 6,
      completed: done === 6,
    },
  };
};

test('days read as the design writes them', () => {
  assert.equal(shortDay(new Date(2026, 10, 18).toISOString(), NOW), 'Yesterday');
  assert.equal(shortDay(new Date(2026, 10, 16).toISOString(), NOW), 'Mon');
  assert.match(shortDay(new Date(2026, 10, 12).toISOString(), NOW), /12/);
});

test('a session line', () => {
  assert.equal(sessionLine(hang(18, 21), NOW), 'Yesterday  ·  6/6 sets');
  assert.equal(sessionLine(hang(16, 8, 2), NOW), 'Mon  ·  2/6 sets  ·  ended early');
});

test('the week starts on Monday and marks today', () => {
  const bars = weekBars([hang(18, 21), hang(12, 30)], NOW);
  assert.equal(bars.length, 7);
  assert.equal(bars[2].minutes, 21);
  assert.equal(bars[2].kind, 'hang');
  assert.equal(bars[3].today, true);
  assert.equal(
    bars.reduce((n, b) => n + b.minutes, 0),
    21
  );
  assert.equal(weekSummary([hang(18, 21)], 4, NOW), '1 session  ·  4-week streak');
});

test('greetings break into two words a line and end in a full stop', () => {
  assert.equal(greetingLines('Good morning'), 'Good\nmorning.');
  assert.equal(greetingLines('Still up?'), 'Still\nup?');
  assert.equal(greetingLines('Sleep is training too'), 'Sleep is\ntraining too.');
});
