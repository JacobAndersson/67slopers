import { View } from 'react-native';

import { Text } from '@/components/ui/text';
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

/**
 * This week as plain rounded bars, labelled on the data (design/rivet/app/ui.py `week_bars`):
 * minutes above each bar, Night for hangs, Dusk for the board, today's letter heavier with a dot.
 */
export function WeekBars({ days, className }: { days: WeekDay[]; className?: string }) {
  const most = Math.max(1, ...days.map((d) => d.minutes));
  return (
    <View className={cn('flex-row', className)}>
      {days.map((day, i) => {
        const height = day.minutes ? 18 + ((HEIGHT - 40) * day.minutes) / most : 10;
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
                <Text className="type-caption mb-1.5" numberOfLines={1} maxFontSizeMultiplier={1.4}>
                  {day.minutes} min
                </Text>
              ) : null}
              <View
                className={cn(
                  'w-[34px] rounded-full',
                  !day.minutes ? 'bg-bar' : day.kind === 'board' ? 'bg-board' : 'bg-text'
                )}
                style={{ height }}
              />
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
