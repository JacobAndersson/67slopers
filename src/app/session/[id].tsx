import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { FeelPicker } from '@/components/feel';
import { Screen } from '@/components/screen';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { formatClock, formatTime, relativeDay } from '@/lib/dates';
import { useStore } from '@/lib/store/store';
import { hangOutcomes, hangsLine, setsLine, summaryLine } from '@/lib/workout-summary';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const session = useStore((s) => s.sessions.find((x) => x.id === id));
  const workout = useStore((s) => s.workouts.find((w) => w.id === session?.workoutId));
  const setDraft = useStore((s) => s.setDraft);
  const updateSession = useStore((s) => s.updateSession);
  const deleteSession = useStore((s) => s.deleteSession);

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
            {session.hangs ? (
              <CardDescription>
                {hangsLine(hangOutcomes(session.snapshot, session.hangs))}
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent>
            <Text variant="muted">{summaryLine(session.snapshot)}</Text>
          </CardContent>
        </Card>

        <View className="gap-3">
          <Text className="text-xl font-semibold">How did you feel?</Text>
          <FeelPicker
            value={session.feel}
            onChange={(feel) =>
              updateSession(session.id, { feel: session.feel === feel ? undefined : feel })
            }
          />
        </View>

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
                  router.back();
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
