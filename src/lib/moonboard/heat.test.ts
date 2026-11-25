import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatMinutes, heatGrid, heatLevel, monthLabels } from './heat';

const friday = new Date(2026, 9, 9, 12, 0); // Fri 9 Oct 2026

test('levels run from nothing to a full day', () => {
  assert.equal(heatLevel(0), 0);
  assert.equal(heatLevel(5), 1);
  assert.equal(heatLevel(15), 2);
  assert.equal(heatLevel(21), 3);
  assert.equal(heatLevel(34), 4);
  assert.equal(heatLevel(45), 5);
  assert.equal(heatLevel(500), 5);
});

test('the grid is eight Monday-first weeks ending this week', () => {
  const grid = heatGrid([], friday);
  assert.equal(grid.length, 8);
  assert.equal(grid[0][0].date.getDay(), 1);
  assert.equal(grid[0][0].date.getDate(), 17); // Mon 17 Aug
  assert.equal(grid[7][4].date.getDate(), 9);
  assert.equal(grid[7][4].future, false);
  assert.equal(grid[7][5].future, true);
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
  assert.equal(grid[7][2].minutes, 72);
  assert.equal(grid[7][2].level, 5);
  assert.equal(grid.flat().filter((d) => d.minutes > 0).length, 1);
});

test('a month is labelled where its first Monday falls', () => {
  const labels = monthLabels(heatGrid([], friday));
  assert.deepEqual(
    labels.map((l) => l.week),
    [3, 7]
  );
});

test('minutes read as time', () => {
  assert.equal(formatMinutes(48), '48 min');
  assert.equal(formatMinutes(72), '1 h 12');
  assert.equal(formatMinutes(120), '2 h');
  assert.equal(formatMinutes(38 * 60 + 20), '38 h 20');
  assert.equal(formatMinutes(21 * 60 + 40), '21 h 40');
});
