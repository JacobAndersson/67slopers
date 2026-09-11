import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPlayback } from './playback';

function fixture() {
  let resolve!: () => void;
  let reject!: (e: Error) => void;
  const events: string[] = [];
  const controller = createPlayback(
    {
      load: () =>
        new Promise<void>((yes, no) => {
          resolve = yes;
          reject = no;
        }),
      play: () => {
        events.push('play');
      },
      pause: () => {
        events.push('pause');
      },
    },
    () => events.push('failure')
  );
  return {
    controller,
    events,
    resolve: () => resolve(),
    reject: () => reject(new Error('decode')),
  };
}

test('pause while loading wins over earlier play request', async () => {
  const f = fixture();
  f.controller.setPlaying(true);
  const load = f.controller.load();
  f.controller.setPlaying(false);
  f.resolve();
  await load;
  assert.deepEqual(f.events, ['pause']);
  f.controller.setPlaying(true);
  assert.deepEqual(f.events, ['pause', 'play']);
});

test('unmount/skip invalidates late completion and late failure', async () => {
  for (const reject of [false, true]) {
    const f = fixture();
    f.controller.setPlaying(true);
    const load = f.controller.load();
    f.controller.dispose();
    if (reject) f.reject();
    else f.resolve();
    await load;
    assert.deepEqual(f.events, ['pause']);
  }
});

test('failed loads cannot play and report only once', async () => {
  const f = fixture();
  const load = f.controller.load();
  f.reject();
  await load;
  f.controller.setPlaying(true);
  f.controller.fail();
  assert.deepEqual(f.events, ['pause', 'failure']);
});

test('browser autoplay rejection is contained', async () => {
  let failures = 0;
  const controller = createPlayback(
    { load: async () => {}, play: () => Promise.reject(new Error('blocked')), pause: () => {} },
    () => failures++
  );
  controller.setPlaying(true);
  await controller.load();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(failures, 1);
});

test('an interrupted old play request does not fail a resumed player', async () => {
  let reject!: (error: Error) => void;
  let failures = 0;
  let calls = 0;
  const control = createPlayback(
    {
      load: async () => {},
      play: () =>
        ++calls === 1
          ? new Promise<void>((_, no) => {
              reject = no;
            })
          : Promise.resolve(),
      pause: () => {},
    },
    () => failures++
  );
  control.setPlaying(true);
  await control.load();
  control.setPlaying(false);
  control.setPlaying(true);
  reject(new Error('interrupted'));
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(failures, 0);
});
