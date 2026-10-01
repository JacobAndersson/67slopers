import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseStepperInput } from './stepper-input';

test('direct timing entry bounds partial, empty and pasted numbers', () => {
  assert.equal(parseStepperInput({ value: '' }, 1, 300), 1);
  assert.equal(parseStepperInput({ value: '7' }, 1, 300), 7);
  assert.equal(parseStepperInput({ value: '999' }, 1, 300), 300);
  assert.equal(parseStepperInput({ value: '12s' }, 1, 300), 12);
  assert.equal(parseStepperInput({ value: '0' }, 0, 99), 0);
});

test('minutes and seconds entry updates exactly, including sub-minute rests', () => {
  assert.equal(parseStepperInput({ minutes: '2', seconds: '30' }, 1, 900), 150);
  assert.equal(parseStepperInput({ minutes: '0', seconds: '01' }, 1, 900), 1);
  assert.equal(parseStepperInput({ minutes: '', seconds: '' }, 1, 900), 1);
  assert.equal(parseStepperInput({ minutes: '3', seconds: '99' }, 1, 900), 239);
  assert.equal(parseStepperInput({ minutes: '99', seconds: '00' }, 1, 900), 900);
});
