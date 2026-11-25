import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { SPRING_SETTLE } from '@/lib/motion';

/**
 * The box of a checkbox row (26 pt, radius 8, Ink when on). The row itself is the control; the
 * box fills and the tick settles in on the Rivet spring.
 */
export function CheckBox({ checked }: { checked: boolean }) {
  const on = useSharedValue(checked ? 1 : 0);
  useEffect(() => {
    on.set(withSpring(checked ? 1 : 0, { ...SPRING_SETTLE, reduceMotion: ReduceMotion.System }));
  }, [checked, on]);
  const fill = useAnimatedStyle(() => ({ opacity: on.get() }));
  const tick = useAnimatedStyle(() => ({
    opacity: on.get(),
    transform: [{ scale: 0.6 + 0.4 * on.get() }],
  }));

  return (
    <View className="size-[26px] items-center justify-center rounded-lg border-[1.5px] border-line-strong">
      <Animated.View className="absolute -inset-[1.5px] rounded-lg bg-action" style={fill} />
      <Animated.View style={tick}>
        <Icon as={CheckIcon} size={18} weight="bold" className="text-on-action" />
      </Animated.View>
    </View>
  );
}
