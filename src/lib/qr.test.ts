import assert from 'node:assert/strict';
import { test } from 'node:test';

import jsqrModule from 'jsqr';

import { makeQr, qrPath, QUIET_ZONE, type QrMatrix } from './qr';
import { PRESETS } from './store/presets';
import { encodeWorkout } from './workout-codec';

const jsQR = (jsqrModule as unknown as { default?: typeof jsqrModule }).default ?? jsqrModule;

/** Paints the matrix black on white, `scale` pixels per module, with the quiet zone. */
function render(qr: QrMatrix, scale = 4) {
  const side = (qr.size + QUIET_ZONE * 2) * scale;
  const data = new Uint8ClampedArray(side * side * 4).fill(255);
  for (let row = 0; row < qr.size; row++) {
    for (let col = 0; col < qr.size; col++) {
      if (qr.modules[row * qr.size + col] !== 1) continue;
      for (let y = 0; y < scale; y++) {
        for (let x = 0; x < scale; x++) {
          const i = ((row + QUIET_ZONE) * scale + y) * side + (col + QUIET_ZONE) * scale + x;
          data.fill(0, i * 4, i * 4 + 3);
        }
      }
    }
  }
  return { data, side };
}

test('QR codes of workout codes scan back to the same digits', () => {
  const codes = [
    ...PRESETS.map((p) => encodeWorkout(p)),
    encodeWorkout({ name: 'Tuesday fingers', steps: [{ kind: 'hang', seconds: 13 }] }),
    '0123456789'.repeat(8),
  ];
  for (const code of codes) {
    const qr = makeQr(code);
    const { data, side } = render(qr);
    assert.equal(jsQR(data, side, side)?.data, code);
  }
});

test('a built-in workout is the smallest code at the strongest correction', () => {
  for (const preset of PRESETS) {
    const qr = makeQr(encodeWorkout(preset));
    assert.equal(qr.version, 1);
    assert.equal(qr.size, 21);
    assert.equal(qr.ecc, 'H');
  }
  assert.equal(makeQr('1'.repeat(30)).ecc, 'M', '30 digits fit version 1 only up to level M');
});

test('the SVG path covers exactly the dark modules', () => {
  const qr = makeQr('8042247307582722507864133');
  const dark = qr.modules.reduce((n, m) => n + m, 0);
  const area = [...qrPath(qr).matchAll(/h(\d+)/g)].reduce((n, m) => n + Number(m[1]), 0);
  assert.equal(area, dark);
});
