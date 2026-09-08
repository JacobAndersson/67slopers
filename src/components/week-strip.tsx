import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { isSameDay } from '@/lib/dates';
import { sessionsByWeekDay } from '@/lib/store/selectors';
import type { Session } from '@/lib/store/types';
import { cn } from '@/lib/utils';

const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type WeekStripProps = {
  sessions: Session[];
  /** When provided, days become tappable and the selected one is ringed. */
  selected?: Date;
  onSelect?: (day: Date) => void;
  today?: Date;
};

/** Monday to Sunday of the current week. Days with a completed session are filled in. */
export function WeekStrip({ sessions, selected, onSelect, today = new Date() }: WeekStripProps) {
  const week = useMemo(() => sessionsByWeekDay(sessions, today), [sessions, today]);
  const total = week.reduce((n, d) => n + d.sessions.length, 0);

  return (
    <View className="gap-3">
      <View className="flex-row justify-between">
        {week.map(({ day, sessions: daySessions }, i) => {
          const done = daySessions.length > 0;
          const isToday = isSameDay(day, today);
          const isSelected = selected ? isSameDay(day, selected) : false;
          return (
            <Pressable
              key={day.toISOString()}
              onPress={onSelect ? () => onSelect(day) : undefined}
              disabled={!onSelect}
              accessibilityRole={onSelect ? 'button' : undefined}
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${day.toLocaleDateString(undefined, { weekday: 'long' })}, ${done ? `${daySessions.length} sessions` : 'no session'}`}
              className="items-center gap-1.5 active:opacity-70"
              hitSlop={6}>
              <Text variant="small" className="text-muted-foreground">
                {WEEKDAY_INITIALS[i]}
              </Text>
              <View
                className={cn(
                  'h-11 w-11 items-center justify-center rounded-full border-2 border-transparent',
                  done && 'bg-primary',
                  isToday && !isSelected && 'border-primary',
                  isSelected && 'border-foreground'
                )}>
                <Text
                  className={cn(
                    'font-semibold',
                    done ? 'text-primary-foreground' : 'text-foreground'
                  )}>
                  {day.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Text variant="muted">
        {total === 0
          ? 'No sessions this week yet'
          : total === 1
            ? '1 session this week'
            : `${total} sessions this week`}
      </Text>
    </View>
  );
}
