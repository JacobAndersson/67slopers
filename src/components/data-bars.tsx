import { useState, type ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  css,
  useReducedMotion,
  type CSSAnimationKeyframes,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { CSS_EASE_OUT, liftIn, REDUCED_FADE_MS } from '@/lib/motion';
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
          entering={stagger === undefined ? undefined : liftIn(stagger + i * 30)}
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

/** How long a bar takes to grow in, and the spread of a timeline's left-to-right reveal. */
const GROW_MS = 280;
const SWEEP_MS = 200;
const FADE = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });

/**
 * A CSS animation that plays once, on mount, after `delay` ms. Inline keyframes are looked up by
 * content, so a re-render with the same ones does not restart it.
 */
function arrive(
  name: ReturnType<typeof css.keyframes> | CSSAnimationKeyframes<ViewStyle>,
  duration: number,
  delay = 0
) {
  return {
    animationName: name,
    animationDuration: duration,
    animationDelay: delay,
    animationTimingFunction: CSS_EASE_OUT,
    animationFillMode: 'backwards' as const,
  };
}

/**
 * A plain rounded progress bar on the track colour. With `grow` the fill grows out from the left
 * when it mounts, `delayMs` after its screen; the fill is the track's only child, so its width can
 * move without laying out anything else.
 */
export function Progress({
  value,
  height = 10,
  grow,
  delayMs = 0,
  className,
}: {
  value: number;
  height?: number;
  grow?: boolean;
  delayMs?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const fraction = Math.max(0, Math.min(1, value));
  const width = `${fraction * 100}%` as const;
  const motion = !grow
    ? undefined
    : reduced
      ? arrive(FADE, REDUCED_FADE_MS, delayMs)
      : arrive({ from: { width: 0 }, to: { width } }, GROW_MS, delayMs);
  return (
    <View className={cn('overflow-hidden rounded-full bg-track', className)} style={{ height }}>
      {fraction > 0 ? (
        <Animated.View
          className="rounded-full bg-text"
          style={[{ height, width, minWidth: height }, motion]}
        />
      ) : null}
    </View>
  );
}

/**
 * A workout's shape as rounded bars, time left to right (brand book p.40): hangs Night (Snow in
 * dark), long rests Glacier, Recover Glacier 200, Get ready the bar colour. With `grow` the bars
 * fade in from left to right when they first show.
 */
export function WorkoutTimeline({
  pieces,
  height = 10,
  gap = 3,
  grow,
  className,
}: {
  pieces: ShapePiece[];
  height?: number;
  gap?: number;
  grow?: boolean;
  className?: string;
}) {
  const { theme } = useAppTheme();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const widths = width ? shapeWidths(pieces, width, gap, height * 2.5) : [];
  // Where each bar starts, for the reveal.
  const starts = widths.map((_, i) => widths.slice(0, i).reduce((x, w) => x + w + gap, 0));
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
        <Animated.View
          key={i}
          className="rounded-full"
          style={[
            { width: w, height, backgroundColor: colour[pieces[i].kind] },
            grow &&
              arrive(
                FADE,
                reduced ? REDUCED_FADE_MS : GROW_MS,
                reduced ? 0 : (starts[i] / width) * SWEEP_MS
              ),
          ]}
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
