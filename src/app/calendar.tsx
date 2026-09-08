import { Stack } from 'expo-router';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { CalendarGrid, CalendarStats } from '@/components/calendar';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { addMonths, dayKey, formatMonth, isSameMonth, monthGrid } from '@/lib/dates';
import { sessionsByDay } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/store';

/** The full month, with arrows to move between months. */
export default function CalendarScreen() {
  const sessions = useStore((s) => s.sessions);
  const [today] = useState(() => new Date());
  const [offset, setOffset] = useState(0);
  const month = useMemo(() => addMonths(today, offset), [today, offset]);
  const rows = useMemo(() => monthGrid(month), [month]);
  const byDay = useMemo(() => sessionsByDay(sessions), [sessions]);

  // The streak number sits on the latest active week, but only while looking at this month.
  const streakRow = useMemo(() => {
    if (!isSameMonth(month, today)) return null;
    const active = rows.map((week) => week.some((day) => byDay.has(dayKey(day))));
    const last = active.lastIndexOf(true);
    return last === -1 ? null : last;
  }, [rows, byDay, month, today]);

  return (
    <>
      <Stack.Screen options={{ title: 'Calendar' }} />
      <Screen>
        <CalendarStats sessions={sessions} today={today} />
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl tracking-tight font-semibold">{formatMonth(month)}</Text>
          <View className="flex-row gap-1">
            <Button
              variant="ghost"
              size="icon"
              accessibilityLabel="Previous month"
              onPress={() => setOffset((o) => o - 1)}>
              <Icon as={ChevronLeftIcon} className="size-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              accessibilityLabel="Next month"
              disabled={offset >= 0}
              onPress={() => setOffset((o) => Math.min(0, o + 1))}>
              <Icon as={ChevronRightIcon} className="size-6" />
            </Button>
          </View>
        </View>
        <CalendarGrid
          rows={rows}
          month={month}
          sessions={sessions}
          today={today}
          streakRow={streakRow}
        />
        {offset !== 0 ? (
          <Button variant="outline" className="self-start" onPress={() => setOffset(0)}>
            <Text>Back to this month</Text>
          </Button>
        ) : null}
      </Screen>
    </>
  );
}
