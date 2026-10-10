import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatMinutes, heatGrid, heatLevel, monthLabels } from './heat';

const friday = new Date(2026, 9, 9, 12, 0); // Fri 9 Oct 2026

test('levels run from nothing to a full day', () => {
  assert.equal(heatLevel(0), 0);
  assert.equal(heatLevel(5), 1);
  assert.equal(heatLevel(30), 2);
  assert.equal(heatLevel(50), 3);
  assert.equal(heatLevel(80), 4);
  assert.equal(heatLevel(500), 4);
});

test('the grid is sixteen Monday-first weeks ending this week', () => {
  const grid = heatGrid([], friday);
  assert.equal(grid.length, 16);
  assert.equal(grid[0][0].date.getDay(), 1);
  assert.equal(grid[0][0].date.getDate(), 22); // Mon 22 Jun
  assert.equal(grid[15][4].date.getDate(), 9);
  assert.equal(grid[15][4].future, false);
  assert.equal(grid[15][5].future, true);
});

test('sessions on one day add up', () => {
  const grid = heatGrid(
    [
      { at: new Date(2026, 9, 7, 7, 40).toISOString(), minutes: 24 },
      { at: new Date(2026, 9, 7, 18, 5).toISOString(), minutes: 48 },
      { at: new Date(2026, 0, 1).toISOString(), minutes: 60 },
    ],
    friday
  );
  assert.equal(grid[15][2].minutes, 72);
  assert.equal(grid[15][2].level, 4);
  assert.equal(grid.flat().filter((d) => d.minutes > 0).length, 1);
});

test('a month is labelled where its first Monday falls', () => {
  const labels = monthLabels(heatGrid([], friday));
  assert.deepEqual(
    labels.map((l) => l.week),
    [2, 6, 11, 15]
  );
});

test('minutes read as time', () => {
  assert.equal(formatMinutes(48), '48 min');
  assert.equal(formatMinutes(72), '1 h 12');
  assert.equal(formatMinutes(120), '2 h');
  assert.equal(formatMinutes(38 * 60 + 20), '38 h');
});
