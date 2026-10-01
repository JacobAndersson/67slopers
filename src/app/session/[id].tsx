import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { FeelPicker } from '@/components/feel';
import { SessionFacts } from '@/components/session-facts';
import { Screen } from '@/components/screen';
import { SessionNote } from '@/components/session-note';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { formatTime, relativeDay } from '@/lib/dates';
import { useStore } from '@/lib/store/store';
import { summaryLine } from '@/lib/workout-summary';
import { sameTimings } from '@/lib/workout-steps';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const session = useStore((s) => s.sessions.find((x) => x.id === id));
  const hydrated = useStore((s) => s.hydrated);
  const workout = useStore((s) => s.workouts.find((w) => w.id === session?.workoutId));
  const setDraft = useStore((s) => s.setDraft);
  const updateSession = useStore((s) => s.updateSession);
  const deleteSession = useStore((s) => s.deleteSession);

  if (!session) {
    return (
      <>
        <Stack.Screen options={{ title: 'Session' }} />
        <Screen>
          <Text variant="muted">
            {hydrated ? 'This session no longer exists.' : 'Opening session…'}
          </Text>
          {hydrated ? (
            <Button variant="outline" onPress={() => router.dismissTo('/')}>
              <Text>Back to home</Text>
            </Button>
          ) : null}
        </Screen>
      </>
    );
  }

  const seconds =
    (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000;
  const changed = !!workout && !sameTimings(workout, session.snapshot);

  return (
    <>
      <Stack.Screen options={{ title: 'Session' }} />
      <Screen
        footer={
          <View className="gap-2">
            {changed ? (
              <Text variant="muted">This workout has changed since this session.</Text>
            ) : null}
            <Button
              size="lg"
              onPress={() => {
                if (workout && !changed) {
                  router.push(`/workout/${workout.id}/run`);
                } else {
                  // Run exactly what this session ran. It still counts for the workout, if any.
                  setDraft({
                    name: session.workoutName,
                    timings: session.snapshot,
                    ...(workout ? { workoutId: workout.id } : {}),
                  });
                  router.push('/workout/run');
                }
              }}>
              <Text className="text-lg">Do it again</Text>
            </Button>
            {workout && changed ? (
              <Button variant="outline" onPress={() => router.push(`/workout/${workout.id}/run`)}>
                <Text>Run the current version</Text>
              </Button>
            ) : null}
          </View>
        }>
        <View className="gap-2 pb-2">
          <Text variant="muted">
            {relativeDay(session.completedAt)} · {formatTime(session.completedAt)}
          </Text>
          <Text selectable className="text-3xl tracking-tight font-bold">
            {session.workoutName}
          </Text>
          <Text variant="muted">
            {session.completed ? 'Workout completed' : 'Workout ended early'}
          </Text>
        </View>
        <SessionFacts
          snapshot={session.snapshot}
          elapsedSeconds={seconds}
          completedSets={session.completedSets}
          totalSets={session.totalSets}
          hangs={session.hangs}
        />
        <View className="gap-2 border-t border-border pt-4">
          <Text className="font-medium">Workout as performed</Text>
          <Text variant="muted">{summaryLine(session.snapshot)}</Text>
        </View>

        <View className="gap-3">
          <Text className="text-xl font-semibold">How did you feel?</Text>
          <FeelPicker
            value={session.feel}
            onChange={(feel) =>
              updateSession(session.id, { feel: session.feel === feel ? undefined : feel })
            }
          />
        </View>

        <SessionNote
          key={session.id}
          value={session.note}
          onSave={(note) => updateSession(session.id, { note })}
        />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="mt-4 self-start">
              <Text className="text-destructive">Delete session</Text>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this session?</AlertDialogTitle>
              <AlertDialogDescription>
                It disappears from your history and streak. The workout itself is kept.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                <Text>Cancel</Text>
              </AlertDialogCancel>
              <AlertDialogAction
                onPress={() => {
                  deleteSession(session.id);
                  if (router.canGoBack()) router.back();
                  else router.replace('/');
                }}>
                <Text>Delete</Text>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Screen>
    </>
  );
}
