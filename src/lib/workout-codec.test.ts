import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BOARD_IDS, getBoard, type BoardId } from './boards';
import { Encoder } from './codec/arith';
import { withCheckDigit } from './codec/check';
import { M } from './codec/models';
import { mulberry32 } from './codec/prng';
import { normalizeText } from './codec/text';
import { codecGrips, WORDS } from './codec/vocab';
import { makeQr } from './qr';
import { findPreset, PRESETS } from './store/presets';
import type { Step, StepKind, TimedStep } from './store/types';
import { CODEC_ERRORS, decodeWorkout, encodeWorkout, type ShareableWorkout } from './workout-codec';
import { cloneSteps, LIMITS } from './workout-steps';

const decoded = (code: string) => {
  const result = decodeWorkout(code);
  assert.ok(result.ok, `expected ${code} to decode: ${result.ok ? '' : result.error}`);
  return result;
};

const same = (code: string, workout: ShareableWorkout) => {
  const result = decoded(code);
  assert.deepEqual(
    { name: result.name, board: result.board, steps: result.steps },
    { name: workout.name, board: workout.board, steps: workout.steps }
  );
};

/** The first hang of a workout gets a different length. */
function edited(steps: Step[]): Step[] {
  const copy = cloneSteps(steps);
  const walk = (list: Step[]): boolean =>
    list.some((s) => {
      if (s.kind === 'repeat') return walk(s.steps);
      if (s.kind !== 'hang') return false;
      s.seconds = s.seconds === 10 ? 8 : 10;
      return true;
    });
  walk(copy);
  return copy;
}

test('an unchanged built-in workout is a three-digit code with its description', () => {
  for (const preset of PRESETS) {
    const code = encodeWorkout(preset);
    assert.ok(code.length <= 3, `${preset.name}: ${code}`);
    const result = decoded(code);
    assert.equal(result.name, preset.name);
    assert.deepEqual(result.steps, preset.steps);
    assert.equal(result.description, preset.description);
  }
});

test('edited built-in workouts keep their name and fit a 21×21 QR code', () => {
  for (const preset of PRESETS) {
    const workout = { name: preset.name, steps: edited(preset.steps) };
    const code = encodeWorkout(workout);
    same(code, workout);
    assert.ok(code.length <= 25, `${preset.name}: ${code.length} digits`);
    assert.equal(makeQr(code).version, 1, preset.name);
  }
  const repeaters = encodeWorkout({
    name: 'Repeaters 7:3',
    steps: edited(findPreset('repeaters-7-3')!.steps),
  });
  assert.ok(repeaters.length <= 6);
  assert.equal(makeQr(repeaters).ecc, 'H', 'short codes get the strongest error correction');
});

test('boards and grips round-trip, repeated grips cost almost nothing', () => {
  const hang = (holds: string[], label?: string): TimedStep => ({
    kind: 'hang',
    seconds: 10,
    ...(label ? { label } : {}),
    holds,
  });
  const workout: ShareableWorkout = {
    name: 'Max hangs',
    board: 'beastmaker-2000',
    steps: [
      { kind: 'prep', seconds: 10 },
      {
        kind: 'repeat',
        times: 5,
        steps: [hang(['edge-22'], 'Half crimp'), { kind: 'rest', seconds: 180 }],
      },
    ],
  };
  const code = encodeWorkout(workout);
  same(code, workout);
  assert.ok(code.length <= 13, code);

  const bm1000 = codecGrips(getBoard('beastmaker-1000')!);
  const twoGrips: ShareableWorkout = {
    board: 'beastmaker-1000',
    steps: [
      hang(bm1000[0]),
      { kind: 'rest', seconds: 60 },
      hang(bm1000[0]),
      { kind: 'rest', seconds: 60 },
      hang(bm1000[bm1000.length - 1]),
    ],
  };
  const oneGrip: ShareableWorkout = { ...twoGrips, steps: twoGrips.steps.slice(0, 1) };
  assert.ok(
    encodeWorkout(twoGrips).length - encodeWorkout(oneGrip).length <= 6,
    'two rests, a hang on the same grip and a hang on another grip add a few digits'
  );
  same(encodeWorkout(twoGrips), twoGrips);
});

test('labels are normalised, holds only travel on hangs', () => {
  const code = encodeWorkout({
    name: '  Tuesday   fingers ',
    board: 'beastmaker-2000',
    steps: [
      { kind: 'prep', seconds: 10, holds: ['edge-22'], label: '   ' },
      { kind: 'hang', seconds: 10, holds: ['edge-big-r', 'edge-big-l'], label: ' big  edge ' },
    ],
  });
  const result = decoded(code);
  assert.equal(result.name, 'Tuesday fingers');
  assert.deepEqual(result.steps, [
    { kind: 'prep', seconds: 10 },
    { kind: 'hang', seconds: 10, label: 'big edge', holds: ['edge-big-l', 'edge-big-r'] },
  ]);
});

const LABELS = ['Half crimp', 'open hand', '+12.5 kg', 'Hörst’s 7/53', '🧗 send', 'BM2000 (L)', ''];
const NAMES = ['', 'Max hangs', 'Tuesday fingers', 'jacob’s max', 'x'.repeat(130), 'Repeaters 7:3'];

function randomWorkout(random: () => number): {
  input: ShareableWorkout;
  expected: ShareableWorkout;
} {
  const pick = <T>(list: readonly T[]) => list[Math.floor(random() * list.length)];
  const board: BoardId | undefined = random() < 0.5 ? pick(BOARD_IDS) : undefined;
  const grips = board ? codecGrips(getBoard(board)!) : [];
  const timedStep = (kind: StepKind): TimedStep => {
    const { min, max } = LIMITS.seconds[kind];
    const step: TimedStep = {
      kind,
      seconds:
        random() < 0.5 ? pick([3, 7, 10, 60, 180]) : min + Math.floor(random() * (max - min)),
    };
    step.seconds = Math.min(max, Math.max(min, step.seconds));
    const label = random() < 0.25 ? pick(LABELS) : '';
    if (label) step.label = label;
    if (kind === 'hang' && grips.length && random() < 0.7) step.holds = [...pick(grips)];
    return step;
  };
  const list = (depth: number, size: number): Step[] =>
    Array.from({ length: size }, () => {
      if (depth < 2 && random() < 0.35) {
        return {
          kind: 'repeat' as const,
          times: 1 + Math.floor(random() * 99),
          steps: list(depth + 1, 1 + Math.floor(random() * 3)),
        };
      }
      return timedStep(pick(['prep', 'hang', 'hang', 'rest'] as const));
    });
  const steps = [...list(0, 1 + Math.floor(random() * 4)), timedStep('hang')];
  const input: ShareableWorkout = { name: pick(NAMES), ...(board ? { board } : {}), steps };
  const normalize = (list: Step[]): Step[] =>
    list.map((s) => {
      if (s.kind === 'repeat') return { ...s, steps: normalize(s.steps) };
      const out: TimedStep = { kind: s.kind, seconds: s.seconds };
      const label = normalizeText(s.label ?? '');
      if (label) out.label = label;
      if (s.holds) out.holds = s.holds;
      return out;
    });
  const name = normalizeText(input.name ?? '');
  return {
    input,
    expected: { ...(name ? { name } : {}), ...(board ? { board } : {}), steps: normalize(steps) },
  };
}

test('random valid workouts round-trip', () => {
  const random = mulberry32(7);
  for (let round = 0; round < 300; round++) {
    const { input, expected } = randomWorkout(random);
    if (JSON.stringify(input.steps).split('"kind"').length > LIMITS.maxSteps) continue;
    same(encodeWorkout(input), expected);
  }
});

test('every typo and neighbour swap is refused', () => {
  const code = encodeWorkout({ name: 'Two-grip repeaters', steps: edited(PRESETS[6].steps) });
  for (let i = 0; i < code.length; i++) {
    for (let d = 0; d < 10; d++) {
      if (String(d) === code[i]) continue;
      assert.equal(decodeWorkout(code.slice(0, i) + d + code.slice(i + 1)).ok, false);
    }
    if (i + 1 < code.length && code[i] !== code[i + 1]) {
      const swapped = code.slice(0, i) + code[i + 1] + code[i] + code.slice(i + 2);
      assert.equal(decodeWorkout(swapped).ok, false);
    }
  }
});

test('junk is refused with a message, rarely mistaken for a workout, and never throws', () => {
  for (const junk of ['', '0', 'abc', '12', 'v1 p10 6(6(h7 r3) r180)']) {
    const result = decodeWorkout(junk);
    assert.equal(result.ok, false, junk);
  }
  const random = mulberry32(11);
  let accepted = 0;
  const samples = 1000;
  for (let i = 0; i < samples; i++) {
    const digits = Array.from({ length: 2 + Math.floor(random() * 28) }, () =>
      Math.floor(random() * 10)
    ).join('');
    const result = decodeWorkout(digits);
    if (result.ok) {
      accepted++;
      assert.equal(encodeWorkout(result), digits);
    }
  }
  assert.ok(accepted / samples < 0.05, `${accepted} of ${samples} random codes accepted`);
});

test('codes from a newer vocabulary ask for an update', () => {
  const finish = (write: (enc: Encoder) => void) => {
    const enc = new Encoder();
    write(enc);
    return withCheckDigit(enc.finish());
  };
  const newerFormat = finish((enc) => enc.encode(M.version, 1));
  assert.deepEqual(decodeWorkout(newerFormat), { ok: false, error: CODEC_ERRORS.needsUpdate });

  const newerBoard = finish((enc) => {
    enc.encode(M.version, 0);
    enc.encode(M.workoutKind, 1);
    enc.encode(M.hasName, 0);
    enc.encode(M.hasBoard, 1);
    enc.encode(M.boardIndex, BOARD_IDS.length);
  });
  assert.deepEqual(decodeWorkout(newerBoard), { ok: false, error: CODEC_ERRORS.needsUpdate });

  const newerWord = finish((enc) => {
    enc.encode(M.version, 0);
    enc.encode(M.workoutKind, 1);
    enc.encode(M.hasName, 1);
    enc.encode(M.text.textKind, 0);
    M.text.wordCount.encode(enc, 1);
    enc.encode(M.text.wordKind.first, 0);
    enc.encode(M.text.wordIndex, WORDS.length);
  });
  assert.deepEqual(decodeWorkout(newerWord), { ok: false, error: CODEC_ERRORS.needsUpdate });
});

test('invalid workouts cannot be encoded', () => {
  assert.throws(() => encodeWorkout({ steps: [{ kind: 'rest', seconds: 10 }] }), /hang/);
});
