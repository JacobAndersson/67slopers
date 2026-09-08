import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { FeelBadge } from '@/components/feel';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { formatClock, formatTime, relativeDay } from '@/lib/dates';
import { useStore } from '@/lib/store/store';
import { setsLine, summaryLine } from '@/lib/workout-summary';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const session = useStore((s) => s.sessions.find((x) => x.id === id));
  const workout = useStore((s) => s.workouts.find((w) => w.id === session?.workoutId));
  const setDraft = useStore((s) => s.setDraft);

  if (!session) {
    return (
      <>
        <Stack.Screen options={{ title: 'Session' }} />
        <Screen>
          <Text variant="muted">This session no longer exists.</Text>
        </Screen>
      </>
    );
  }

  const seconds =
    (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000;

  return (
    <>
      <Stack.Screen options={{ title: session.workoutName }} />
      <Screen
        footer={
          <Button
            size="lg"
            onPress={() => {
              if (workout) {
                router.push(`/workout/${workout.id}/run`);
              } else {
                // The workout is gone (or was never saved): run the session's own copy.
                setDraft({ name: session.workoutName, timings: session.snapshot });
                router.push('/workout/run');
              }
            }}>
            <Text className="text-lg">Do it again</Text>
          </Button>
        }>
        <Card>
          <CardHeader>
            <CardDescription>
              {relativeDay(session.completedAt)} · {formatTime(session.completedAt)}
            </CardDescription>
            <CardTitle>{setsLine(session.completedSets, session.totalSets)}</CardTitle>
            <CardDescription>
              {formatClock(seconds)}
              {session.completed ? '' : ' · ended early'}
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            {session.feel ? (
              <FeelBadge feel={session.feel} size="lg" />
            ) : (
              <Text variant="muted">Not graded.</Text>
            )}
            <Text variant="muted">{summaryLine(session.snapshot)}</Text>
          </CardContent>
        </Card>
      </Screen>
    </>
  );
}
