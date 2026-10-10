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
 * The box of a checkbox row. The row itself is the control; this only shows its state: the box
 * fills and the tick settles in, both on the same spring.
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
    <View className="size-6 items-center justify-center rounded-[7px] border border-input bg-card">
      <Animated.View className="absolute -inset-px rounded-[7px] bg-primary" style={fill} />
      <Animated.View style={tick}>
        <Icon as={CheckIcon} size={16} weight="bold" className="text-primary-foreground" />
      </Animated.View>
    </View>
  );
}
