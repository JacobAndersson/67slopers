import type { PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, useReducedMotion } from 'react-native-reanimated';

import { LIFT, REDUCED_FADE_MS, SPRING_SETTLE } from '@/lib/motion';

/** What opens rises 8 pt and settles on the Rivet spring (brand book p.42). */
const LIFT_IN = FadeInDown.springify()
  .stiffness(SPRING_SETTLE.stiffness)
  .damping(SPRING_SETTLE.damping)
  .mass(SPRING_SETTLE.mass)
  .withInitialValues({ opacity: 0, transform: [{ translateY: LIFT }] });
/** Under reduced motion every lift becomes a short crossfade. */
const FADE_IN = FadeIn.duration(REDUCED_FADE_MS);
const FADE_OUT = FadeOut.duration(REDUCED_FADE_MS);

/** Controls and step cards the user just added or opened: they lift in, and fade on close. */
export function EditorReveal({ children, className }: PropsWithChildren<{ className?: string }>) {
  const reduced = useReducedMotion();
  return (
    <Animated.View
      // Spring layout animations collapse the view in a browser; there it fades in.
      entering={reduced || Platform.OS === 'web' ? FADE_IN : LIFT_IN}
      exiting={FADE_OUT}
      className={className}>
      {children}
    </Animated.View>
  );
}
