import { forwardRef } from 'react';
import { Platform, Pressable, View, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { EASE_OUT, PRESS_IN_MS, PRESS_OUT_MS, PRESS_SCALE } from '@/lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * A Pressable that dips to 0.97 under the finger (brand: "Press: scale 0.97"), for cards and
 * rows. Opacity alone is too quiet; reduced motion keeps it still.
 */
export const ScalePressable = forwardRef<View, PressableProps & { className?: string }>(
  function ScalePressable({ onPressIn, onPressOut, style, ...props }, ref) {
    const reduced = useReducedMotion();
    const scale = useSharedValue(1);
    const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
    if (Platform.OS === 'web') {
      return (
        <Pressable
          ref={ref}
          style={style}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          {...props}
        />
      );
    }
    return (
      <AnimatedPressable
        ref={ref}
        {...props}
        style={[style as never, pressStyle]}
        onPressIn={(e) => {
          if (!reduced)
            scale.set(withTiming(PRESS_SCALE, { duration: PRESS_IN_MS, easing: EASE_OUT }));
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          scale.set(withTiming(1, { duration: PRESS_OUT_MS, easing: EASE_OUT }));
          onPressOut?.(e);
        }}
      />
    );
  }
);
