import { useEffect, useRef } from 'react';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/text';

/** Flip only the phase word when it changes; the countdown and its layout stay steady. */
export function TimerPhaseLabel({ label }: { label: string }) {
  const previous = useRef(label);
  const angle = useSharedValue(0);
  useEffect(() => {
    if (previous.current === label) return;
    previous.current = label;
    angle.set(-70);
    angle.set(
      withTiming(0, {
        duration: 180,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        reduceMotion: ReduceMotion.System,
      })
    );
  }, [label, angle]);
  const motion = useAnimatedStyle(() => ({
    opacity: 1 - Math.abs(angle.get()) / 90,
    transform: [{ perspective: 400 }, { rotateX: `${angle.get()}deg` }],
  }));
  return (
    <Animated.View style={motion}>
      <Text className="text-2xl uppercase tracking-wide font-semibold">{label}</Text>
    </Animated.View>
  );
}
