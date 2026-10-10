import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { SPRING_SETTLE } from '@/lib/motion';
import { cn } from '@/lib/utils';

type SegmentedProps<T extends string> = {
  options: { value: T; label: string; dot?: string }[];
  value: T;
  onChange: (value: T) => void;
};

const PAD = 4;

/** A row of exclusive choices on one track; the tile slides to the one that is chosen. */
export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );
  const segment = width ? (width - PAD * 2) / options.length : 0;
  const position = useSharedValue(index);
  useEffect(() => {
    position.set(withSpring(index, { ...SPRING_SETTLE, reduceMotion: ReduceMotion.System }));
  }, [index, position]);
  const tile = useAnimatedStyle(() => ({
    transform: [{ translateX: position.get() * segment }],
  }));

  return (
    <View
      accessibilityRole="tablist"
      className="flex-row rounded-xl bg-muted/70"
      style={{ padding: PAD }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {segment ? (
        <Animated.View
          pointerEvents="none"
          className="absolute h-9 rounded-[9px] border border-border bg-card"
          style={[{ left: PAD, top: PAD, width: segment }, tile]}
        />
      ) : null}
      {options.map((option) => {
        const on = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(option.value)}
            className="h-9 flex-1 flex-row items-center justify-center gap-1.5">
            {option.dot ? (
              <View className="size-2 rounded-full" style={{ backgroundColor: option.dot }} />
            ) : null}
            <Text
              className={cn('text-sm', on ? 'font-semibold' : 'text-muted-foreground font-medium')}
              numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
