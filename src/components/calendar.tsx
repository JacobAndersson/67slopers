import { useRouter } from 'expo-router';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { dayKey, isSameDay, weekDays } from '@/lib/dates';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Week streak and total sessions, counting every kind of training. */
export function CalendarStats({ streak, sessions }: { streak: number; sessions: number }) {
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
        <Text className="text-2xl font-bold">{sessions}</Text>
      </View>
    </View>
  );
}

type WeekCalendarProps = {
  /** Days with any training, as `dayKey`s (see `trainedDays` in `src/lib/training-log.ts`). */
  trained: Set<string>;
  today?: Date;
};

/**
 * The current week as seven equal columns. Dates stay visible; an amber surface marks the
 * days trained. The header or any date opens the log.
 */
export function WeekCalendar({ trained, today = new Date() }: WeekCalendarProps) {
  const router = useRouter();
  const days = useMemo(() => weekDays(today), [today]);
  const openLog = () => router.push('/log');
  return (
    <View className="gap-2">
      <Button
        variant="ghost"
        className="justify-between px-0"
        accessibilityLabel="Open the log"
        onPress={openLog}>
        <Text className="font-medium">This week</Text>
        <Icon as={CaretRightIcon} className="size-4" />
      </Button>
      <View className="gap-1">
        <View className="flex-row pb-1">
          {WEEKDAYS.map((label, i) => (
            <Text key={i} variant="small" className="flex-1 text-center text-muted-foreground">
              {label}
            </Text>
          ))}
        </View>
        <View className="flex-row">
          {days.map((day) => {
            const done = trained.has(dayKey(day));
            const isToday = isSameDay(day, today);
            return (
              <Pressable
                key={dayKey(day)}
                onPress={openLog}
                accessibilityRole="button"
                accessibilityLabel={`${day.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}${isToday ? ', today' : ''}, ${done ? 'trained' : 'no training'}`}
                className="h-12 flex-1 items-center justify-center active:opacity-70">
                <View
                  className={cn(
                    'h-9 w-9 items-center justify-center rounded-lg',
                    done && 'bg-chart-1',
                    isToday && 'border border-foreground'
                  )}>
                  <Text className={cn('font-medium', isToday && 'font-semibold')}>
                    {day.getDate()}
                  </Text>
                  {done ? (
                    <View className="absolute bottom-1 h-1 w-1 rounded-full bg-foreground" />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
