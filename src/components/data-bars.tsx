import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { LIFT, SPRING_SETTLE } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useAppTheme } from '@/lib/use-theme';
import { shapeWidths, type ShapePiece } from '@/lib/workout-shape';

/**
 * Sets as a row of rounded bars: done in ink, the rest on the bar colour (design/rivet/app/ui.py
 * `set_bars`). Colours can be overridden for the timer, which draws on a session ground.
 */
export function SetBars({
  done,
  total,
  current,
  stagger,
  height = 10,
  gap = 8,
  color,
  track,
  className,
}: {
  done: number;
  total: number;
  /** The set under way, drawn in the done colour at 60%. */
  current?: number;
  /** Step the bars up one by one, 30 ms apart, starting after this many ms (the summary). */
  stagger?: number;
  height?: number;
  gap?: number;
  color?: string;
  track?: string;
  className?: string;
}) {
  return (
    <View
      className={cn('flex-row', className)}
      style={{ gap }}
      accessible
      accessibilityLabel={`${done} of ${total} sets`}>
      {Array.from({ length: Math.max(1, total) }, (_, i) => (
        <Animated.View
          key={i}
          entering={
            stagger === undefined
              ? undefined
              : FadeInDown.springify()
                  .stiffness(SPRING_SETTLE.stiffness)
                  .damping(SPRING_SETTLE.damping)
                  .delay(stagger + i * 30)
                  .withInitialValues({ transform: [{ translateY: LIFT }] })
                  .reduceMotion(ReduceMotion.System)
          }
          className={cn(
            'flex-1 rounded-full',
            i < done || i === current ? !color && 'bg-text' : !track && 'bg-bar'
          )}
          style={{
            height,
            opacity: i === current && i >= done ? 0.6 : 1,
            // Only when given: an undefined colour here would override the class on native.
            ...((i < done || i === current ? color : track)
              ? { backgroundColor: i < done || i === current ? color : track }
              : {}),
          }}
        />
      ))}
    </View>
  );
}

/** A plain rounded progress bar on the track colour. */
export function Progress({
  value,
  height = 10,
  className,
}: {
  value: number;
  height?: number;
  className?: string;
}) {
  const fraction = Math.max(0, Math.min(1, value));
  return (
    <View className={cn('overflow-hidden rounded-full bg-track', className)} style={{ height }}>
      {fraction > 0 ? (
        <View
          className="rounded-full bg-text"
          style={{ height, width: `${fraction * 100}%`, minWidth: height }}
        />
      ) : null}
    </View>
  );
}

/**
 * A workout's shape as rounded bars, time left to right (brand book p.40): hangs Night (Snow in
 * dark), long rests Glacier, Recover Glacier 200, Get ready the bar colour.
 */
export function WorkoutTimeline({
  pieces,
  height = 10,
  gap = 3,
  className,
}: {
  pieces: ShapePiece[];
  height?: number;
  gap?: number;
  className?: string;
}) {
  const { theme } = useAppTheme();
  const [width, setWidth] = useState(0);
  const widths = width ? shapeWidths(pieces, width, gap, height * 2.5) : [];
  const colour = {
    hang: theme.text,
    rest: theme.restRail,
    recover: theme.recoverRail,
    prep: theme.bar,
  } as const;
  return (
    <View
      className={cn('flex-row', className)}
      style={{ height, gap }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {widths.map((w, i) => (
        <View
          key={i}
          className="rounded-full"
          style={{ width: w, height, backgroundColor: colour[pieces[i].kind] }}
        />
      ))}
    </View>
  );
}

/** A caption over a big number. */
export function Stat({
  label,
  value,
  big,
  className,
}: {
  label: string;
  value: ReactNode;
  big?: boolean;
  className?: string;
}) {
  return (
    <View className={cn('gap-1', className)}>
      <Text className="type-caption text-muted">{label}</Text>
      <Text className={big ? 'type-bignum' : 'type-num'}>{value}</Text>
    </View>
  );
}
