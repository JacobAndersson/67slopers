import { Stack, useRouter } from 'expo-router';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { CalendarGrid, CalendarStats } from '@/components/calendar';
import { Screen } from '@/components/screen';
import { SessionRow } from '@/components/session-row';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { addMonths, dayKey, formatMonth, monthGrid } from '@/lib/dates';
import { sessionsByDay } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/store';

/** The full month, with arrows to move between months. */
export default function CalendarScreen() {
  const router = useRouter();
  const sessions = useStore((s) => s.sessions);
  const [today] = useState(() => new Date());
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(today);
  const month = useMemo(() => addMonths(today, offset), [today, offset]);
  const rows = useMemo(() => monthGrid(month), [month]);
  const byDay = useMemo(() => sessionsByDay(sessions), [sessions]);

  const selectedSessions = byDay.get(dayKey(selected)) ?? [];

  return (
    <>
      <Stack.Screen options={{ title: 'Calendar' }} />
      <Screen>
        <CalendarStats sessions={sessions} today={today} />
        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 text-xl tracking-tight font-semibold">{formatMonth(month)}</Text>
          <View className="flex-row gap-1">
            <Button
              variant="ghost"
              size="icon"
              accessibilityLabel="Previous month"
              onPress={() => {
                setOffset((o) => o - 1);
                setSelected(addMonths(month, -1));
              }}>
              <Icon as={ChevronLeftIcon} className="size-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              accessibilityLabel="Next month"
              disabled={offset >= 0}
              onPress={() => {
                setOffset((o) => Math.min(0, o + 1));
                setSelected(addMonths(month, 1));
              }}>
              <Icon as={ChevronRightIcon} className="size-6" />
            </Button>
          </View>
        </View>
        <CalendarGrid
          rows={rows}
          month={month}
          sessions={sessions}
          today={today}
          selected={selected}
          onDayPress={setSelected}
        />
        {offset !== 0 ? (
          <Button
            variant="outline"
            className="self-start"
            onPress={() => {
              setOffset(0);
              setSelected(today);
            }}>
            <Text>Back to this month</Text>
          </Button>
        ) : null}
        <View className="gap-3 border-t border-border pt-5">
          <Text className="text-xl font-semibold">
            {selected.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
          </Text>
          {selectedSessions.length ? (
            selectedSessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                dateStyle="time"
                showFeel
                onPress={() => router.push(`/session/${session.id}`)}
              />
            ))
          ) : (
            <Text variant="muted">No sessions on this day.</Text>
          )}
        </View>
      </Screen>
    </>
  );
}
