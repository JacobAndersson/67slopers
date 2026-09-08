import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatClock, formatShort, relativeDay, startOfWeek, weekDays } from './dates';

test('startOfWeek returns the Monday at local midnight', () => {
  const thursday = new Date(2026, 8, 10, 15, 30); // Thu 10 Sep 2026
  const monday = startOfWeek(thursday);
  assert.equal(monday.getDay(), 1);
  assert.equal(monday.getDate(), 7);
  assert.equal(monday.getHours(), 0);
});

test('startOfWeek on a Sunday goes back six days', () => {
  const sunday = new Date(2026, 8, 13, 9, 0);
  assert.equal(startOfWeek(sunday).getDate(), 7);
});

test('weekDays spans Monday to Sunday', () => {
  const days = weekDays(new Date(2026, 8, 10));
  assert.equal(days.length, 7);
  assert.deepEqual(
    days.map((d) => d.getDate()),
    [7, 8, 9, 10, 11, 12, 13]
  );
});

test('relativeDay', () => {
  const now = new Date(2026, 8, 10, 12, 0);
  assert.equal(relativeDay(new Date(2026, 8, 10, 8).toISOString(), now), 'Today');
  assert.equal(relativeDay(new Date(2026, 8, 9, 23).toISOString(), now), 'Yesterday');
  assert.equal(relativeDay(new Date(2026, 8, 7).toISOString(), now), '3 days ago');
});

test('formatClock and formatShort', () => {
  assert.equal(formatClock(7), '0:07');
  assert.equal(formatClock(180), '3:00');
  assert.equal(formatClock(3725), '62:05');
  assert.equal(formatShort(7), '7s');
  assert.equal(formatShort(90), '1:30');
});
