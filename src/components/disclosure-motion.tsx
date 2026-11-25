import type { PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import Animated, { FadeOut, useReducedMotion } from 'react-native-reanimated';

import { liftIn, REDUCED_FADE_MS } from '@/lib/motion';

const FADE_OUT = FadeOut.duration(REDUCED_FADE_MS);

/** Controls and step cards the user just added or opened: they lift in, and fade on close. */
export function EditorReveal({ children, className }: PropsWithChildren<{ className?: string }>) {
  const reduced = useReducedMotion();
  return (
    <Animated.View
      // Spring layout animations collapse the view in a browser; there it fades in.
      entering={liftIn(0, reduced || Platform.OS === 'web')}
      exiting={FADE_OUT}
      className={className}>
      {children}
    </Animated.View>
  );
}
