import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  ReduceMotion,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { SPRING_SETTLE } from '@/lib/motion';
import { useAppTheme } from '@/lib/use-theme';

const TRACK = { width: 56, height: 34, pad: 3 };
const KNOB = TRACK.height - TRACK.pad * 2;
const TRAVEL = TRACK.width - KNOB - TRACK.pad * 2;

/**
 * The knob of a switch row (56 × 34, Ink when on). The row itself is the control; this only
 * shows its state and slides to it on the Rivet spring.
 */
export function Switch({ checked }: { checked: boolean }) {
  const { theme } = useAppTheme();
  const on = useSharedValue(checked ? 1 : 0);
  useEffect(() => {
    on.set(withSpring(checked ? 1 : 0, { ...SPRING_SETTLE, reduceMotion: ReduceMotion.System }));
  }, [checked, on]);
  const track = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(on.get(), [0, 1], [theme.track, theme.action]),
  }));
  const knob = useAnimatedStyle(() => ({
    transform: [{ translateX: on.get() * TRAVEL }],
    backgroundColor: interpolateColor(on.get(), [0, 1], ['#FFFFFF', theme.onAction]),
  }));

  return (
    <View pointerEvents="none">
      <Animated.View
        className="rounded-full"
        style={[{ width: TRACK.width, height: TRACK.height, padding: TRACK.pad }, track]}>
        <Animated.View
          className="rounded-full"
          style={[
            {
              width: KNOB,
              height: KNOB,
              shadowColor: '#0B0F1C',
              shadowOpacity: checked ? 0 : 0.18,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 },
              elevation: checked ? 0 : 2,
            },
            knob,
          ]}
        />
      </Animated.View>
    </View>
  );
}
