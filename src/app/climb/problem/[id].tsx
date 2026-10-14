import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { BluetoothSlashIcon } from 'phosphor-react-native/src/icons/BluetoothSlash';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { HeartIcon } from 'phosphor-react-native/src/icons/Heart';
import { LightbulbIcon } from 'phosphor-react-native/src/icons/Lightbulb';
import { ListPlusIcon } from 'phosphor-react-native/src/icons/ListPlus';
import { QrCodeIcon } from 'phosphor-react-native/src/icons/QrCode';
import { SealCheckIcon } from 'phosphor-react-native/src/icons/SealCheck';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Platform, Pressable, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ButtonLabel } from '@/components/button-label';
import { Appear } from '@/components/appear';
import { CircuitSheet } from '@/components/circuit-sheet';
import { LogSendSheet } from '@/components/log-send-sheet';
import { HoldLegend, MoonBoard } from '@/components/moon-board';
import { formatSends } from '@/components/problem-row';
import { Screen } from '@/components/screen';
import { StatPills } from '@/components/stat-pills';
import { TriesStepper } from '@/components/tries-stepper';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useArmed } from '@/hooks/use-armed';
import { useBoard } from '@/hooks/use-board';
import { relativeDay } from '@/lib/dates';
import { filterProblems } from '@/lib/moonboard/filter';
import { gradeAlt, gradeLabel } from '@/lib/moonboard/grades';
import { light, lightsOff, useLights } from '@/lib/moonboard/lights';
import { entriesFor, entryLabel, makeEntry, statusLabel } from '@/lib/moonboard/logbook';
import type { Feet } from '@/lib/moonboard/types';
import { useClimb, useClimbSession } from '@/lib/store/climb';

const KEEP_AWAKE = 'moonboard-lit';
const FEET_LABEL: Record<Feet, string> = {
  any: 'feet on any holds',
  follow: 'feet follow hands',
  footless: 'footless',
};
/** Past this distance (px) or speed (px/s) a drag moves to the neighbouring problem. */
const SWIPE_DISTANCE = 80;
const SWIPE_SPEED = 500;

/**
 * One problem: the wall with its holds ringed, then either Light up and Log send, or, while
 * it is lit, a tries counter and Sent it. Dragging the board left or right moves through the
 * list.
 */
export default function ProblemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const board = useBoard();
  const filter = useClimbSession((s) => s.filter);
  const log = useClimb((s) => s.log);
  const savedIds = useClimb((s) => s.saved);
  const saved = savedIds.includes(id);
  const toggleSaved = useClimb((s) => s.toggleSaved);
  const tries = useClimbSession((s) => s.tries[id] ?? 0);
  const setTries = useClimbSession((s) => s.setTries);
  const addEntry = useClimb((s) => s.addEntry);
  // The climber's own record of the problem, for what a benchmark does not have.
  const own = useClimb((s) => s.custom.find((p) => p.id === id));
  const deleteCustom = useClimb((s) => s.deleteCustom);
  const deleteEntry = useClimb((s) => s.deleteEntry);
  const browse = useClimb((s) => s.lights.browse);
  const status = useLights((s) => s.status);
  const lit = useLights((s) => s.lit === id);
  const [logging, setLogging] = useState(false);
  const [adding, setAdding] = useState(false);
  // Deleting the problem or one log entry takes a second tap; `armed` says which is waiting.
  const { armed, fire } = useArmed<string>();
  const reducedMotion = useReducedMotion();
  const dragX = useSharedValue(0);
  useLayoutEffect(() => {
    dragX.set(0);
  }, [dragX, id]);

  const problem = board?.find(id);
  const list = useMemo(
    () =>
      board
        ? filterProblems(board.problems, filter, board.setup.holdSets, board.status, savedIds)
        : [],
    [board, filter, savedIds]
  );
  const index = list.findIndex((p) => p.id === id);
  const history = useMemo(() => entriesFor(log, id), [log, id]);
  const connected = status === 'connected';
  const carouselWidth = Math.min(width - 48, 720);
  const boardWidth = Math.min(carouselWidth - 8, 680);
  const boardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -carouselWidth + dragX.get() }],
  }));

  // The phone is on the floor while the problem is lit: the screen must not sleep.
  useEffect(() => {
    if (!lit) return;
    activateKeepAwakeAsync(KEEP_AWAKE).catch(() => {});
    return () => {
      deactivateKeepAwake(KEEP_AWAKE).catch(() => {});
    };
  }, [lit]);

  if (!board || !problem) {
    return (
      <Screen>
        <Text variant="muted">This problem is no longer here.</Text>
        <Button variant="outline" className="self-start" onPress={() => router.back()}>
          <Text>Back</Text>
        </Button>
      </Screen>
    );
  }

  const go = (step: number) => {
    const next = list[index + step];
    if (index < 0 || !next) return;
    // Browsing only changes the wall when the climber asked for that.
    if (connected && browse) light(next, next.id);
    // Updating the dynamic segment keeps this screen mounted and avoids a native stack push.
    router.setParams({ id: next.id });
  };
  const hasPrevious = index > 0;
  const hasNext = index >= 0 && index < list.length - 1;
  // The neighbouring walls are mounted before the finger moves, so the wall follows immediately.
  const neighbours = [
    hasPrevious ? list[index - 1] : null,
    problem,
    hasNext ? list[index + 1] : null,
  ];
  // A vertical movement still belongs to Screen's scroll view.
  const swipe = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-16, 16])
    .onChange((event) => {
      const free = event.translationX < 0 ? hasNext : hasPrevious;
      if (!reducedMotion) dragX.set(free ? event.translationX : event.translationX / 4);
    })
    .onEnd((event) => {
      const far =
        Math.abs(event.translationX) > SWIPE_DISTANCE || Math.abs(event.velocityX) > SWIPE_SPEED;
      const step = event.translationX < 0 ? 1 : -1;
      if (far && (step > 0 ? hasNext : hasPrevious)) {
        if (reducedMotion) {
          dragX.set(0);
          runOnJS(go)(step);
        } else {
          dragX.set(
            withSpring(-step * carouselWidth, { duration: 400, dampingRatio: 1 }, (finished) => {
              if (finished) runOnJS(go)(step);
            })
          );
        }
      } else {
        dragX.set(withSpring(0, { duration: 400, dampingRatio: 0.8, velocity: event.velocityX }));
      }
    });
  const state = statusLabel(board.status.get(problem.id));

  const footer = lit ? (
    <View className="gap-3">
      <TriesStepper value={tries} onChange={(value) => setTries(problem.id, value)} />
      <View className="flex-row gap-3">
        <Button variant="outline" size="lg" onPress={() => lightsOff()}>
          <ButtonLabel>Lights off</ButtonLabel>
        </Button>
        <Button size="lg" className="flex-1" onPress={() => setLogging(true)}>
          <Icon as={CheckIcon} className="size-5 text-primary-foreground" />
          <ButtonLabel>Sent it</ButtonLabel>
        </Button>
      </View>
    </View>
  ) : (
    <View className="flex-row gap-3">
      <Button variant="outline" size="lg" onPress={() => setLogging(true)}>
        <ButtonLabel>Log send</ButtonLabel>
      </Button>
      <Button
        size="lg"
        className="flex-1"
        onPress={() => (connected ? light(problem, problem.id) : router.push('/climb/connect'))}>
        <Icon as={LightbulbIcon} className="size-5 text-primary-foreground" />
        <ButtonLabel>Light up</ButtonLabel>
      </Button>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: lit ? 'Lit on the wall' : index >= 0 ? `${index + 1} of ${list.length}` : '',
          headerRight: () => (
            <View className="flex-row">
              <Button
                variant="ghost"
                size="icon"
                accessibilityLabel="Add to circuit"
                onPress={() => setAdding(true)}>
                <Icon as={ListPlusIcon} className="size-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                accessibilityLabel={saved ? 'Remove from saved' : 'Save'}
                onPress={() => toggleSaved(problem.id)}>
                <Icon
                  as={HeartIcon}
                  weight={saved ? 'fill' : 'regular'}
                  className={saved ? 'size-6 text-destructive' : 'size-6'}
                />
              </Button>
            </View>
          ),
        }}
      />
      <Screen footer={footer}>
        {status === 'reconnecting' ? (
          <Appear rise={-8} duration={250}>
            <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-accent px-4 py-3">
              <Icon as={BluetoothSlashIcon} size={22} />
              <Text className="flex-1 text-sm font-medium">Lights dropped. Reconnecting</Text>
            </View>
          </Appear>
        ) : null}
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1.5">
            <Text className="text-xl font-bold">{problem.name}</Text>
            <View className="flex-row items-center gap-1.5">
              {problem.custom ? null : (
                <Icon as={SealCheckIcon} size={16} weight="fill" className="text-ring" />
              )}
              <Text className="text-xs text-muted-foreground font-medium">
                {own
                  ? `Set by you · ${FEET_LABEL[own.feet]}`
                  : `Benchmark · set by ${problem.setter}`}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-2xl font-bold">{gradeLabel(problem.grade, board.scale)}</Text>
            <Text className="text-xs text-muted-foreground font-medium">
              {gradeAlt(problem.grade, board.scale)}
            </Text>
          </View>
        </View>

        <GestureDetector gesture={swipe}>
          <View className="self-center overflow-hidden" style={{ width: carouselWidth }}>
            <Animated.View className="flex-row" style={boardStyle}>
              {neighbours.map((item, position) => (
                <View key={position} className="items-center" style={{ width: carouselWidth }}>
                  {item ? (
                    <MoonBoard
                      width={boardWidth}
                      rows={board.rows}
                      holds={item}
                      lit={item.id === problem.id && lit}
                    />
                  ) : null}
                </View>
              ))}
            </Animated.View>
          </View>
        </GestureDetector>
        <HoldLegend />

        {state ? (
          // Keyed by what it says, so a fresh send lands with a small beat.
          <Appear key={state}>
            <View className="flex-row items-center gap-3 rounded-2xl bg-secondary px-4 py-3">
              {board.status.get(problem.id)?.sent ? (
                <Icon as={CheckCircleIcon} size={22} weight="fill" />
              ) : null}
              <Text className="font-semibold">{state}</Text>
            </View>
          </Appear>
        ) : null}

        {problem.sends !== undefined ? (
          <StatPills
            items={[
              { value: formatSends(problem.sends), label: 'sends' },
              { value: problem.stars?.toFixed(1) ?? '–', label: 'stars' },
              { value: problem.tries?.toFixed(1) ?? '–', label: 'avg tries' },
            ]}
          />
        ) : null}

        {history.length > 0 ? (
          <View className="gap-2 pt-2">
            <Text variant="h4">Your log</Text>
            {history.map((entry) => (
              <View
                key={entry.id}
                className="flex-row items-center gap-3 border-b border-border py-3">
                {entry.sent ? (
                  <Icon as={CheckCircleIcon} size={20} weight="fill" className="text-hold-start" />
                ) : (
                  <View className="mx-1 size-3 rounded-full border-2 border-input" />
                )}
                <Text className="flex-1 text-sm font-medium">
                  {entryLabel(entry)}
                  {entry.felt ? ` · felt ${entry.felt}` : ''}
                  {entry.stars ? ` · ${entry.stars}★` : ''}
                  {entry.note ? ` · ${entry.note}` : ''}
                </Text>
                <Text className="text-xs text-muted-foreground font-medium">
                  {relativeDay(entry.at)}
                </Text>
                <Pressable
                  onPress={() => fire(entry.id, () => deleteEntry(entry.id))}
                  accessibilityRole="button"
                  accessibilityLabel={
                    armed === entry.id ? 'Tap again to delete' : 'Delete this entry'
                  }
                  hitSlop={10}>
                  <Icon
                    as={TrashIcon}
                    size={18}
                    className={armed === entry.id ? 'text-destructive' : 'text-muted-foreground'}
                  />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {own?.note ? <Text variant="muted">{own.note}</Text> : null}
        {problem.custom ? (
          <View className="flex-row gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onPress={() => router.push(`/climb/share/${problem.id}`)}>
              <Icon as={QrCodeIcon} className="size-5" />
              <Text>Share</Text>
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onPress={() =>
                fire('problem', () => {
                  deleteCustom(problem.id);
                  router.back();
                })
              }>
              <Text className="text-destructive">
                {armed === 'problem' ? 'Tap again' : 'Delete'}
              </Text>
            </Button>
          </View>
        ) : null}
      </Screen>

      <LogSendSheet
        open={logging}
        onClose={() => setLogging(false)}
        tries={tries}
        onSave={(result) => {
          addEntry(makeEntry(problem, board.board, result));
          if (result.sent && Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          }
          setLogging(false);
        }}
      />
      <CircuitSheet
        open={adding}
        onClose={() => setAdding(false)}
        problemId={problem.id}
        board={board.board}
      />
    </>
  );
}
