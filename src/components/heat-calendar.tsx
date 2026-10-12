import { useMemo, useRef } from 'react';
import { View, type GestureResponderEvent } from 'react-native';

import { Text } from '@/components/ui/text';
import { formatShortDate, isSameDay } from '@/lib/dates';
import { HEAT_STEPS, heatGrid, monthLabels, type TrainedSpan } from '@/lib/moonboard/heat';
import { useAppTheme } from '@/lib/use-theme';
import { cn } from '@/lib/utils';

const CELL = 16;
const GAP = 4;
const PITCH = CELL + GAP;
const LABELS = 26;

type HeatCalendarProps = {
  spans: TrainedSpan[];
  today?: Date;
  /** The pinned day; the others dim. */
  selected?: Date | null;
  onSelect: (day: Date | null) => void;
};

/**
 * The last sixteen weeks as columns of small squares: one hue, darker for more training.
 * The squares are small, so a finger can slide across the grid and the pin follows it.
 */
export function HeatCalendar({ spans, today, selected, onSelect }: HeatCalendarProps) {
  const { theme } = useAppTheme();
  const now = useMemo(() => today ?? new Date(), [today]);
  const grid = useMemo(() => heatGrid(spans, now), [spans, now]);
  const months = useMemo(() => monthLabels(grid), [grid]);
  const startedOn = useRef<Date | null>(null);
  const moved = useRef(false);
  const wasPinned = useRef(false);

  const dayAt = (event: GestureResponderEvent) => {
    const week = Math.floor(event.nativeEvent.locationX / PITCH);
    const day = Math.floor(event.nativeEvent.locationY / PITCH);
    const found = grid[week]?.[day];
    return found && !found.future ? found.date : null;
  };
  const first = grid[0][0].date;
  const range = `${formatShortDate(first)} – ${formatShortDate(now)}`;

  return (
    <View className="gap-2 self-center" style={{ width: LABELS + grid.length * PITCH - GAP }}>
      <View className="h-3" style={{ marginLeft: LABELS }}>
        {months.map((month) => (
          <Text
            key={month.week}
            className="absolute text-[10px] leading-3 text-muted-foreground font-medium"
            maxFontSizeMultiplier={1.2}
            style={{ left: month.week * PITCH }}>
            {month.label}
          </Text>
        ))}
      </View>
      <View className="flex-row">
        <View style={{ width: LABELS }}>
          {['M', '', 'W', '', 'F', '', ''].map((letter, index) => (
            <Text
              key={index}
              className="text-[10px] text-muted-foreground font-medium"
              maxFontSizeMultiplier={1.2}
              style={{ height: PITCH, lineHeight: CELL }}>
              {letter}
            </Text>
          ))}
        </View>
        <View
          accessibilityLabel="Training in the last sixteen weeks. Slide to pick a day."
          className="flex-row"
          style={{ gap: GAP }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(event) => {
            const day = dayAt(event);
            startedOn.current = day;
            moved.current = false;
            wasPinned.current = !!day && !!selected && isSameDay(day, selected);
            if (day && !wasPinned.current) onSelect(day);
          }}
          onResponderMove={(event) => {
            const day = dayAt(event);
            if (!day) return;
            if (startedOn.current && !isSameDay(day, startedOn.current)) moved.current = true;
            if (!(selected && isSameDay(day, selected))) onSelect(day);
          }}
          onResponderRelease={() => {
            // A plain tap on the pinned day lets it go.
            if (wasPinned.current && !moved.current) onSelect(null);
          }}>
          {grid.map((week, index) => (
            <View key={index} pointerEvents="none" style={{ gap: GAP }}>
              {week.map((day) => {
                const pinned = !!selected && isSameDay(day.date, selected);
                return (
                  <View
                    key={day.date.getTime()}
                    className={cn('rounded', pinned && 'border-[1.5px] border-foreground')}
                    style={{
                      width: CELL,
                      height: CELL,
                      backgroundColor: day.level ? theme.chart1 : theme.foreground,
                      opacity: day.future
                        ? 0
                        : (day.level ? HEAT_STEPS[day.level] : 0.06) *
                          (selected && !pinned && day.level ? 0.3 : 1),
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-[10px] text-muted-foreground font-medium" maxFontSizeMultiplier={1.2}>
          {range}
        </Text>
        <View className="flex-row items-center gap-0.5">
          <Text
            className="mr-1 text-[10px] text-muted-foreground font-medium"
            maxFontSizeMultiplier={1.2}>
            less
          </Text>
          {HEAT_STEPS.map((step, level) => (
            <View
              key={level}
              className="size-3 rounded-[3px]"
              style={{
                backgroundColor: level ? theme.chart1 : theme.foreground,
                opacity: step || 0.06,
              }}
            />
          ))}
          <Text
            className="ml-1 text-[10px] text-muted-foreground font-medium"
            maxFontSizeMultiplier={1.2}>
            more
          </Text>
        </View>
      </View>
    </View>
  );
}
