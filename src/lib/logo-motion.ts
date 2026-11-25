/**
 * The Rivet mark in motion: geometry of the Pitch symbol and the timing of every logo animation,
 * as pure worklet functions so the UI thread can run them and `npm test` can check them.
 *
 * Brand book p.42, "Lift, then settle": things move like a body on a hold, a confident lift and a
 * soft catch. Loading lifts the three bars in turn on a 1.2 s loop. Launch screens are Night with the
 * symbol in Glow (p.47). Reduced motion: lifts become fades, nothing moves.
 */

/** The Pitch symbol in its 100-unit design box: three equal bars, each a step higher (p.15). */
export const PITCH = {
  box: 100,
  barWidth: 22,
  barHeight: 58,
  /** Left edge and top of each bar, left to right. */
  bars: [
    { x: 9, y: 35 },
    { x: 39, y: 21 },
    { x: 69, y: 7 },
  ],
  /** Tight visual bounds inside the box (what the splash image shows). */
  bounds: { x: 9, y: 7, width: 82, height: 86 },
} as const;

/** The outlined wordmark (design/rivet/kit/logo/rivet-wordmark-*.svg): never retyped. */
export const WORDMARK = {
  viewBox: '8.97 -28.78 332.06 130.52',
  width: 332.06,
  height: 130.52,
  /** Cap height in viewBox units; the i's bar rises above it. */
  cap: 100,
  /** Where the cap line sits from the top of the viewBox. */
  capTop: 28.78,
} as const;

export const LOADING = {
  /** One full cycle. */
  period: 1200,
  /** Each bar starts this much later than the one before it. */
  stagger: 120,
  /** The lift, as a share of the symbol's box (8 px at 100 px). */
  lift: 0.08,
  /** The soft catch below the line after the lift. */
  catch: 0.015,
} as const;

/**
 * Launch on every open, choreographed in layers so the Glow never washes pink over the app: the bars
 * lift once in turn, the mark lifts away and fades first, the Night ground follows, and the screen
 * underneath arrives with the brand's 8 pt rise.
 */
export const LAUNCH = {
  liftDuration: 180,
  stagger: 50,
  markDelay: 90,
  markFade: 140,
  /** How far the mark drifts up as it leaves. */
  markLift: 6,
  groundDelay: 190,
  groundFade: 290,
} as const;

/** The screen underneath arrives: it rises this far and settles (p.18, "the lift"). */
export const ARRIVAL = { lift: 8, duration: 360 } as const;

/** First run, the only time the name appears: the symbol rises into the stacked lockup. */
export const FIRST_RUN = {
  /** The bars step up in turn, larger than the everyday lift: this one is a welcome. */
  stepLift: 0.14,
  stepDuration: 260,
  stepStagger: 90,
  /** The symbol glides up to make room for the name. */
  glideDelay: 120,
  glideDuration: 560,
  /** The name lifts in under it. */
  nameDelay: 440,
  nameDuration: 440,
  nameLift: 10,
  /** Hold the lockup, then the mark lifts away and the ground follows. */
  hold: 640,
  markFade: 200,
  exitLift: 8,
  groundDelay: 110,
  groundFade: 300,
} as const;

export const REDUCED = {
  /** Every lift becomes a crossfade of this length. */
  crossfade: 120,
  /** The loading bars breathe instead of moving. */
  breathe: 1600,
  dim: 0.45,
} as const;

function easeOutCubic(t: number) {
  'worklet';
  const u = 1 - t;
  return 1 - u * u * u;
}

function easeInOutSine(t: number) {
  'worklet';
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

/** Wrap any time into [0, period). */
function phase(time: number, period: number) {
  'worklet';
  const p = time % period;
  return p < 0 ? p + period : p;
}

/**
 * Vertical offset of bar `index` at `time` ms into the loading loop, as a share of the box
 * (negative is up). Keyframes from design/rivet/motion/rivet-loading.svg: lift to -8 % by 20 % of
 * the cycle, catch at +1.5 % by 38 %, settle to rest by 60 %, then wait for the next bar.
 */
export function loadingLift(time: number, index: number) {
  'worklet';
  const p = phase(time - index * LOADING.stagger, LOADING.period) / LOADING.period;
  if (p < 0.2) return 0 - LOADING.lift * easeOutCubic(p / 0.2);
  if (p < 0.38) {
    const t = easeInOutSine((p - 0.2) / 0.18);
    return -LOADING.lift + (LOADING.lift + LOADING.catch) * t;
  }
  if (p < 0.6) return LOADING.catch * (1 - easeOutCubic((p - 0.38) / 0.22));
  return 0;
}

/** Reduced motion: each bar's opacity breathing in turn instead of lifting. */
export function loadingBreath(time: number, index: number) {
  'worklet';
  const p = phase(time - index * (REDUCED.breathe / 6), REDUCED.breathe) / REDUCED.breathe;
  const wave = (1 - Math.cos(2 * Math.PI * p)) / 2;
  return 1 - (1 - REDUCED.dim) * wave;
}

function rise(time: number, start: number, duration: number) {
  'worklet';
  const t = (time - start) / duration;
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return easeOutCubic(t);
}

/** One lift and a soft return of bar `index` (share of the box), `time` ms after the gesture starts. */
function stepUp(time: number, index: number, lift: number, duration: number, stagger: number) {
  'worklet';
  const t = time - index * stagger;
  if (t <= 0) return 0;
  if (t < duration) return 0 - lift * easeOutCubic(t / duration);
  const back = (t - duration) / duration;
  if (back < 1) return 0 - lift * (1 - easeInOutSine(back));
  return 0;
}

/** Launch: bar `index`'s offset (share of the box) at `time` ms: one lift and a soft return. */
export function launchLift(time: number, index: number) {
  'worklet';
  return stepUp(time, index, LOADING.lift, LAUNCH.liftDuration, LAUNCH.stagger);
}

/** Launch: the mark's opacity and upward drift (px) as it leaves, before the ground. */
export function launchMark(time: number) {
  'worklet';
  const p = rise(time, LAUNCH.markDelay, LAUNCH.markFade);
  return { opacity: 1 - p, lift: LAUNCH.markLift * p };
}

/** Launch: opacity of the Night ground. */
export function launchGround(time: number) {
  'worklet';
  return 1 - rise(time, LAUNCH.groundDelay, LAUNCH.groundFade);
}

/** Total length of the launch transition, after which the overlay unmounts. */
export const LAUNCH_TOTAL = LAUNCH.groundDelay + LAUNCH.groundFade;

/** First run: the moment the exit begins and the total length. */
export const FIRST_RUN_EXIT = FIRST_RUN.nameDelay + FIRST_RUN.nameDuration + FIRST_RUN.hold;
export const FIRST_RUN_TOTAL = FIRST_RUN_EXIT + FIRST_RUN.groundDelay + FIRST_RUN.groundFade;

/** First run: bar `index` stepping up in turn as the symbol starts to glide. */
export function firstRunStep(time: number, index: number) {
  'worklet';
  return stepUp(
    time - FIRST_RUN.glideDelay,
    index,
    FIRST_RUN.stepLift,
    FIRST_RUN.stepDuration,
    FIRST_RUN.stepStagger
  );
}

/** First run: how far the symbol has glided (0 to 1), the name's entrance and the exit. */
export function firstRunGlide(time: number) {
  'worklet';
  return rise(time, FIRST_RUN.glideDelay, FIRST_RUN.glideDuration);
}

export function firstRunName(time: number) {
  'worklet';
  const p = rise(time, FIRST_RUN.nameDelay, FIRST_RUN.nameDuration);
  return { opacity: p, offset: FIRST_RUN.nameLift * (1 - p) };
}

export function firstRunMark(time: number) {
  'worklet';
  const p = rise(time, FIRST_RUN_EXIT, FIRST_RUN.markFade);
  return { opacity: 1 - p, lift: FIRST_RUN.exitLift * p };
}

export function firstRunGround(time: number) {
  'worklet';
  return 1 - rise(time, FIRST_RUN_EXIT + FIRST_RUN.groundDelay, FIRST_RUN.groundFade);
}

/** The screen underneath: offset (px) as it arrives, starting when the ground starts to fade. */
export function arrival(time: number, start: number) {
  'worklet';
  return ARRIVAL.lift * (1 - rise(time, start, ARRIVAL.duration));
}

/** Layout of the stacked lockup for a symbol whose tight width is `symbolWidth` px. */
export function stackedLockup(symbolWidth: number) {
  const k = symbolWidth / PITCH.bounds.width;
  const symbolHeight = PITCH.bounds.height * k;
  // Brand construction (design/rivet/tools/brand.py `stacked`): the box is 2.4 cap heights.
  const cap = (PITCH.box * k) / 2.4;
  const wordScale = cap / WORDMARK.cap;
  const wordWidth = WORDMARK.width * wordScale;
  const wordHeight = WORDMARK.height * wordScale;
  // Cap line sits 0.55 cap below the symbol's foot.
  const gap = 0.55 * cap - WORDMARK.capTop * wordScale;
  const total = symbolHeight + gap + wordHeight;
  return { k, symbolHeight, cap, wordScale, wordWidth, wordHeight, gap, total };
}
