import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/screen';
import { SessionRow } from '@/components/session-row';
import { Text } from '@/components/ui/text';
import { isSameDay, relativeDay } from '@/lib/dates';
import { useStore } from '@/lib/store/store';
import type { Session } from '@/lib/store/types';

type DayGroup = { label: string; sessions: Session[] };

/** Groups sessions by calendar day, newest first, labelled "Today", "Yesterday", ... */
function groupByDay(sessions: Session[]): DayGroup[] {
  const sorted = [...sessions].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  const groups: DayGroup[] = [];
  let currentDay: Date | null = null;
  for (const session of sorted) {
    const day = new Date(session.completedAt);
    if (!currentDay || !isSameDay(day, currentDay)) {
      currentDay = day;
      groups.push({ label: relativeDay(session.completedAt), sessions: [] });
    }
    groups[groups.length - 1].sessions.push(session);
  }
  return groups;
}

/** Every completed session, grouped by day. Grades are shown here, not on the home screen. */
export default function SessionsScreen() {
  const router = useRouter();
  const sessions = useStore((s) => s.sessions);
  const groups = useMemo(() => groupByDay(sessions), [sessions]);

  return (
    <Screen>
      {groups.length === 0 ? <Text variant="muted">No sessions yet.</Text> : null}
      {groups.map((group) => (
        <View key={group.label} className="gap-2">
          <Text variant="muted" className="mt-2">
            {group.label}
          </Text>
          {group.sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              dateStyle="time"
              showFeel
              onPress={() => router.push(`/session/${session.id}`)}
            />
          ))}
        </View>
      ))}
    </Screen>
  );
}
