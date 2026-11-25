import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  COUNT_LEADING,
  COUNT_MAX,
  countShape,
  countSize,
  countSlots,
  countText,
  runShapes,
  slotEm,
} from './count';
import { expandWorkout } from './intervals';

/** Repeaters 7:3 with a 3:00 rest between sets, as on Home. */
const repeaters = expandWorkout({
  steps: [
    { kind: 'prep', seconds: 10 },
    {
      kind: 'repeat',
      times: 2,
      steps: [
        {
          kind: 'repeat',
          times: 3,
          steps: [
            { kind: 'hang', seconds: 7 },
            { kind: 'rest', seconds: 3 },
          ],
        },
        { kind: 'rest', seconds: 180 },
      ],
    },
  ],
});
const short = expandWorkout({
  steps: [
    { kind: 'prep', seconds: 10 },
    { kind: 'hang', seconds: 7 },
    { kind: 'rest', seconds: 30 },
    { kind: 'hang', seconds: 7 },
  ],
});

/** Drawn width of `text` at `size`, in pt. */
const drawn = (text: string, size: number) => [...text].reduce((w, c) => w + slotEm(c) * size, 0);

const PHONE = { width: 390, room: 600 };

test('a minute or more counts as m:ss, anything shorter in plain seconds', () => {
  assert.equal(countText(180, 180), '3:00');
  assert.equal(countText(180, 59), '0:59');
  assert.equal(countText(45, 9), '9');
  assert.equal(countText(600, 599), '9:59');
});

test('a digit that drops off becomes a leading zero and the others stay put', () => {
  assert.deepEqual(countSlots('10', countShape(10)), ['1', '0']);
  assert.deepEqual(countSlots('9', countShape(10)), ['0', '9']);
  const before = countSlots('10:00', countShape(600));
  const after = countSlots('9:59', countShape(600));
  assert.equal(before.length, after.length);
  assert.equal(before.indexOf(':'), after.indexOf(':'));
  assert.deepEqual(after, ['0', '9', ':', '5', '9']);
  assert.deepEqual(countSlots('7', countShape(7)), ['7']);
});

test('intervals of one shape share their slots, so a boundary can roll their digits', () => {
  assert.equal(countShape(7), countShape(3));
  assert.equal(countShape(180), countShape(90));
  assert.notEqual(countShape(10), countShape(7));
});

test('a run has one count size: a 3:00 rest and a 7 s hang draw the same digits', () => {
  const size = countSize(runShapes(repeaters), PHONE.width, PHONE.room);
  assert.ok(drawn('3:00', size) <= PHONE.width * 0.92 + 1e-9, 'the widest fits');
  assert.ok(size > 150, `larger than the old m:ss size, got ${size}`);
  assert.ok(size < COUNT_MAX);
  assert.deepEqual(runShapes(repeaters).sort(), ['0', '0:00', '00'].sort());
});

test('a run of short intervals keeps the full size', () => {
  assert.equal(countSize(runShapes(short), PHONE.width, PHONE.room), COUNT_MAX);
});

test('a tight room bounds the size by height, and it never goes under the floor', () => {
  const tight = countSize(runShapes(short), PHONE.width, 150);
  assert.ok(tight * COUNT_LEADING <= 150 + 1e-9);
  assert.equal(countSize(runShapes(short), PHONE.width, 10), 56);
});

test('a larger system font scale draws a short count larger, but never past the width', () => {
  const plain = countSize(runShapes(short), PHONE.width, PHONE.room);
  const large = countSize(runShapes(short), PHONE.width, PHONE.room, 1.3);
  assert.ok(large > plain, `${large} > ${plain}`);
  assert.ok(drawn('10', large) <= PHONE.width * 0.92 + 1e-9);
  const wide = countSize(runShapes(repeaters), PHONE.width, PHONE.room, 1.3);
  assert.equal(wide, countSize(runShapes(repeaters), PHONE.width, PHONE.room));
});
