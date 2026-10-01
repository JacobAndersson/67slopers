import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

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
import { timeAgo } from '@/lib/dates';
import { clearActiveRun, loadActiveRun } from '@/lib/store/active-run';
import { useStore } from '@/lib/store/store';
import { sessionFromCheckpoint, type ActiveRun } from '@/lib/timer/checkpoint';
import { expandWorkout } from '@/lib/timer/intervals';

/**
 * A workout that was still going when the app closed. Continue picks it up paused where it
 * stood, Save keeps what was done as an ended session, Discard drops it. Read on focus, after
 * the first frame, so it never delays startup.
 */
export function ActiveRunCard() {
  const router = useRouter();
  const addSession = useStore((s) => s.addSession);
  const setResume = useStore((s) => s.setResume);
  const [run, setRun] = useState<ActiveRun | null>(null);

  useFocusEffect(
    useCallback(() => {
      let focused = true;
      void loadActiveRun().then((found) => {
        if (!focused) return;
        // Already in history: the app closed between saving the session and clearing this.
        if (found && useStore.getState().sessions.some((s) => s.startedAt === found.startedAt)) {
          void clearActiveRun();
          setRun(null);
          return;
        }
        setRun(found);
      });
      return () => {
        focused = false;
      };
    }, [])
  );

  if (!run) return null;

  const interval = expandWorkout(run.timings)[run.index];
  const where =
    interval && interval.phase !== 'done'
      ? `Set ${interval.setIndex + 1}/${interval.setCount} · `
      : '';
  const drop = () => {
    void clearActiveRun();
    setRun(null);
  };

  return (
    <Card className="border-border bg-accent">
      <CardHeader>
        <CardDescription>Unfinished workout</CardDescription>
        <CardTitle>{run.name}</CardTitle>
        <CardDescription>
          {where}stopped {timeAgo(run.savedAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-2">
        <Button
          size="lg"
          onPress={() => {
            setResume(run);
            setRun(null);
            router.push('/workout/run');
          }}>
          <Text className="text-lg">Continue</Text>
        </Button>
        <View className="flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onPress={() => {
              addSession(sessionFromCheckpoint(run));
              drop();
            }}>
            <Text>Save as ended</Text>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="flex-1">
                <Text className="text-destructive">Discard</Text>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard this workout?</AlertDialogTitle>
                <AlertDialogDescription>
                  Nothing from it is kept in your history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  <Text>Keep it</Text>
                </AlertDialogCancel>
                <AlertDialogAction onPress={drop}>
                  <Text>Discard</Text>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </View>
      </CardContent>
    </Card>
  );
}
