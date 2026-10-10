import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { LogRow } from '@/components/log-row';
import { Screen } from '@/components/screen';
import { Text } from '@/components/ui/text';
import { isSameDay, relativeDay } from '@/lib/dates';
import { useClimb } from '@/lib/store/climb';
import { useStore } from '@/lib/store/store';
import { trainingLog, type LogItem } from '@/lib/training-log';

type DayGroup = { label: string; items: LogItem[] };

/** Groups the log by calendar day, newest first, labelled "Today", "Yesterday", ... */
function groupByDay(items: LogItem[]): DayGroup[] {
  const groups: DayGroup[] = [];
  let currentDay: Date | null = null;
  for (const item of items) {
    const day = new Date(item.at);
    if (!currentDay || !isSameDay(day, currentDay)) {
      currentDay = day;
      groups.push({ label: relativeDay(item.at), items: [] });
    }
    groups[groups.length - 1].items.push(item);
  }
  return groups;
}

/** Every session, timer and board together, grouped by day. */
export default function SessionsScreen() {
  const router = useRouter();
  const sessions = useStore((s) => s.sessions);
  const log = useClimb((s) => s.log);
  const scale = useClimb((s) => s.gradeScale);
  const groups = useMemo(() => groupByDay(trainingLog(sessions, log)), [sessions, log]);

  return (
    <Screen>
      {groups.length === 0 ? <Text variant="muted">No sessions yet.</Text> : null}
      {groups.map((group) => (
        <View key={group.label}>
          <Text variant="muted" className="mt-2">
            {group.label}
          </Text>
          {group.items.map((item) => (
            <LogRow
              key={`${item.kind}${item.id}`}
              item={item}
              scale={scale}
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
