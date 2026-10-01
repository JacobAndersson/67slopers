import { useRouter } from 'expo-router';
import { ChevronRightIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { dayKey, isSameDay, isSameMonth, weekDays } from '@/lib/dates';
import { sessionsByDay, weekStreak } from '@/lib/store/selectors';
import type { Session } from '@/lib/store/types';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Week streak and total sessions, shown above both calendar views. */
export function CalendarStats({
  sessions,
  today = new Date(),
}: {
  sessions: Session[];
  today?: Date;
}) {
  const streak = useMemo(() => weekStreak(sessions, today), [sessions, today]);
  return (
    <View className="flex-row flex-wrap gap-x-8 gap-y-3">
      <View className="gap-1">
        <Text variant="muted">Your streak</Text>
        <Text className="text-2xl font-bold">
          {streak} {streak === 1 ? 'week' : 'weeks'}
        </Text>
      </View>
      <View className="gap-1">
        <Text variant="muted">Sessions</Text>
        <Text className="text-2xl font-bold">{sessions.length}</Text>
      </View>
    </View>
  );
}

type CalendarGridProps = {
  rows: Date[][];
  month?: Date;
  sessions: Session[];
  today?: Date;
  selected?: Date;
  onDayPress?: (day: Date) => void;
};

/** Seven equal columns. Dates stay visible; an amber surface marks training days. */
export function CalendarGrid({
  rows,
  month,
  sessions,
  today = new Date(),
  selected,
  onDayPress,
}: CalendarGridProps) {
  const router = useRouter();
  const byDay = useMemo(() => sessionsByDay(sessions), [sessions]);
  const shownMonth = month ?? today;

  return (
    <View className="gap-1">
      <View className="flex-row pb-1">
        {WEEKDAYS.map((label, i) => (
          <Text key={i} variant="small" className="flex-1 text-center text-muted-foreground">
            {label}
          </Text>
        ))}
      </View>
      {rows.map((week, r) => (
        <View key={r} className="flex-row">
          {week.map((day) => {
            const daySessions = byDay.get(dayKey(day)) ?? [];
            const done = daySessions.length > 0;
            const inMonth = isSameMonth(day, shownMonth);
            const isToday = isSameDay(day, today);
            const isSelected = !!selected && isSameDay(day, selected);
            const enabled = !!onDayPress || done;
            return (
              <Pressable
                key={dayKey(day)}
                disabled={!enabled}
                onPress={() => {
                  if (onDayPress) onDayPress(day);
                  else if (daySessions.length === 1) router.push(`/session/${daySessions[0].id}`);
                  else router.push('/sessions');
                }}
                accessibilityRole={enabled ? 'button' : undefined}
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${day.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}${isToday ? ', today' : ''}, ${daySessions.length} ${daySessions.length === 1 ? 'session' : 'sessions'}`}
                className="h-12 flex-1 items-center justify-center active:opacity-70">
                <View
                  className={cn(
                    'h-9 w-9 items-center justify-center rounded-lg',
                    done && 'bg-chart-1',
                    isToday && 'border border-foreground',
                    isSelected && 'bg-primary'
                  )}>
                  <Text
                    className={cn(
                      'font-medium',
                      !inMonth && !isSelected && 'text-muted-foreground',
                      isSelected && 'text-primary-foreground',
                      isToday && 'font-semibold'
                    )}>
                    {day.getDate()}
                  </Text>
                  {done ? (
                    <View
                      className={cn(
                        'absolute bottom-1 h-1 w-1 rounded-full bg-foreground',
                        isSelected && 'bg-primary-foreground'
                      )}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** The current week; either its header or a date opens the month view. */
export function WeekCalendar({
  sessions,
  today = new Date(),
}: {
  sessions: Session[];
  today?: Date;
}) {
  const router = useRouter();
  const rows = useMemo(() => [weekDays(today)], [today]);
  return (
    <View className="gap-2">
      <Button
        variant="ghost"
        className="justify-between px-0"
        accessibilityLabel="Show the month"
        onPress={() => router.push('/calendar')}>
        <Text className="font-medium">This week</Text>
        <Icon as={ChevronRightIcon} className="size-4" />
      </Button>
      <CalendarGrid
        rows={rows}
        sessions={sessions}
        today={today}
        onDayPress={() => router.push('/calendar')}
      />
    </View>
  );
}
