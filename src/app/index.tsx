import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/screen';
import { SessionRow } from '@/components/session-row';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { WeekStrip } from '@/components/week-strip';
import { WorkoutCard } from '@/components/workout-card';
import { formatClock, relativeDay } from '@/lib/dates';
import { latestSession, sessionsOnDay } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/store';
import { setsLine, summaryLine } from '@/lib/workout-summary';

export default function HomeScreen() {
  const router = useRouter();
  const workouts = useStore((s) => s.workouts);
  const sessions = useStore((s) => s.sessions);
  const [selectedDay, setSelectedDay] = useState(() => new Date());

  const daySessions = useMemo(() => sessionsOnDay(sessions, selectedDay), [sessions, selectedDay]);
  const latest = useMemo(() => latestSession(sessions), [sessions]);
  const latestWorkout = latest ? workouts.find((w) => w.id === latest.workoutId) : undefined;
  const savedWorkouts = useMemo(
    () => [...workouts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [workouts]
  );

  const dayLabel = selectedDay.toLocaleDateString(undefined, { weekday: 'long' });

  return (
    <Screen
      footer={
        <Button size="lg" onPress={() => router.push('/workout/new')}>
          <Text>New workout</Text>
        </Button>
      }>
      <WeekStrip sessions={sessions} selected={selectedDay} onSelect={setSelectedDay} />
      {daySessions.length > 0 ? (
        <View className="gap-2">
          {daySessions.map((session) => {
            const exists = workouts.some((w) => w.id === session.workoutId);
            return (
              <SessionRow
                key={session.id}
                session={session}
                onPress={exists ? () => router.push(`/workout/${session.workoutId}`) : undefined}
              />
            );
          })}
        </View>
      ) : (
        <Text variant="muted">No session on {dayLabel}.</Text>
      )}

      <Text variant="h4" className="mt-2">
        Last session
      </Text>
      {latest ? (
        <Pressable
          disabled={!latestWorkout}
          onPress={() => latestWorkout && router.push(`/workout/${latestWorkout.id}`)}
          accessibilityRole="button"
          className="active:opacity-80">
          <Card>
            <CardHeader>
              <CardDescription>{relativeDay(latest.completedAt)}</CardDescription>
              <CardTitle>{latest.workoutName}</CardTitle>
            </CardHeader>
            <CardContent className="gap-1">
              <Text variant="muted">{summaryLine(latest.snapshot)}</Text>
              <Text variant="small">
                {setsLine(latest.completedSets, latest.totalSets)} ·{' '}
                {formatClock(
                  (new Date(latest.completedAt).getTime() - new Date(latest.startedAt).getTime()) /
                    1000
                )}
                {latest.completed ? '' : ' · ended early'}
              </Text>
            </CardContent>
          </Card>
        </Pressable>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No sessions yet</CardTitle>
            <CardDescription>Pick a workout below and press Start.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Text variant="h4" className="mt-2">
        Saved workouts
      </Text>
      {savedWorkouts.length > 0 ? (
        <View className="gap-2">
          {savedWorkouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </View>
      ) : (
        <Text variant="muted">No saved workouts. Create one below.</Text>
      )}
    </Screen>
  );
}
