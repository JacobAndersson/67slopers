import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createSender } from './send';

test('a message goes out in order, twenty characters at a time', async () => {
  const written: string[] = [];
  const send = createSender(async (chunk) => void written.push(chunk), 0);
  const message = 'l#S4,P8,P28,P40,P61,P77,E54#';
  assert.equal(await send(message), true);
  assert.deepEqual(written, ['l#S4,P8,P28,P40,P61,', 'P77,E54#']);
});

test('while one message is going out only the newest waiting one follows', async () => {
  const written: string[] = [];
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => (release = resolve));
  const send = createSender(async (chunk) => {
    if (written.length === 0) await gate;
    written.push(chunk);
  }, 0);
  const first = send('l#S1#');
  const second = send('l#S2#');
  const third = send('l#S3#');
  release();
  assert.deepEqual(await Promise.all([first, second, third]), [true, false, true]);
  assert.deepEqual(written, ['l#S1#', 'l#S3#']);
});

test('a failed write reports false and does not block the next message', async () => {
  let fail = true;
  let failures = 0;
  const send = createSender(
    async () => {
      if (fail) throw new Error('gone');
    },
    0,
    () => (failures += 1)
  );
  assert.equal(await send('l#S1#'), false);
  assert.equal(failures, 1);
  fail = false;
  assert.equal(await send('l#S1#'), true);
});
