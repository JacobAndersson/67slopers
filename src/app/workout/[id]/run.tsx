import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import {
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
  VibrateIcon,
  VibrateOffIcon,
  Volume2Icon,
  VolumeXIcon,
  XIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { formatClock } from '@/lib/dates';
import { useStore } from '@/lib/store/store';
import type { Workout, WorkoutTimings } from '@/lib/store/types';
import { THEME, type ThemeColor } from '@/lib/theme';
import { createCuePlayer, type CuePlayer } from '@/lib/timer/cues';
import type { Phase } from '@/lib/timer/intervals';
import { useTimer } from '@/lib/timer/useTimer';
import { setsLine } from '@/lib/workout-summary';

const PHASE_LABEL: Record<Phase, string> = {
  prep: 'Get ready',
  hang: 'Hang',
  pause: 'Release',
  rest: 'Rest',
  done: 'Done',
};

const PHASE_COLOR: Record<Phase, ThemeColor> = {
  prep: 'accent',
  hang: 'primary',
  pause: 'secondary',
  rest: 'muted',
  done: 'primary',
};

export default function RunScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const workout = useStore((s) => s.workouts.find((w) => w.id === id));

  if (!workout) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
        <Text variant="muted">This workout no longer exists.</Text>
        <Button variant="outline" onPress={() => router.dismissTo('/')}>
          <Text>Back to home</Text>
        </Button>
      </View>
    );
  }
  return <Runner workout={workout} />;
}

function Runner({ workout }: { workout: Workout }) {
  useKeepAwake();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const addSession = useStore((s) => s.addSession);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const cues = useRef<CuePlayer | null>(null);
  useEffect(() => {
    cues.current = createCuePlayer(() => ({
      sound: settingsRef.current.soundEnabled,
      vibration: settingsRef.current.vibrationEnabled,
    }));
    return () => cues.current?.release();
  }, []);

  const timings: WorkoutTimings = useMemo(
    () => ({ prepSeconds: workout.prepSeconds, blocks: workout.blocks }),
    [workout]
  );
  const timer = useTimer(timings, { onCue: (kind) => cues.current?.[kind]() });
  const finished = timer.status === 'done' || timer.status === 'ended';

  const [startedAt] = useState(() => new Date().toISOString());
  const [note, setNote] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const leaving = useRef(false);

  // Hardware back and the gesture go through the same confirmation as the X button.
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (leaving.current || finished) return;
      e.preventDefault();
      timer.pause();
      setConfirmOpen(true);
    });
  }, [navigation, finished, timer]);

  const fill = useSharedValue(0);
  useEffect(() => {
    fill.value = withTiming(finished ? 1 : timer.progress, {
      duration: 100,
      easing: Easing.linear,
    });
  }, [fill, timer.progress, finished]);
  const fillStyle = useAnimatedStyle(() => ({ height: `${fill.value * 100}%` }));

  const finish = () => {
    // End the session when the timer stopped, not when Finish was tapped, so the
    // saved length matches the summary shown on this screen.
    const completedAt = new Date(
      new Date(startedAt).getTime() + Math.round(timer.elapsedSeconds * 1000)
    ).toISOString();
    addSession({
      workoutId: workout.id,
      workoutName: workout.name,
      snapshot: timings,
      startedAt,
      completedAt,
      completedSets: timer.completedSets,
      totalSets: timer.totalSets,
      completed: timer.status === 'done',
      note: note.trim() || undefined,
    });
    leaving.current = true;
    router.dismissTo('/');
  };

  const interval = timer.interval;
  const secondsLeft = Math.ceil(timer.remainingSeconds);
  const countdown = interval.seconds >= 60 ? formatClock(secondsLeft) : String(secondsLeft);
  // Geist Mono glyphs are about 0.62 em wide: size the digits to fit the width on one line.
  const digitSize = Math.min((width * 0.9) / (countdown.length * 0.62), height * 0.28);
  const showRep = interval.repCount > 1 && interval.phase !== 'rest';

  return (
    <View className="flex-1 bg-background">
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', left: 0, right: 0, bottom: 0, opacity: 0.45 },
          { backgroundColor: THEME[PHASE_COLOR[interval.phase]] },
          fillStyle,
        ]}
      />

      <View
        className="flex-1 px-6"
        style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }}>
        <View className="flex-row items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            accessibilityLabel="End workout"
            onPress={() => {
              if (finished) {
                finish();
              } else {
                timer.pause();
                setConfirmOpen(true);
              }
            }}>
            <Icon as={XIcon} className="size-6" />
          </Button>
          <View className="flex-row gap-1">
            <Button
              variant="ghost"
              size="icon"
              accessibilityLabel={settings.soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
              onPress={() => setSettings({ soundEnabled: !settings.soundEnabled })}>
              <Icon as={settings.soundEnabled ? Volume2Icon : VolumeXIcon} className="size-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              accessibilityLabel={
                settings.vibrationEnabled ? 'Turn vibration off' : 'Turn vibration on'
              }
              onPress={() => setSettings({ vibrationEnabled: !settings.vibrationEnabled })}>
              <Icon
                as={settings.vibrationEnabled ? VibrateIcon : VibrateOffIcon}
                className="size-6"
              />
            </Button>
          </View>
        </View>

        {finished ? (
          <View className="flex-1 justify-center gap-6">
            <View className="gap-2">
              <Text className="text-5xl tracking-tight font-bold">
                {timer.status === 'done' ? 'Done' : 'Ended'}
              </Text>
              <Text className="text-2xl">
                {setsLine(timer.completedSets, timer.totalSets)} ·{' '}
                {formatClock(timer.elapsedSeconds)}
              </Text>
            </View>
            <View className="gap-2">
              <Text variant="muted">Note (optional)</Text>
              <Textarea
                value={note}
                onChangeText={setNote}
                placeholder="How did it feel?"
                numberOfLines={3}
              />
            </View>
            <Button size="lg" onPress={finish}>
              <Text className="text-lg">Finish</Text>
            </Button>
          </View>
        ) : (
          <>
            <View className="mt-6 items-center gap-2">
              <Text className="text-2xl uppercase tracking-wide font-semibold">
                {PHASE_LABEL[interval.phase]}
              </Text>
              <Text className="text-3xl font-semibold">
                Set {interval.setIndex + 1}/{interval.setCount}
                {showRep ? ` · Rep ${interval.repIndex + 1}/${interval.repCount}` : ''}
              </Text>
            </View>

            <View className="flex-1 items-center justify-center">
              <Text
                className="tracking-tight font-bold"
                style={{ fontSize: digitSize, lineHeight: digitSize * 1.1 }}
                accessibilityLiveRegion="polite">
                {countdown}
              </Text>
              {timer.nextInterval && timer.nextInterval.phase !== 'done' ? (
                <Text className="text-xl text-muted-foreground">
                  Next: {PHASE_LABEL[timer.nextInterval.phase]}{' '}
                  {timer.nextInterval.seconds >= 60
                    ? formatClock(timer.nextInterval.seconds)
                    : `${timer.nextInterval.seconds}s`}
                </Text>
              ) : (
                <Text className="text-xl text-muted-foreground">Last one</Text>
              )}
            </View>

            <View className="flex-row items-center justify-center gap-6">
              <Button
                variant="outline"
                size="icon"
                className="h-16 w-16 rounded-full"
                accessibilityLabel="Back"
                onPress={timer.back}>
                <Icon as={SkipBackIcon} className="size-7" />
              </Button>
              <Button
                size="icon"
                className="h-24 w-24 rounded-full"
                accessibilityLabel={timer.status === 'paused' ? 'Resume' : 'Pause'}
                onPress={timer.status === 'paused' ? timer.resume : timer.pause}>
                <Icon as={timer.status === 'paused' ? PlayIcon : PauseIcon} className="size-10" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-16 w-16 rounded-full"
                accessibilityLabel="Skip"
                onPress={timer.skip}>
                <Icon as={SkipForwardIcon} className="size-7" />
              </Button>
            </View>
          </>
        )}
      </View>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this workout?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be saved with the sets you completed so far.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onPress={() => timer.resume()}>
              <Text>Keep going</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={() => timer.end()}>
              <Text>End</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
