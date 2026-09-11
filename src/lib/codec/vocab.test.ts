import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';

import { BOARD_IDS, getBoard } from '../boards';
import { PRESETS } from '../store/presets';
import { TABLES } from './models';
import { normalizeText } from './text';
import { SNAPSHOT } from './vocab.snapshot';
import { codecGrips, PHRASES, WORDS } from './vocab';

const hash = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);

const APPEND_ONLY =
  'Codes refer to this by index: append new entries at the end and never reorder or remove.';

test('the probability model is frozen', () => {
  assert.equal(
    hash(TABLES),
    SNAPSHOT.tables,
    'Changing TABLES changes every shared code. Leave it alone, or add a new format version.'
  );
});

test('vocabularies only ever grow at the end', () => {
  assert.equal(
    hash(WORDS.slice(0, SNAPSHOT.words.count)),
    SNAPSHOT.words.hash,
    `WORDS: ${APPEND_ONLY}`
  );
  assert.equal(
    hash(PHRASES.slice(0, SNAPSHOT.phrases.count)),
    SNAPSHOT.phrases.hash,
    `PHRASES: ${APPEND_ONLY}`
  );
  assert.deepEqual(
    BOARD_IDS.slice(0, SNAPSHOT.boards.length),
    SNAPSHOT.boards,
    `Boards: ${APPEND_ONLY}`
  );
  assert.deepEqual(
    PRESETS.slice(0, SNAPSHOT.presets.length).map((p) => p.id),
    SNAPSHOT.presets,
    `PRESETS: ${APPEND_ONLY}`
  );
  for (const [id, grips] of Object.entries(SNAPSHOT.grips)) {
    const live = codecGrips(getBoard(id)!).map((g) => g.join('+'));
    assert.deepEqual(live.slice(0, grips.length), grips, `${id} holds: ${APPEND_ONLY}`);
  }
});

test('every vocabulary fits the slots the model reserves', () => {
  assert.ok(WORDS.length <= TABLES.text.wordIndex.length);
  assert.ok(PHRASES.length <= TABLES.text.phraseIndex.length);
  assert.ok(BOARD_IDS.length <= TABLES.boardIndex.length);
  assert.ok(PRESETS.length <= TABLES.presetIndex.length);
  for (const id of BOARD_IDS)
    assert.ok(codecGrips(getBoard(id)!).length <= TABLES.gripIndex.length);
});

test('words are unique lowercase tokens and phrases are unique normalised text', () => {
  assert.equal(new Set(WORDS).size, WORDS.length);
  for (const word of WORDS) {
    assert.match(word, /^\S+$/u, word);
    assert.equal(word, word.toLowerCase());
  }
  assert.equal(new Set(PHRASES).size, PHRASES.length);
  for (const phrase of PHRASES) assert.equal(normalizeText(phrase), phrase);
});

test('built-in names and labels are among the cheapest phrases', () => {
  const cheap = new Set(PHRASES.slice(0, 32));
  const labels = (steps: (typeof PRESETS)[number]['steps']): string[] =>
    steps.flatMap((s) => (s.kind === 'repeat' ? labels(s.steps) : s.label ? [s.label] : []));
  for (const preset of PRESETS) {
    assert.ok(cheap.has(preset.name), preset.name);
    for (const label of labels(preset.steps)) assert.ok(cheap.has(label), label);
  }
});

test('value tables list distinct values inside their range', () => {
  const check = (
    spec: { values: readonly number[]; weights: readonly number[] },
    [min, max]: readonly number[]
  ) => {
    assert.equal(spec.values.length, spec.weights.length);
    assert.equal(new Set(spec.values).size, spec.values.length);
    for (const v of spec.values) assert.ok(v >= min && v <= max, String(v));
  };
  TABLES.stepCount.forEach((spec) => check(spec, TABLES.ranges.count));
  Object.values(TABLES.seconds).forEach((spec) => check(spec, TABLES.ranges.seconds));
  TABLES.times.forEach((spec) => check(spec, TABLES.ranges.times));
  check(TABLES.text.wordCount, TABLES.ranges.words);
});
