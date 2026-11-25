import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatClock, formatShort, relativeDay, startOfWeek, timeAgo } from './dates';

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

test('timeAgo counts minutes and hours, then falls back to the day', () => {
  const now = new Date(2026, 8, 11, 18, 0);
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();
  assert.equal(timeAgo(ago(0.5), now), 'just now');
  assert.equal(timeAgo(ago(25), now), '25 min ago');
  assert.equal(timeAgo(ago(150), now), '2 h ago');
  assert.equal(timeAgo(ago(60 * 30), now), relativeDay(ago(60 * 30), now));
});
