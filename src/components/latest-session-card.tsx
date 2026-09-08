import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { formatClock, relativeDay } from '@/lib/dates';
import type { Session } from '@/lib/store/types';
import { setsLine, summaryLine } from '@/lib/workout-summary';

/** The most recent session, shown larger than the rows beneath it. No grade on the home screen. */
export function LatestSessionCard({ session }: { session: Session }) {
  const router = useRouter();
  const seconds =
    (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000;

  return (
    <Pressable
      onPress={() => router.push(`/session/${session.id}`)}
      accessibilityRole="button"
      className="active:opacity-80">
      <Card>
        <CardHeader>
          <CardDescription>{relativeDay(session.completedAt)}</CardDescription>
          <CardTitle>{session.workoutName}</CardTitle>
        </CardHeader>
        <CardContent className="gap-1">
          <Text variant="muted">{summaryLine(session.snapshot)}</Text>
          <Text variant="small">
            {setsLine(session.completedSets, session.totalSets)} · {formatClock(seconds)}
            {session.completed ? '' : ' · ended early'}
          </Text>
        </CardContent>
      </Card>
    </Pressable>
  );
}
