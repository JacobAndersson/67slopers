import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useEffect, useMemo, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ButtonLabel } from '@/components/button-label';
import { Appear } from '@/components/appear';
import { HoldLegend, MoonBoard, boardWidthFor } from '@/components/moon-board';
import { ProblemRow } from '@/components/problem-row';
import { Screen } from '@/components/screen';
import { StatPills } from '@/components/stat-pills';
import { TriesStepper } from '@/components/tries-stepper';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useBoard } from '@/hooks/use-board';
import { advance, isDone, runSummary, startRun } from '@/lib/moonboard/circuits';
import { gradeAlt, gradeLabel } from '@/lib/moonboard/grades';
import { light, lightsOff, useLights } from '@/lib/moonboard/lights';
import { makeEntry } from '@/lib/moonboard/logbook';
import { EASE_OUT } from '@/lib/motion';
import { useClimb, useClimbSession } from '@/lib/store/climb';
import { cn } from '@/lib/utils';

/**
 * One problem in the progress bar. The one being climbed is amber; when it is finished the
 * dark fill runs across it from the left.
 */
function Segment({ state }: { state: 'done' | 'current' | 'ahead' }) {
  const reducedMotion = useReducedMotion();
  const done = state === 'done';
  const fill = useSharedValue(done ? 1 : 0);
  useEffect(() => {
    fill.set(
      reducedMotion ? Number(done) : withTiming(Number(done), { duration: 200, easing: EASE_OUT })
    );
  }, [fill, done, reducedMotion]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: fill.get() }] }));
  return (
    <View
      className={cn(
        'h-1 flex-1 overflow-hidden rounded-full',
        state === 'current' ? 'bg-chart-1' : 'bg-border'
      )}>
      <Animated.View
        className="h-1 w-full rounded-full bg-foreground"
        style={[{ transformOrigin: 'left' }, style]}
      />
    </View>
  );
}

/**
 * Climbing a circuit: one problem at a time, each lit by itself, since starting the circuit
 * is the consent to change the wall. Sent it or Skip moves on; every problem is logged as it
 * happens, so stopping early loses nothing.
 */
export default function CircuitRunScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const board = useBoard();
  const circuit = useClimb((s) => s.circuits.find((c) => c.id === id));
  const run = useClimbSession((s) => s.run);
  const setRun = useClimbSession((s) => s.setRun);
  const addEntry = useClimb((s) => s.addEntry);
  const connected = useLights((s) => s.status === 'connected');
  const [tries, setTries] = useState(1);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [minutes, setMinutes] = useState(1);

  const active = run?.circuitId === id ? run : null;
  const problem =
    active && board && !isDone(active) ? board.find(active.problemIds[active.index]) : undefined;
  const next = active && board ? board.find(active.problemIds[active.index + 1] ?? '') : undefined;

  useKeepAwake();

  // Each problem lights as it comes up; the wall goes dark when the circuit ends.
  useEffect(() => {
    if (!connected) return;
    if (problem) light(problem, problem.id);
    else lightsOff();
  }, [connected, problem]);

  const results = useMemo(
    () =>
      active && board
        ? active.results.flatMap((result) => {
            const done = board.find(result.problemId);
            return done ? [{ ...result, problem: done }] : [];
          })
        : [],
    [active, board]
  );

  if (!board || !circuit || !active) {
    return (
      <Screen>
        <Text variant="muted">This circuit is not running.</Text>
        <Button variant="outline" className="self-start" onPress={() => router.back()}>
          <Text>Back</Text>
        </Button>
      </Screen>
    );
  }

  const record = (sent: boolean) => {
    if (!problem) return;
    // A skipped problem that was never tried leaves no trace in the log.
    if (sent || tries > 0) {
      addEntry(makeEntry(problem, board.board, { tries, sent, circuitId: circuit.id }));
    }
    const after = advance(active, { tries: sent ? Math.max(1, tries) : tries, sent });
    if (isDone(after)) setMinutes(Math.max(1, Math.round((Date.now() - startedAt) / 60000)));
    setRun(after);
    setTries(1);
  };
  const close = () => {
    setRun(null);
    router.back();
  };
  const top = { paddingTop: insets.top + 8 };

  if (isDone(active)) {
    const summary = runSummary(active);
    const hardest = Math.max(
      -1,
      ...results.filter((r) => r.sent).map((r) => r.problem.grade ?? -1)
    );
    return (
      <View className="flex-1 bg-background" style={top}>
        <Screen
          footer={
            <View className="flex-row gap-3">
              <Button
                variant="outline"
                size="lg"
                onPress={() => {
                  setRun(startRun({ ...circuit, problemIds: active.problemIds }));
                  setStartedAt(Date.now());
                  setTries(1);
                }}>
                <ButtonLabel>Again</ButtonLabel>
              </Button>
              <Button size="lg" className="flex-1" onPress={close}>
                <ButtonLabel>Done</ButtonLabel>
              </Button>
            </View>
          }>
          <View className="size-[88px] items-center justify-center self-center rounded-[28px] bg-secondary">
            <Icon as={CheckCircleIcon} size={44} />
          </View>
          <View className="items-center gap-1">
            <Text className="text-2xl font-bold">Circuit done</Text>
            <Text variant="muted">{circuit.name} · saved to your log</Text>
          </View>
          <StatPills
            items={[
              { value: `${summary.sent} of ${summary.total}`, label: 'sent' },
              { value: `${minutes} min`, label: 'total' },
              { value: String(summary.tries), label: 'tries' },
              { value: hardest >= 0 ? gradeLabel(hardest, board.scale) : '–', label: 'hardest' },
            ]}
          />
          <View>
            {results.map((result, index) => (
              <ProblemRow
                key={`${result.problemId}${index}`}
                problem={result.problem}
                rows={board.rows}
                scale={board.scale}
                index={index}
                detail={gradeLabel(result.problem.grade, board.scale)}
                right={
                  result.sent
                    ? result.tries <= 1
                      ? 'Flash'
                      : `${result.tries} tries`
                    : result.tries > 0
                      ? 'Not sent'
                      : 'Skipped'
                }
              />
            ))}
          </View>
        </Screen>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={top}>
      <View className="flex-row items-center gap-2 px-4">
        <Button variant="ghost" size="icon" accessibilityLabel="End circuit" onPress={close}>
          <Icon as={XIcon} className="size-6" />
        </Button>
        <View className="flex-1 items-center pr-11">
          <Text className="text-lg font-semibold" numberOfLines={1}>
            {circuit.name}
          </Text>
          <Text className="text-xs text-muted-foreground font-medium">
            Problem {active.index + 1} of {active.problemIds.length}
          </Text>
        </View>
      </View>
      <View className="w-full max-w-3xl flex-row gap-1.5 self-center px-6 pt-2">
        {active.problemIds.map((problemId, index) => (
          <Segment
            key={`${problemId}${index}`}
            state={index < active.index ? 'done' : index === active.index ? 'current' : 'ahead'}
          />
        ))}
      </View>
      <Screen
        footer={
          <View className="gap-3">
            <TriesStepper value={tries} onChange={setTries} />
            <View className="flex-row gap-3">
              <Button variant="outline" size="lg" onPress={() => record(false)}>
                <ButtonLabel>Skip</ButtonLabel>
              </Button>
              <Button size="lg" className="flex-1" onPress={() => record(true)}>
                <Icon as={CheckIcon} className="size-5 text-primary-foreground" />
                <ButtonLabel>Sent it</ButtonLabel>
              </Button>
            </View>
          </View>
        }>
        {problem ? (
          <>
            {/* Each new problem fades in, so the wall on screen never just swaps. */}
            <Appear key={problem.id} rise={0} duration={160}>
              <MoonBoard
                width={boardWidthFor(width)}
                rows={board.rows}
                holds={problem}
                lit={connected}
              />
            </Appear>
            <HoldLegend />
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-1">
                <Text className="text-xl font-bold">{problem.name}</Text>
                <Text className="text-xs text-muted-foreground font-medium">
                  {next
                    ? `Next: ${next.name} · ${gradeLabel(next.grade, board.scale)}`
                    : 'Last one'}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-2xl font-bold">{gradeLabel(problem.grade, board.scale)}</Text>
                <Text className="text-xs text-muted-foreground font-medium">
                  {gradeAlt(problem.grade, board.scale)}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <Text variant="muted">This problem is no longer here.</Text>
        )}
      </Screen>
    </View>
  );
}
