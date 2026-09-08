import { useRouter } from 'expo-router';
import { ChevronDownIcon, FlameIcon, HandGrabIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { dayKey, isSameDay, isSameMonth, startOfDay, weekDays } from '@/lib/dates';
import { sessionsByDay, weekStreak } from '@/lib/store/selectors';
import type { Session } from '@/lib/store/types';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Week streak and total sessions, shown above both the week row and the month grid. */
export function CalendarStats({
  sessions,
  today = new Date(),
}: {
  sessions: Session[];
  today?: Date;
}) {
  const streak = useMemo(() => weekStreak(sessions, today), [sessions, today]);
  return (
    <View className="flex-row gap-8">
      <View className="gap-0.5">
        <Text variant="muted">Your streak</Text>
        <Text className="text-2xl font-bold">
          {streak} {streak === 1 ? 'week' : 'weeks'}
        </Text>
      </View>
      <View className="gap-0.5">
        <Text variant="muted">Sessions</Text>
        <Text className="text-2xl font-bold">{sessions.length}</Text>
      </View>
    </View>
  );
}

type CalendarGridProps = {
  /** Monday-first weeks to draw. */
  rows: Date[][];
  /** Days outside this month are faded. Defaults to the month of `today`. */
  month?: Date;
  sessions: Session[];
  today?: Date;
  /** Row index whose flame carries the streak number, if any. */
  streakRow?: number | null;
  /** Rendered in the top-right corner, above the week column. */
  corner?: React.ReactNode;
};

/**
 * Days with a session are filled and show a grip icon (a dot marks more than one); today is
 * ringed; past days without a session are dimmed; future days are outlined; days outside
 * `month` are faded. The right column marks each week that had a session with a flame.
 */
export function CalendarGrid({
  rows,
  month,
  sessions,
  today = new Date(),
  streakRow = null,
  corner,
}: CalendarGridProps) {
  const router = useRouter();
  const byDay = useMemo(() => sessionsByDay(sessions), [sessions]);
  const streak = useMemo(() => weekStreak(sessions, today), [sessions, today]);
  const todayStart = startOfDay(today);
  const shownMonth = month ?? today;

  const openDay = (daySessions: Session[]) => {
    if (daySessions.length === 1) router.push(`/session/${daySessions[0].id}`);
    else router.push('/sessions');
  };

  return (
    <View className="flex-row gap-3">
      <View className="flex-1 gap-3">
        <View className="flex-row">
          {WEEKDAYS.map((label, i) => (
            <Text key={i} variant="small" className="h-5 flex-1 text-center text-muted-foreground">
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
              const past = day < todayStart;
              return (
                <Pressable
                  key={day.toISOString()}
                  disabled={!done}
                  onPress={() => openDay(daySessions)}
                  accessibilityRole={done ? 'button' : undefined}
                  accessibilityLabel={`${day.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}${done ? `, ${daySessions.length} ${daySessions.length === 1 ? 'session' : 'sessions'}` : ''}`}
                  className="flex-1 items-center active:opacity-70">
                  <View
                    className={cn(
                      'h-10 w-10 items-center justify-center rounded-full',
                      done && 'bg-primary',
                      isToday && 'border-2 border-foreground',
                      !done && !isToday && inMonth && past && 'bg-muted',
                      !done && !isToday && inMonth && !past && 'border border-border'
                    )}>
                    {done ? (
                      <Icon as={HandGrabIcon} className="size-5 text-primary-foreground" />
                    ) : (
                      <Text
                        className={cn(
                          'font-medium',
                          !inMonth && 'text-muted-foreground',
                          isToday && 'font-semibold'
                        )}>
                        {day.getDate()}
                      </Text>
                    )}
                    {daySessions.length > 1 ? (
                      <View className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-foreground" />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View className="w-10 gap-3">
        <View className="h-5 items-center justify-center">{corner}</View>
        <View className="items-center gap-3 rounded-full bg-muted py-1">
          {rows.map((week, r) => {
            const active = week.some((day) => byDay.has(dayKey(day)));
            const future = week[0] > todayStart;
            return (
              <View
                key={r}
                className={cn(
                  'h-10 w-8 items-center justify-center rounded-full',
                  active ? 'bg-primary' : 'border border-border bg-background',
                  !active && future && 'opacity-50'
                )}>
                {active ? (
                  <>
                    <Icon as={FlameIcon} className="size-4 text-primary-foreground" />
                    {r === streakRow && streak > 0 ? (
                      <Text className="text-[10px] leading-3 text-primary-foreground font-bold">
                        {streak}
                      </Text>
                    ) : null}
                  </>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/** The current week as one calendar row. Tapping it opens the month view. */
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
    <Pressable
      onPress={() => router.push('/calendar')}
      accessibilityRole="button"
      accessibilityLabel="Show the month"
      className="active:opacity-80">
      <CalendarGrid
        rows={rows}
        sessions={sessions}
        today={today}
        streakRow={0}
        corner={<Icon as={ChevronDownIcon} className="size-5 text-muted-foreground" />}
      />
    </Pressable>
  );
}
