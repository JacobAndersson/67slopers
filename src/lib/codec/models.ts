import { tableModel, uniformModel, type Decoder, type Encoder, type Model } from './arith';

/**
 * The frozen probability model of the workout codec.
 *
 * Codes are arithmetic-coded against these weights, so changing ANY number or string in
 * `TABLES` changes the meaning of every code already shared; the codec test pins a hash of it.
 * Vocabularies (words, boards, presets, grips) are weighted by index, not by entry: their
 * names live append-only in `vocab.ts` and a new entry takes a free slot whose weight is
 * already here. A different model needs a new format version (the reserved `version` symbol).
 */

type ValueTable = {
  readonly values: readonly number[];
  readonly weights: readonly number[];
  readonly escape: number;
};

const slots = (weight: number, count: number): number[] => Array(count).fill(weight);

/** Weights per step kind, in the order of `STEP_KINDS`. */
type KindWeights = readonly [hang: number, rest: number, prep: number, repeat: number];

export const TABLES = {
  /** Format 0 (this one), or anything newer. */
  version: [255, 1],
  /** An unchanged built-in workout, or anything else. */
  workoutKind: [35, 65],
  hasName: [8, 92],
  hasBoard: [55, 45],
  presetIndex: [3, 3, 5, 6, 6, 3, 3, 2, 2, 2, ...slots(1, 22)],
  boardIndex: [6, 6, 3, 3, 3, 3, 3, 3, ...slots(1, 24)],
  gripIndex: [...slots(4, 16), ...slots(2, 16), ...slots(1, 32)],
  /** No holds, the previous hang's grip, or a grip index; "previous" only once there is one. */
  holdsFirst: [15, 0, 85],
  holdsNext: [12, 25, 63],
  hasLabel: { hang: [85, 15], other: [96, 4] },
  ranges: { count: [0, 127], seconds: [1, 1023], times: [1, 127], words: [1, 64] },
  /** Steps in a list, by depth: the workout, a repeat, a repeat inside a repeat. */
  stepCount: [
    { values: [2, 3, 1, 4, 5, 6, 7, 8], weights: [40, 25, 6, 10, 8, 5, 3, 2], escape: 2 },
    { values: [2, 1, 3, 4, 5, 6], weights: [55, 12, 18, 9, 3, 2], escape: 1 },
    { values: [2, 1, 3, 4], weights: [75, 10, 10, 3], escape: 1 },
  ],
  /** The next step's kind by depth and by the kind before it. No repeat starts at depth 2. */
  kind: [
    {
      start: [15, 2, 70, 13],
      prep: [25, 3, 1, 71],
      hang: [15, 65, 5, 15],
      rest: [35, 2, 3, 60],
      repeat: [15, 45, 5, 35],
    },
    {
      start: [55, 2, 3, 40],
      prep: [60, 8, 1, 31],
      hang: [15, 80, 2, 3],
      rest: [70, 5, 5, 20],
      repeat: [8, 85, 2, 5],
    },
    {
      start: [90, 5, 5, 0],
      prep: [90, 5, 5, 0],
      hang: [13, 85, 2, 0],
      rest: [90, 5, 5, 0],
      repeat: [90, 5, 5, 0],
    },
  ],
  seconds: {
    prep: {
      values: [10, 5, 15, 20, 30, 3, 60, 45, 8, 12, 25, 90, 120, 2, 4, 6],
      weights: [60, 8, 8, 6, 6, 2, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      escape: 2,
    },
    hang: {
      values: [10, 7, 5, 8, 12, 15, 20, 30, 6, 3, 45, 60, 9, 25, 40, 4, 90, 120],
      weights: [30, 25, 6, 5, 4, 5, 4, 6, 3, 2, 2, 2, 1, 1, 1, 1, 1, 1],
      escape: 3,
    },
    /** A rest inside a repeat inside a repeat: the pause between reps. */
    pause: {
      values: [3, 5, 10, 53, 50, 30, 20, 60, 2, 4, 6, 7, 8, 15, 45, 90],
      weights: [50, 10, 6, 5, 5, 5, 4, 4, 3, 2, 2, 1, 1, 2, 1, 1],
      escape: 3,
    },
    rest: {
      values: [
        180, 120, 60, 90, 240, 300, 150, 50, 30, 53, 20, 10, 45, 600, 3, 5, 15, 360, 420, 480, 210,
        100, 40, 70,
      ],
      weights: [30, 12, 12, 8, 6, 6, 6, 5, 4, 3, 2, 2, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      escape: 3,
    },
  },
  /** Rounds of a top-level repeat (sets), then of a nested one (reps). */
  times: [
    {
      values: [6, 5, 3, 4, 2, 8, 10, 1, 7, 12, 9, 15, 20],
      weights: [18, 16, 20, 12, 10, 8, 6, 3, 2, 2, 1, 1, 1],
      escape: 2,
    },
    {
      values: [6, 3, 5, 7, 2, 4, 8, 10, 12, 1, 9, 15, 20],
      weights: [30, 15, 10, 5, 8, 8, 5, 6, 3, 2, 1, 1, 1],
      escape: 2,
    },
  ],
  text: {
    /** Words, a phrase as listed, or a phrase with its first letter lowercased. */
    textKind: [55, 35, 10],
    phraseIndex: [...slots(12, 32), ...slots(4, 64), ...slots(1, 160)],
    wordCount: {
      values: [1, 2, 3, 4, 5, 6, 7, 8],
      weights: [30, 34, 18, 9, 5, 2, 1, 1],
      escape: 1,
    },
    /** dictionary, Dictionary, number, spelled, Spelled; for the first word and the rest. */
    wordKind: { first: [10, 50, 8, 7, 25], next: [55, 8, 12, 20, 5] },
    wordIndex: [...slots(16, 64), ...slots(6, 128), ...slots(2, 128), ...slots(1, 192)],
    /** Punctuation straight after a dictionary word or a number. */
    trail: [
      ['', 940],
      [',', 30],
      ['.', 10],
      [':', 6],
      [')', 4],
      ['!', 4],
      ['?', 3],
      [';', 3],
    ],
    sign: [
      ['', 90],
      ['+', 8],
      ['-', 2],
    ],
    /** Digits before the decimal point, 1 to 4. */
    integerDigits: [35, 45, 17, 3],
    /** None, .5, .25, .75, any other single digit, any other two digits. */
    fraction: [880, 70, 10, 10, 20, 10],
    suffix: [
      ['', 700],
      ['mm', 100],
      ['kg', 60],
      ['%', 40],
      ['s', 40],
      ['x', 30],
      ['lb', 10],
      ['lbs', 5],
      ['min', 10],
      ['°', 5],
    ],
    /** Spelled characters. <shift> capitalises the next letter, <escape> precedes a code point. */
    chars: [
      ['<end>', 150],
      ['<shift>', 12],
      ['<escape>', 2],
      ['e', 120],
      ['t', 88],
      ['a', 80],
      ['o', 74],
      ['i', 70],
      ['s', 70],
      ['n', 67],
      ['r', 60],
      ['h', 55],
      ['l', 42],
      ['d', 40],
      ['c', 28],
      ['u', 28],
      ['m', 25],
      ['g', 22],
      ['w', 20],
      ['f', 20],
      ['y', 20],
      ['p', 20],
      ['b', 15],
      ['v', 10],
      ['k', 10],
      ['x', 3],
      ['j', 2],
      ['z', 2],
      ['q', 1],
      ['0', 8],
      ['1', 8],
      ['2', 6],
      ['3', 5],
      ['4', 4],
      ['5', 5],
      ['6', 4],
      ['7', 4],
      ['8', 4],
      ['9', 3],
      ["'", 6],
      ['’', 6],
      ['-', 8],
      ['.', 4],
      [',', 3],
      [':', 2],
      ['/', 2],
      ['(', 1],
      [')', 2],
      ['+', 1],
      ['&', 1],
      ['!', 1],
      ['?', 1],
      ['#', 1],
      ['"', 1],
      ['°', 1],
      ['%', 1],
      ['å', 1],
      ['ä', 2],
      ['ö', 2],
      ['é', 2],
      ['ü', 1],
      ['ó', 1],
      ['á', 1],
      ['í', 1],
      ['ñ', 1],
      ['ø', 1],
      ['æ', 1],
      ['è', 1],
      ['ç', 1],
    ],
  },
} as const;

/** Step kinds in the order of the `kind` weights. */
export const STEP_KINDS = ['hang', 'rest', 'prep', 'repeat'] as const;
export type CodecStepKind = (typeof STEP_KINDS)[number];

/** A whole number in [min, max]: listed values by weight, any other one uniformly after an escape. */
export class ValueCoder {
  private readonly table: Model;
  private readonly rest: Model;
  private readonly listed: number[];

  constructor(
    private readonly spec: ValueTable,
    private readonly min: number,
    max: number
  ) {
    this.table = tableModel([...spec.weights, spec.escape]);
    this.listed = [...spec.values].sort((a, b) => a - b);
    this.rest = uniformModel(max - min + 1 - this.listed.length);
  }

  encode(enc: Encoder, value: number): void {
    const index = this.spec.values.indexOf(value);
    if (index >= 0) {
      enc.encode(this.table, index);
      return;
    }
    enc.encode(this.table, this.spec.values.length);
    enc.encode(this.rest, value - this.min - this.listed.filter((v) => v < value).length);
  }

  decode(dec: Decoder): number {
    const index = dec.decode(this.table);
    if (index < this.spec.values.length) return this.spec.values[index];
    let value = this.min + dec.decode(this.rest);
    for (const v of this.listed) {
      if (v <= value) value++;
      else break;
    }
    return value;
  }
}

const pairs = <T extends readonly (readonly [string, number])[]>(table: T) => ({
  symbols: table.map(([symbol]) => symbol),
  model: tableModel(table.map(([, weight]) => weight)),
});

const { ranges, text } = TABLES;
const chars = pairs(text.chars);
const charWeights = text.chars.map(([, weight]) => weight);
const shiftable = (symbol: string) =>
  [...symbol].length === 1 &&
  symbol.toUpperCase() !== symbol &&
  symbol.toUpperCase().toLowerCase() === symbol;

export const CHARS = {
  symbols: chars.symbols,
  index: new Map(chars.symbols.map((symbol, i) => [symbol, i])),
  end: chars.symbols.indexOf('<end>'),
  shift: chars.symbols.indexOf('<shift>'),
  escape: chars.symbols.indexOf('<escape>'),
};

const byPrevious = (weights: Record<'start' | CodecStepKind, KindWeights>) => ({
  start: tableModel(weights.start),
  prep: tableModel(weights.prep),
  hang: tableModel(weights.hang),
  rest: tableModel(weights.rest),
  repeat: tableModel(weights.repeat),
});

export const M = {
  version: tableModel(TABLES.version),
  workoutKind: tableModel(TABLES.workoutKind),
  hasName: tableModel(TABLES.hasName),
  hasBoard: tableModel(TABLES.hasBoard),
  presetIndex: tableModel(TABLES.presetIndex),
  boardIndex: tableModel(TABLES.boardIndex),
  gripIndex: tableModel(TABLES.gripIndex),
  holdsFirst: tableModel(TABLES.holdsFirst),
  holdsNext: tableModel(TABLES.holdsNext),
  hasLabel: { hang: tableModel(TABLES.hasLabel.hang), other: tableModel(TABLES.hasLabel.other) },
  stepCount: TABLES.stepCount.map((t) => new ValueCoder(t, ranges.count[0], ranges.count[1])),
  kind: TABLES.kind.map(byPrevious),
  seconds: {
    prep: new ValueCoder(TABLES.seconds.prep, ranges.seconds[0], ranges.seconds[1]),
    hang: new ValueCoder(TABLES.seconds.hang, ranges.seconds[0], ranges.seconds[1]),
    pause: new ValueCoder(TABLES.seconds.pause, ranges.seconds[0], ranges.seconds[1]),
    rest: new ValueCoder(TABLES.seconds.rest, ranges.seconds[0], ranges.seconds[1]),
  },
  times: TABLES.times.map((t) => new ValueCoder(t, ranges.times[0], ranges.times[1])),
  text: {
    textKind: tableModel(text.textKind),
    phraseIndex: tableModel(text.phraseIndex),
    wordCount: new ValueCoder(text.wordCount, ranges.words[0], ranges.words[1]),
    wordKind: { first: tableModel(text.wordKind.first), next: tableModel(text.wordKind.next) },
    wordIndex: tableModel(text.wordIndex),
    trail: pairs(text.trail),
    sign: pairs(text.sign),
    integerDigits: tableModel(text.integerDigits),
    fraction: tableModel(text.fraction),
    suffix: pairs(text.suffix),
    charFirst: tableModel(charWeights.map((w, i) => (i === CHARS.end ? 0 : w))),
    charNext: chars.model,
    charShifted: tableModel(charWeights.map((w, i) => (shiftable(CHARS.symbols[i]) ? w : 0))),
    codePoint: uniformModel(0x110000),
  },
};

/** The duration table for a timed step; rests between reps are much shorter than between sets. */
export function secondsCoder(kind: 'prep' | 'hang' | 'rest', depth: number): ValueCoder {
  if (kind === 'rest') return depth >= 2 ? M.seconds.pause : M.seconds.rest;
  return M.seconds[kind];
}
