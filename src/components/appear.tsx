import { useEffect, type ReactNode } from 'react';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { EASE_OUT } from '@/lib/motion';

type AppearProps = {
  children: ReactNode;
  /** Pixels it travels while fading in; negative comes down from above. */
  rise?: number;
  duration?: number;
};

/**
 * Fades its children in with a short rise, once, when it mounts. Transform and opacity only.
 * Give it a `key` to replay it for new content. Reduced motion keeps the fade and drops the
 * movement.
 */
export function Appear({ children, rise = 8, duration = 200 }: AppearProps) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withTiming(1, { duration, easing: EASE_OUT }));
  }, [progress, duration]);
  const style = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: reducedMotion ? 0 : (1 - progress.get()) * rise }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
