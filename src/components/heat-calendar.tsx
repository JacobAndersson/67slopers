import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { formatShortDate, isSameDay } from '@/lib/dates';
import { heatGrid, monthLabels, type TrainedSpan } from '@/lib/moonboard/heat';
import { useAppTheme } from '@/lib/use-theme';

const GAP = 5;
const LABELS = 22;
const DAY_LETTERS = ['M', '', 'W', '', 'F', '', 'S'];

type HeatCalendarProps = {
  spans: TrainedSpan[];
  today?: Date;
  /** The pinned day; the other trained days dim. */
  selected?: Date | null;
  onSelect: (day: Date | null) => void;
  /** Nothing to pin yet: the grid is a picture, not a control. */
  disabled?: boolean;
};

/**
 * Eight weeks as Monday-first columns (design/rivet/app/screens_log.py `heat`): the Glacier scale
 * for minutes trained, an outline for a day without, a ring around the pinned day. Labelled in
 * words, no key. A finger can slide across the grid and the pin follows it.
 */
export function HeatCalendar({ spans, today, selected, onSelect, disabled }: HeatCalendarProps) {
  const { theme, dark } = useAppTheme();
  const now = useMemo(() => today ?? new Date(), [today]);
  const grid = useMemo(() => heatGrid(spans, now), [spans, now]);
  const months = useMemo(() => {
    const labels = monthLabels(grid);
    return labels[0]?.week === 0
      ? labels
      : [
          { week: 0, label: grid[0][0].date.toLocaleDateString(undefined, { month: 'short' }) },
          ...labels,
        ];
  }, [grid]);
  const [width, setWidth] = useState(0);
  const cell = width ? (width - LABELS - GAP * (grid.length - 1)) / grid.length : 0;
  const pitch = cell + GAP;
  const steps = [theme.heat2, theme.heat2, theme.heat3, theme.heat4, theme.heat5, theme.heat6];

  const dayAt = (x: number, y: number) => {
    const found = grid[Math.floor(x / pitch)]?.[Math.floor(y / pitch)];
    return found && !found.future ? found.date : null;
  };
  // A tap pins a day, or lets the pinned one go; a sideways slide scrubs through days. Up and
  // down belongs to the page, so the Log still scrolls from a finger on the grid.
  const tapAt = (x: number, y: number) => {
    const day = dayAt(x, y);
    if (!day) return;
    onSelect(selected && isSameDay(day, selected) ? null : day);
  };
  const slideTo = (x: number, y: number) => {
    const day = dayAt(x, y);
    if (day && !(selected && isSameDay(day, selected))) onSelect(day);
  };
  const tap = Gesture.Tap()
    .enabled(!disabled)
    .onEnd((e) => runOnJS(tapAt)(e.x, e.y));
  const slide = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-8, 8])
    .failOffsetY([-12, 12])
    .onStart((e) => runOnJS(slideTo)(e.x, e.y))
    .onChange((e) => runOnJS(slideTo)(e.x, e.y));
  const gesture = Gesture.Exclusive(slide, tap);

  // Screen readers move the pin a day at a time and hear what was trained on it.
  const days = grid.flat().filter((d) => !d.future);
  const pinnedIndex = selected ? days.findIndex((d) => isSameDay(d.date, selected)) : -1;
  const spoken = (index: number) => {
    const day = days[index];
    if (!day) return 'No day picked';
    const date = formatShortDate(day.date);
    return day.minutes ? `${date}, ${day.minutes} minutes` : `${date}, rest day`;
  };
  const step = (by: 1 | -1) => {
    const next =
      pinnedIndex < 0 ? days.length - 1 : Math.max(0, Math.min(days.length - 1, pinnedIndex + by));
    onSelect(days[next].date);
  };

  const first = grid[0][0].date;
  const range = `${formatShortDate(first)} – ${formatShortDate(now)}`;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View className="h-4" style={{ marginLeft: LABELS }}>
        {cell
          ? months.map((month) => (
              <Text
                key={month.week}
                className="type-caption absolute text-[11px] leading-[14px] text-muted"
                maxFontSizeMultiplier={1.2}
                style={{ left: month.week * pitch }}>
                {month.label}
              </Text>
            ))
          : null}
      </View>
      <View className="mt-1.5 flex-row">
        <View style={{ width: LABELS }}>
          {DAY_LETTERS.map((letter, index) => (
            <Text
              key={index}
              className="type-caption text-[11px] text-muted"
              maxFontSizeMultiplier={1.2}
              style={{ height: pitch, lineHeight: cell }}>
              {letter}
            </Text>
          ))}
        </View>
        <GestureDetector gesture={gesture}>
          <View
            accessible={!disabled}
            accessibilityRole={disabled ? undefined : 'adjustable'}
            accessibilityLabel="Training, last eight weeks"
            accessibilityHint="Swipe up or down to move through the days"
            accessibilityValue={{ text: spoken(pinnedIndex) }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
            className="flex-row"
            style={{ gap: GAP }}>
            {cell
              ? grid.map((week, index) => (
                  <View key={index} pointerEvents="none" style={{ gap: GAP }}>
                    {week.map((day) => {
                      const pinned = !!selected && isSameDay(day.date, selected);
                      const radius = cell * 0.3;
                      return (
                        <View key={day.date.getTime()} style={{ width: cell, height: cell }}>
                          {day.future ? null : day.level ? (
                            <View
                              style={{
                                flex: 1,
                                borderRadius: radius,
                                backgroundColor: steps[day.level],
                                opacity: selected && !pinned ? 0.35 : 1,
                              }}
                            />
                          ) : (
                            <View
                              style={{
                                flex: 1,
                                margin: 0.5,
                                borderRadius: radius,
                                borderWidth: 1,
                                borderColor: theme.line2,
                              }}
                            />
                          )}
                          {pinned ? (
                            <View
                              className="absolute border-2 border-text"
                              style={{ inset: -3, borderRadius: cell * 0.36 }}
                            />
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                ))
              : null}
          </View>
        </GestureDetector>
      </View>
      <Text className="type-caption mt-1.5 text-muted" maxFontSizeMultiplier={1.4}>
        {range}
        {'\n'}
        {dark ? 'Brighter days: more time training.' : 'Darker days: more time training.'}
      </Text>
    </View>
  );
}
