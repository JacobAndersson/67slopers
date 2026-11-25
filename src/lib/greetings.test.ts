import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ALL_GREETINGS, greeting, PART_STARTS } from './greetings';

test('a few per part of the day, none twice, each a few plain words', () => {
  assert.ok(ALL_GREETINGS.length >= 20);
  assert.equal(new Set(ALL_GREETINGS).size, ALL_GREETINGS.length);
  for (const line of ALL_GREETINGS) {
    assert.ok(line.length <= 26, line);
    assert.ok(line.split(' ').length <= 4, line);
    assert.doesNotMatch(line, /!|crusher|gains/i, line);
  }
});

test('every hour of every weekday has a greeting', () => {
  for (let day = 1; day <= 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      assert.ok(ALL_GREETINGS.includes(greeting(new Date(2026, 9, day, hour, 30))));
    }
  }
});

test('the line holds within a part of the day and follows the clock', () => {
  assert.equal(greeting(new Date(2026, 9, 10, 9, 0)), greeting(new Date(2026, 9, 10, 11, 59)));
  assert.notEqual(greeting(new Date(2026, 9, 10, 10, 0)), greeting(new Date(2026, 9, 10, 2, 0)));
  assert.deepEqual(PART_STARTS, [0, 5, 9, 12, 14, 17, 21]);
});

test('the days differ', () => {
  const lines = new Set<string>();
  for (let day = 1; day <= 28; day++) lines.add(greeting(new Date(2026, 9, day, 18, 0)));
  assert.ok(lines.size >= 3);
});

test('weekday lines stay out of the small hours', () => {
  for (let day = 1; day <= 28; day++) {
    assert.doesNotMatch(greeting(new Date(2026, 9, day, 2, 0)), /Sunday|Friday|week/i);
  }
});
