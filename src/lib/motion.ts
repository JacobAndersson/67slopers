import {
  cubicBezier,
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  ReduceMotion,
} from 'react-native-reanimated';

/** Strong ease-out for anything entering, leaving or answering a touch. */
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/** EASE_OUT for CSS transitions (`transitionTimingFunction`). */
export const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

/**
 * Rivet's one spring (brand book p.42, "lift, then settle"): stiffness 380, damping 32, mass 1.
 * Cards, sheets and toasts rise 8 pt on it; switches, segmented tiles and chips settle on it.
 * Pass the mass too: Reanimated's spring default is 4, which turns this into a slow wobble.
 */
export const SPRING_SETTLE = { stiffness: 380, damping: 32, mass: 1 };

/** What arrives rises this far before it settles. */
export const LIFT = 8;

/** Under reduced motion every lift becomes a crossfade of this length. */
export const REDUCED_FADE_MS = 120;

/**
 * `withTiming` config for that crossfade. It is the reduced-motion version, so it runs under the
 * system setting: Reanimated's default (`ReduceMotion.System`) would skip it and pop instead.
 */
export const REDUCED_FADE = {
  duration: REDUCED_FADE_MS,
  easing: EASE_OUT,
  reduceMotion: ReduceMotion.Never,
};

/**
 * Data arriving with a screen (greeting, figures, week, sessions) steps in this far apart. Four
 * steps and the spring stay under 400 ms, so a screen still feels instant.
 */
export const CASCADE_MS = 40;

/** Controls (switch, segmented tile, chip) change state in about this long. */
export const QUICK_MS = 160;

/** A press dips the control to this scale, quickly in and a little slower back. */
export const PRESS_SCALE = 0.97;
export const PRESS_IN_MS = 100;
export const PRESS_OUT_MS = 160;

/** Layout moves (a card taking another's place) glide on SPRING_SETTLE. */
export const LAYOUT_SETTLE = LinearTransition.springify()
  .stiffness(SPRING_SETTLE.stiffness)
  .damping(SPRING_SETTLE.damping)
  .mass(SPRING_SETTLE.mass);

/** An `entering` crossfade that runs with reduced motion on too (a fade is not motion). */
export function fadeIn(delayMs = 0) {
  return FadeIn.duration(REDUCED_FADE_MS).delay(delayMs).reduceMotion(ReduceMotion.Never);
}

/** The matching `exiting` crossfade. */
export function fadeOut(durationMs = REDUCED_FADE_MS) {
  return FadeOut.duration(durationMs).reduceMotion(ReduceMotion.Never);
}

/**
 * Rivet's arrival, as an `entering` animation: rise LIFT and settle on SPRING_SETTLE after
 * `delayMs`. With `reduced`, a REDUCED_FADE_MS crossfade after the same delay instead.
 */
export function liftIn(delayMs = 0, reduced = false) {
  if (reduced) return fadeIn(delayMs);
  return FadeInDown.springify()
    .stiffness(SPRING_SETTLE.stiffness)
    .damping(SPRING_SETTLE.damping)
    .mass(SPRING_SETTLE.mass)
    .delay(delayMs)
    .withInitialValues({ transform: [{ translateY: LIFT }] });
}
