import { useEffect, useState, type ReactNode } from 'react';
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
  /** `dot` is a filled colour dot before the label; `leading` anything else drawn there. */
  options: { value: T; label: string; dot?: string; leading?: ReactNode }[];
  /** Null shows no choice yet (how a session felt is never preselected). */
  value: T | null;
  onChange: (value: T) => void;
  /** Track height: 48 by default, 56 or 64 for choices made mid-session. */
  height?: 48 | 56 | 64;
  className?: string;
};

const PAD = 4;

/**
 * Exclusive choices on one Raised pill; a white tile (Night 400 in dark) slides to the chosen
 * one on the Rivet spring (design/rivet/app/ui.py `segmented`).
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  height = 48,
  className,
}: SegmentedProps<T>) {
  const [width, setWidth] = useState(0);
  const index = options.findIndex((option) => option.value === value);
  const segment = width ? (width - PAD * 2) / options.length : 0;
  const position = useSharedValue(Math.max(0, index));
  const shown = useSharedValue(index >= 0 ? 1 : 0);
  useEffect(() => {
    const spring = { ...SPRING_SETTLE, reduceMotion: ReduceMotion.System };
    if (index >= 0) {
      // From no choice the tile appears where it lands instead of sliding from the first slot.
      if (shown.get() === 0) position.set(index);
      else position.set(withSpring(index, spring));
    }
    shown.set(withSpring(index >= 0 ? 1 : 0, spring));
  }, [index, position, shown]);
  const tile = useAnimatedStyle(() => ({
    opacity: shown.get(),
    transform: [{ translateX: position.get() * segment }],
  }));
  const inner = height - PAD * 2;

  return (
    <View
      accessibilityRole="radiogroup"
      className={cn('flex-row rounded-full bg-raised', className)}
      style={{ padding: PAD, height }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {segment ? (
        <Animated.View
          pointerEvents="none"
          className="absolute rounded-full bg-segment-tile"
          style={[
            {
              left: PAD,
              top: PAD,
              width: segment,
              height: inner,
              shadowColor: '#0B0F1C',
              shadowOpacity: 0.1,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            },
            tile,
          ]}
        />
      ) : null}
      {options.map((option) => {
        const on = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(option.value)}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-full"
            style={{ height: inner }}>
            {option.leading}
            {option.dot ? (
              <View className="size-2.5 rounded-full" style={{ backgroundColor: option.dot }} />
            ) : null}
            <Text
              className={cn(
                'type-row',
                height >= 60 && 'text-[18px] leading-[23px]',
                on ? 'text-text' : 'text-muted2'
              )}
              numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
