import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/card';
import { Stat } from '@/components/data-bars';
import { HeatCalendar } from '@/components/heat-calendar';
import { LogRow } from '@/components/log-row';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Text } from '@/components/ui/text';
import { plural } from '@/lib/copy';
import { startOfWeek } from '@/lib/dates';
import { HEAT_WEEKS, formatMinutes } from '@/lib/moonboard/heat';
import { useClimb } from '@/lib/store/climb';
import { useStore } from '@/lib/store/store';
import {
  itemsOnDay,
  totalsSince,
  trainingLog,
  trainingStreak,
  type LogItem,
} from '@/lib/training-log';

const RECENT = 4;

/**
 * Everything trained, timer and board together (design: page 07, log-log and its states): three
 * figures, eight weeks as a heat calendar, and under it the pinned day's sessions or the latest.
 */
export default function LogScreen() {
  const router = useRouter();
  const sessions = useStore((s) => s.sessions);
  const log = useClimb((s) => s.log);
  const [day, setDay] = useState<Date | null>(null);
  // One "now" per mount keeps the grid and its figures in step.
  const [now] = useState(() => new Date());

  const items = useMemo(() => trainingLog(sessions, log), [sessions, log]);
  const spans = useMemo(
    () => items.map((item) => ({ at: item.at, minutes: item.minutes })),
    [items]
  );
  const totals = useMemo(() => {
    const since = startOfWeek(now);
    since.setDate(since.getDate() - (HEAT_WEEKS - 1) * 7);
    return totalsSince(items, since);
  }, [items, now]);
  const streak = useMemo(() => trainingStreak(items, now), [items, now]);
  const onDay = useMemo(() => (day ? itemsOnDay(items, day) : []), [items, day]);
  const open = (item: LogItem) =>
    router.push(item.kind === 'hang' ? `/session/${item.id}` : `/climb/session/${item.id}`);
  const empty = items.length === 0;

  return (
    <Screen tab contentClassName="gap-0">
      <Text className="type-large" role="heading">
        Log
      </Text>
      <View className="mt-[27px] flex-row">
        <Stat className="flex-1" label="Streak" value={empty ? '–' : plural(streak, 'week')} />
        <Stat className="flex-1" label="Sessions" value={empty ? '–' : String(totals.sessions)} />
        <Stat className="flex-1" label="Time" value={empty ? '–' : formatMinutes(totals.minutes)} />
      </View>
      <Card className="mt-9 p-5">
        <HeatCalendar spans={spans} today={now} selected={day} onSelect={setDay} disabled={empty} />
      </Card>

      {day ? (
        <>
          <SectionHeader
            className="mt-8"
            title={day.toLocaleDateString(undefined, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
            actionLabel="Clear"
            onAction={() => setDay(null)}
          />
          {onDay.length > 0 ? (
            <View className="mt-4 gap-2">
              {onDay.map((item) => (
                <LogRow
                  key={`${item.kind}${item.id}`}
                  item={item}
                  dateStyle="time"
                  onPress={() => open(item)}
                />
              ))}
              <Text className="type-caption mt-1 text-muted">
                {formatMinutes(onDay.reduce((n, item) => n + item.minutes, 0))} trained
              </Text>
            </View>
          ) : (
            <Text className="type-body mt-4 text-muted">A rest day. Rest is part of the plan.</Text>
          )}
        </>
      ) : empty ? (
        <Text className="type-body mt-8 text-muted">
          Nothing logged yet.{'\n'}Your sessions show up here.
        </Text>
      ) : (
        <>
          <SectionHeader
            className="mt-8"
            title="Recent"
            actionLabel={items.length > RECENT ? 'View all' : undefined}
            onAction={() => router.push('/sessions')}
          />
          <View className="mt-4 gap-2">
            {items.slice(0, RECENT).map((item) => (
              <LogRow key={`${item.kind}${item.id}`} item={item} onPress={() => open(item)} />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}
