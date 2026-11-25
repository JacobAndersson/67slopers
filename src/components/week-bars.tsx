import { View } from 'react-native';
import Animated, { css, useReducedMotion } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { CSS_EASE_OUT, REDUCED_FADE_MS } from '@/lib/motion';
import { cn } from '@/lib/utils';

export type WeekDay = {
  /** One letter: M T W T F S S. */
  label: string;
  minutes: number;
  /** Dusk when the day was mostly on the board, Night for hangs. */
  kind: 'hang' | 'board' | null;
  today?: boolean;
  /** Spoken name, e.g. "Monday". */
  name: string;
};

const HEIGHT = 104;

/** Each bar rises out of its baseline this long after the one before, the minutes fading in after. */
const GROW_MS = 260;
const STAGGER_MS = 20;
const LABEL_AFTER_MS = 140;

// Every bar slides up out of a clip of its own size, so its rounded top keeps its shape.
const RISE = css.keyframes({
  from: { transform: [{ translateY: HEIGHT }] },
  to: { transform: [{ translateY: 0 }] },
});
const FADE = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });

/**
 * This week as plain rounded bars, labelled on the data (design/rivet/app/ui.py `week_bars`):
 * minutes above each bar, Night for hangs, Dusk for the board, today's letter heavier with a dot.
 * When they mount the bars grow from the baseline in turn, `delayMs` after the screen arrives;
 * reduced motion fades them in instead.
 */
export function WeekBars({
  days,
  delayMs = 0,
  className,
}: {
  days: WeekDay[];
  delayMs?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const most = Math.max(1, ...days.map((d) => d.minutes));
  const arrive = (delay: number, grow: boolean) => ({
    animationName: grow && !reduced ? RISE : FADE,
    animationDuration: reduced ? REDUCED_FADE_MS : GROW_MS,
    animationDelay: delay,
    animationTimingFunction: CSS_EASE_OUT,
    animationFillMode: 'backwards' as const,
  });
  return (
    <View className={cn('flex-row', className)}>
      {days.map((day, i) => {
        const height = day.minutes ? 18 + ((HEIGHT - 40) * day.minutes) / most : 10;
        const delay = delayMs + i * STAGGER_MS;
        return (
          <View
            key={i}
            className="flex-1 items-center"
            accessible
            accessibilityLabel={`${day.name}${day.today ? ', today' : ''}: ${
              day.minutes
                ? `${day.minutes} minutes${day.kind === 'board' ? ' on the board' : ''}`
                : 'rest'
            }`}>
            <View className="w-full items-center justify-end" style={{ height: HEIGHT }}>
              {day.minutes ? (
                <Animated.View style={arrive(delay + LABEL_AFTER_MS, false)}>
                  <Text
                    className="type-caption mb-1.5"
                    numberOfLines={1}
                    maxFontSizeMultiplier={1.4}>
                    {day.minutes} min
                  </Text>
                </Animated.View>
              ) : null}
              <View className="w-[34px] overflow-hidden rounded-full" style={{ height }}>
                <Animated.View
                  className={cn(
                    'flex-1 rounded-full',
                    !day.minutes ? 'bg-bar' : day.kind === 'board' ? 'bg-board' : 'bg-text'
                  )}
                  style={arrive(delay, true)}
                />
              </View>
            </View>
            <Text
              className={cn(
                'type-caption mt-2',
                day.today ? 'text-text font-black' : 'text-muted'
              )}>
              {day.label}
            </Text>
            <View
              className={cn('mt-1 size-1 rounded-full', day.today ? 'bg-text' : 'bg-transparent')}
            />
          </View>
        );
      })}
    </View>
  );
}
