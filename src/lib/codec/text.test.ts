import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Decoder, Encoder } from './arith';
import { MAX_TEXT, normalizeText, readText, writeText } from './text';

const encode = (text: string) => {
  const enc = new Encoder();
  writeText(enc, text);
  return enc.finish();
};

const roundTrip = (text: string) => readText(new Decoder(encode(text)));

test('names and labels round-trip exactly, after whitespace is normalised', () => {
  const samples = [
    'Half crimp',
    'half crimp',
    'Repeaters 7:3',
    'No-hangs, Emil style',
    '20 mm half crimp',
    '+12.5 kg, half crimp',
    '-5kg',
    '12.05',
    '0.75',
    '3.14159',
    '007',
    '9999',
    '10000',
    '10%',
    '20°',
    'BW',
    'McDonald’s',
    'Hörst’s 7/53',
    'ÖVERHÄNG',
    'İstanbul',
    'Straße',
    '🧗‍♀️ send it',
    'a b c',
    '.',
    '(left)',
    'hangs.',
    'Hangs!',
    'Tuesday fingers',
    'x'.repeat(MAX_TEXT),
    '  spaced \n  out  ',
  ];
  for (const text of samples) assert.equal(roundTrip(text), normalizeText(text), text);
});

test('normalizeText collapses whitespace and cuts long text', () => {
  assert.equal(normalizeText('  a \t b\n'), 'a b');
  assert.equal(normalizeText('y'.repeat(MAX_TEXT + 20)).length, MAX_TEXT);
  assert.throws(() => writeText(new Encoder(), '   '));
});

test('shared phrases and dictionary words are far cheaper than spelling', () => {
  // Measured on the frozen model; a phrase is one symbol, a spelled word a dozen.
  assert.ok(encode('Half crimp').length <= 3);
  assert.ok(encode('half crimp').length <= 3);
  assert.ok(encode('Smallest edge you can hold').length <= 3);
  assert.ok(encode('Three-grip max hangs').length <= 3);
  assert.ok(encode('crimp hangs').length <= 5);
  assert.ok(encode('qrimp hangz').length >= 3 * encode('crimp hangs').length);
  assert.ok(encode('+10 kg').length <= 8);
});
