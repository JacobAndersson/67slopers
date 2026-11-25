import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { LogRow } from '@/components/log-row';
import { Screen } from '@/components/screen';
import { Label, LargeTitle } from '@/components/section-header';
import { TopBar } from '@/components/top-bar';
import { Text } from '@/components/ui/text';
import { dayHeading } from '@/lib/copy';
import { isSameDay } from '@/lib/dates';
import { useClimb } from '@/lib/store/climb';
import { useStore } from '@/lib/store/store';
import { trainingLog, type LogItem } from '@/lib/training-log';

type DayGroup = { key: string; label: string; items: LogItem[] };

/** Groups the log by calendar day, newest first: "Yesterday", "Monday", "Thu, 12 Nov". */
function groupByDay(items: LogItem[], now: Date): DayGroup[] {
  const groups: DayGroup[] = [];
  let currentDay: Date | null = null;
  for (const item of items) {
    const day = new Date(item.at);
    if (!currentDay || !isSameDay(day, currentDay)) {
      currentDay = day;
      groups.push({ key: item.at, label: dayHeading(item.at, now), items: [] });
    }
    groups[groups.length - 1].items.push(item);
  }
  return groups;
}

/** Every session, timer and board together, grouped by day (design: log-sessions). */
export default function SessionsScreen() {
  const router = useRouter();
  const sessions = useStore((s) => s.sessions);
  const log = useClimb((s) => s.log);
  const groups = useMemo(() => groupByDay(trainingLog(sessions, log), new Date()), [sessions, log]);

  return (
    <Screen header={<TopBar />} contentClassName="gap-0">
      <LargeTitle title="Sessions" />
      {groups.length === 0 ? (
        <Text className="type-body mt-6 text-muted">
          Nothing logged yet.{'\n'}Your sessions show up here.
        </Text>
      ) : null}
      {groups.map((group) => (
        <View key={group.key} className="mt-6 gap-2">
          <Label>{group.label}</Label>
          {group.items.map((item) => (
            <LogRow
              key={`${item.kind}${item.id}`}
              item={item}
              dateStyle="time"
              onPress={() =>
                router.push(
                  item.kind === 'hang' ? `/session/${item.id}` : `/climb/session/${item.id}`
                )
              }
            />
          ))}
        </View>
      ))}
    </Screen>
  );
}
