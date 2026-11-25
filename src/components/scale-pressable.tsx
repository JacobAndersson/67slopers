import { forwardRef } from 'react';
import { Platform, Pressable, View, type PressableProps } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { EASE_OUT, PRESS_DIM, PRESS_IN_MS, PRESS_OUT_MS, PRESS_SCALE } from '@/lib/motion';
import { cn } from '@/lib/utils';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * How a control answers a finger: `scale` dips it to PRESS_SCALE (buttons, chips, cards), `dim`
 * fades it to PRESS_DIM (rows inside a list or a grouped card, where a shrinking row would pull
 * away from its hairlines). Both ease in quickly and back a little slower. Reduced motion keeps
 * the dim, a fade, and drops the dip.
 */
export type PressFeedback = 'scale' | 'dim';

/** The pressed style and the handlers that drive it, for a Pressable that is not the moving view. */
export function usePressFeedback(feedback: PressFeedback = 'scale') {
  const reduced = useReducedMotion();
  const pressed = useSharedValue(0);
  const style = useAnimatedStyle(() =>
    feedback === 'scale'
      ? { transform: [{ scale: 1 - (1 - PRESS_SCALE) * pressed.get() }] }
      : { opacity: 1 - (1 - PRESS_DIM) * pressed.get() }
  );
  const still = feedback === 'scale' && reduced;
  const to = (value: number, duration: number) =>
    pressed.set(
      withTiming(value, { duration, easing: EASE_OUT, reduceMotion: ReduceMotion.Never })
    );
  return {
    style,
    onPressIn: () => {
      if (!still) to(1, PRESS_IN_MS);
    },
    onPressOut: () => to(0, PRESS_OUT_MS),
  };
}

/**
 * A Pressable that answers a press with `feedback` (brand: "Press: scale 0.97"). Opacity alone is
 * too quiet for a button; a list row dims. On web it is a plain Pressable that dims while pressed.
 */
export const ScalePressable = forwardRef<
  View,
  PressableProps & { className?: string; feedback?: PressFeedback }
>(function ScalePressable(
  { onPressIn, onPressOut, style, feedback = 'scale', className, ...props },
  ref
) {
  const press = usePressFeedback(feedback);
  if (Platform.OS === 'web') {
    return (
      <Pressable
        ref={ref}
        style={style}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        className={cn(className, 'active:opacity-80')}
        {...props}
      />
    );
  }
  return (
    <AnimatedPressable
      ref={ref}
      {...props}
      className={className}
      style={[style as never, press.style]}
      onPressIn={(e) => {
        press.onPressIn();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        press.onPressOut();
        onPressOut?.(e);
      }}
    />
  );
});
