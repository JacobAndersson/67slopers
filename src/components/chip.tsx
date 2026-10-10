import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { Pressable, View } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

const EASE = cubicBezier(0.23, 1, 0.32, 1);

type ChipProps = {
  label: string;
  selected?: boolean;
  icon?: PhosphorIcon;
  /** A coloured status dot before the label. */
  dotClassName?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** A small pill: a filter that is on or off, or a status that can be tapped. */
export function Chip({
  label,
  selected,
  icon,
  dotClassName,
  onPress,
  accessibilityLabel,
}: ChipProps) {
  const reduced = useReducedMotion();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      hitSlop={6}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={selected === undefined ? undefined : { selected }}
      className="h-8 flex-row items-center gap-1.5 rounded-full border border-border bg-card px-3 active:opacity-70">
      {/* The filled state fades over the plain one, so turning a filter on or off is seen. */}
      <Animated.View
        pointerEvents="none"
        className="absolute -inset-px rounded-full bg-primary"
        style={{
          opacity: selected ? 1 : 0,
          transitionProperty: 'opacity',
          transitionDuration: reduced ? 0 : 150,
          transitionTimingFunction: EASE,
        }}
      />
      {dotClassName ? <View className={cn('size-2 rounded-full', dotClassName)} /> : null}
      {icon ? (
        <Icon as={icon} size={16} className={selected ? 'text-primary-foreground' : undefined} />
      ) : null}
      <Text className={cn('text-sm font-medium', selected && 'text-primary-foreground')}>
        {label}
      </Text>
    </Pressable>
  );
}
