import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { SPRING_SETTLE } from '@/lib/motion';

const TRACK = { width: 46, height: 28, pad: 3 };
const THUMB = TRACK.height - TRACK.pad * 2;
const TRAVEL = TRACK.width - THUMB - TRACK.pad * 2;

/**
 * The knob of a switch row. The row itself is the control; this only shows its state, and
 * slides to it: the thumb travels on a spring and the track fills along the way.
 */
export function Switch({ checked }: { checked: boolean }) {
  const on = useSharedValue(checked ? 1 : 0);
  useEffect(() => {
    on.set(withSpring(checked ? 1 : 0, { ...SPRING_SETTLE, reduceMotion: ReduceMotion.System }));
  }, [checked, on]);
  const fill = useAnimatedStyle(() => ({ opacity: on.get() }));
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: on.get() * TRAVEL }] }));

  return (
    <View
      pointerEvents="none"
      className="rounded-full bg-border"
      style={{ width: TRACK.width, height: TRACK.height, padding: TRACK.pad }}>
      <Animated.View className="absolute inset-0 rounded-full bg-primary" style={fill} />
      <Animated.View
        className="rounded-full bg-card shadow-sm shadow-black/20"
        style={[{ width: THUMB, height: THUMB }, thumb]}
      />
    </View>
  );
}
