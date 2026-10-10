import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { HeatCalendar } from '@/components/heat-calendar';
import { LogRow } from '@/components/log-row';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { TabHeader } from '@/components/tab-header';
import { Text } from '@/components/ui/text';
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

const RECENT = 5;

/**
 * Everything trained, timer and board together: the last sixteen weeks as a heat calendar,
 * and under it the pinned day's sessions or the latest ones.
 */
export default function LogScreen() {
  const router = useRouter();
  const sessions = useStore((s) => s.sessions);
  const log = useClimb((s) => s.log);
  const scale = useClimb((s) => s.gradeScale);
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

  return (
    <Screen tab>
      <TabHeader title="Log">
        <Text className="text-xs text-muted-foreground font-medium">Last {HEAT_WEEKS} weeks</Text>
      </TabHeader>
      <View className="flex-row gap-6">
        {[
          ['Streak', `${streak} ${streak === 1 ? 'week' : 'weeks'}`],
          ['Sessions', String(totals.sessions)],
          ['Time', formatMinutes(totals.minutes)],
        ].map(([label, value]) => (
          <View key={label} className="flex-1 gap-1">
            <Text className="text-xs text-muted-foreground font-medium" numberOfLines={1}>
              {label}
            </Text>
            <Text className="text-xl font-bold" numberOfLines={1} adjustsFontSizeToFit>
              {value}
            </Text>
          </View>
        ))}
      </View>
      <View className="py-2">
        <HeatCalendar spans={spans} today={now} selected={day} onSelect={setDay} />
      </View>

      {day ? (
        <>
          <SectionHeader
            title={day.toLocaleDateString(undefined, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
            actionLabel="Clear"
            onAction={() => setDay(null)}
          />
          {onDay.length > 0 ? (
            <View>
              {onDay.map((item) => (
                <LogRow
                  key={`${item.kind}${item.id}`}
                  item={item}
                  scale={scale}
                  dateStyle="time"
                  onPress={() => open(item)}
                />
              ))}
              <Text className="pt-3 text-xs text-muted-foreground font-medium">
                {formatMinutes(onDay.reduce((n, item) => n + item.minutes, 0))} trained
              </Text>
            </View>
          ) : (
            <Text variant="muted">A rest day.</Text>
          )}
        </>
      ) : (
        <>
          <SectionHeader
            title="Recent"
            actionLabel={items.length > RECENT ? 'View all' : undefined}
            onAction={() => router.push('/sessions')}
          />
          {items.length > 0 ? (
            <View>
              {items.slice(0, RECENT).map((item) => (
                <LogRow
                  key={`${item.kind}${item.id}`}
                  item={item}
                  scale={scale}
                  onPress={() => open(item)}
                />
              ))}
            </View>
          ) : (
            <Text variant="muted">Nothing logged yet. Your sessions show up here.</Text>
          )}
        </>
      )}
    </Screen>
  );
}
