import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { Pressable, View } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { QUICK_MS } from '@/lib/motion';
import { cn } from '@/lib/utils';

const EASE = cubicBezier(0.23, 1, 0.32, 1);

type ChipProps = {
  label: string;
  selected?: boolean;
  icon?: PhosphorIcon;
  /** A count in a small disc after the label. */
  count?: number;
  /** A coloured status dot before the label. */
  dotClassName?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
};

/**
 * A 48 pt pill: a filter or choice that is on (solid Ink) or off (hairline). Turning it on fades
 * the fill in (design/rivet/app/ui.py `chip`).
 */
export function Chip({
  label,
  selected,
  icon,
  count,
  dotClassName,
  onPress,
  accessibilityLabel,
}: ChipProps) {
  const reduced = useReducedMotion();
  const fg = selected ? 'text-on-action' : 'text-text';
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={selected === undefined ? undefined : { selected }}
      className="h-12 flex-row items-center gap-1 rounded-full border border-line-strong px-[18px] active:opacity-80">
      <Animated.View
        pointerEvents="none"
        className="absolute -inset-px rounded-full bg-action"
        style={{
          opacity: selected ? 1 : 0,
          transitionProperty: 'opacity',
          transitionDuration: reduced ? 0 : QUICK_MS,
          transitionTimingFunction: EASE,
        }}
      />
      {dotClassName ? <View className={cn('mr-1 size-2.5 rounded-full', dotClassName)} /> : null}
      {icon ? <Icon as={icon} size={18} className={cn('-ml-0.5 mr-1', fg)} /> : null}
      <Text className={cn('type-sub', fg)}>{label}</Text>
      {count !== undefined ? (
        <View
          className={cn(
            'ml-1.5 size-5 items-center justify-center rounded-full',
            selected ? 'bg-on-action' : 'bg-action'
          )}>
          <Text className={cn('type-caption text-xs', selected ? 'text-action' : 'text-on-action')}>
            {count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
