import { Easing } from 'react-native-reanimated';

/** Strong ease-out for anything entering, leaving or answering a touch. */
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * Rivet's one spring (brand book p.42, "lift, then settle"): stiffness 380, damping 32. Cards,
 * sheets and toasts rise 8 pt on it; switches, segmented tiles and chips settle on it.
 */
export const SPRING_SETTLE = { stiffness: 380, damping: 32, mass: 1 };

/** What arrives rises this far before it settles. */
export const LIFT = 8;

/** Under reduced motion every lift becomes a crossfade of this length. */
export const REDUCED_FADE_MS = 120;

/** Controls (switch, segmented tile, chip) change state in about this long. */
export const QUICK_MS = 160;

/** A press dips the control to this scale. */
export const PRESS_SCALE = 0.97;
