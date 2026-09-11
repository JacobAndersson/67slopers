import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Decoder, Encoder, tableModel, uniformModel, type Model } from './arith';
import { mulberry32 } from './prng';

test('random messages over random models round-trip', () => {
  const random = mulberry32(1);
  for (let round = 0; round < 200; round++) {
    const models: Model[] = Array.from({ length: 1 + Math.floor(random() * 4) }, () =>
      random() < 0.3
        ? uniformModel(1 + Math.floor(random() * 5000))
        : tableModel(
            Array.from({ length: 1 + Math.floor(random() * 12) }, () =>
              random() < 0.2 ? 0 : 1 + Math.floor(random() * 50)
            ).map((w, i, all) => (all.every((x) => x === 0) && i === 0 ? 1 : w))
          )
    );
    const message: [Model, number][] = [];
    for (let i = 0; i < Math.floor(random() * 60); i++) {
      const model = models[Math.floor(random() * models.length)];
      let symbol = Math.floor(random() * model.total);
      symbol = model.find(symbol);
      message.push([model, symbol]);
    }
    const enc = new Encoder();
    for (const [model, symbol] of message) enc.encode(model, symbol);
    const digits = enc.finish();
    const dec = new Decoder(digits);
    for (const [model, symbol] of message) assert.equal(dec.decode(model), symbol);
  }
});

test('a message costs at most one digit more than its information', () => {
  const random = mulberry32(2);
  const model = tableModel([50, 30, 10, 5, 3, 1, 1]);
  for (let round = 0; round < 100; round++) {
    const enc = new Encoder();
    let log10p = 0;
    for (let i = 0; i < 40; i++) {
      const symbol = model.find(Math.floor(random() * model.total));
      enc.encode(model, symbol);
      log10p += Math.log10(model.weight(symbol) / model.total);
    }
    assert.ok(enc.finish().length <= Math.max(1, Math.ceil(-log10p) + 1));
  }
});

test('one decimal symbol is one digit; a certain message is a single zero', () => {
  for (let s = 0; s < 10; s++) {
    const enc = new Encoder();
    enc.encode(uniformModel(10), s);
    assert.equal(enc.finish(), String(s));
  }
  const enc = new Encoder();
  enc.encode(uniformModel(100), 7);
  assert.equal(enc.finish(), '07');
  assert.equal(new Encoder().finish(), '0');
});

test('zero-weight symbols can neither be written nor read', () => {
  const model = tableModel([3, 0, 2, 0]);
  assert.throws(() => new Encoder().encode(model, 1));
  assert.throws(() => new Encoder().encode(model, 3));
  for (let v = 0; v < model.total; v++) assert.ok([0, 2].includes(model.find(v)));
});

test('the decoder gives up on runaway input', () => {
  const dec = new Decoder('123456', 10);
  assert.throws(() => {
    for (;;) dec.decode(uniformModel(2));
  });
});
