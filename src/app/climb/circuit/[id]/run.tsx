import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { useEffect, useMemo, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useLargeText } from '@/hooks/use-large-text';
import { Appear } from '@/components/appear';
import { MoonBoard, boardWidthFor } from '@/components/moon-board';
import { Screen } from '@/components/screen';
import { StatPills } from '@/components/stat-pills';
import { TopBar } from '@/components/top-bar';
import { TriesStepper } from '@/components/tries-stepper';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useBoard } from '@/hooks/use-board';
import { advance, isDone, runSummary, startRun } from '@/lib/moonboard/circuits';
import { DOT } from '@/lib/copy';
import { gradeLabel } from '@/lib/moonboard/grades';
import { light, lightsOff, useLights } from '@/lib/moonboard/lights';
import { makeEntry } from '@/lib/moonboard/logbook';
import { displayName } from '@/lib/moonboard/names';
import { EASE_OUT } from '@/lib/motion';
import { useClimb, useClimbSession } from '@/lib/store/climb';
import { cn } from '@/lib/utils';

/**
 * One problem in the progress bar: done in ink, the one being climbed muted, the rest the bar
 * colour. When a problem is finished the ink runs across it from the left.
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
        'h-1.5 flex-1 overflow-hidden rounded-full',
        state === 'current' ? 'bg-muted' : 'bg-bar'
      )}>
      <Animated.View
        className="h-1.5 w-full rounded-full bg-text"
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
  const { width } = useWindowDimensions();
  const big = useLargeText();
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

  if (!board || !circuit) {
    return (
      <Screen header={<TopBar left="close" />}>
        <Text className="type-hero">This circuit is{'\n'}no longer here.</Text>
      </Screen>
    );
  }
  if (!active) {
    // Opened without a run going (a link, or the app was closed): offer to start one.
    return (
      <Screen
        header={<TopBar left="close" title={circuit.name} />}
        contentClassName="gap-3 pt-10"
        footer={
          <Button
            size="lg"
            disabled={circuit.problemIds.length === 0}
            onPress={() => {
              setRun(startRun(circuit));
              setStartedAt(Date.now());
              setTries(1);
            }}>
            <Icon as={PlayIcon} weight="fill" size={20} className="text-on-action" />
            <Text>Start circuit</Text>
          </Button>
        }>
        <Text className="type-hero">Not started yet</Text>
        <Text className="type-body text-muted">
          Each problem lights up in turn. Every go is logged as you climb, so stopping early loses
          nothing.
        </Text>
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
  const header = <TopBar left="close" title={circuit.name} onLeft={close} />;

  if (isDone(active)) {
    const summary = runSummary(active);
    const hardest = Math.max(
      -1,
      ...results.filter((r) => r.sent).map((r) => r.problem.grade ?? -1)
    );
    return (
      <Screen
        header={header}
        contentClassName="gap-0 pt-6"
        footer={
          <View className="flex-row gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onPress={() => {
                setRun(startRun({ ...circuit, problemIds: active.problemIds }));
                setStartedAt(Date.now());
                setTries(1);
              }}>
              <Text>Again</Text>
            </Button>
            <Button size="lg" className="flex-1" onPress={close}>
              <Text>Done</Text>
            </Button>
          </View>
        }>
        <Appear>
          <View className="size-24 items-center justify-center self-center rounded-[30px] bg-raised">
            <Icon as={CheckCircleIcon} size={44} />
          </View>
        </Appear>
        <View className="mt-6 items-center gap-3">
          <Text className="type-hero" role="heading">
            Circuit done
          </Text>
          <Text className="type-body text-muted">{`${circuit.name}${DOT}saved to your log`}</Text>
        </View>
        <View className="mt-7">
          <StatPills
            compact
            items={[
              { value: `${summary.sent} of ${summary.total}`, label: 'sent' },
              { value: `${minutes} min`, label: 'total' },
              { value: String(summary.tries), label: 'tries' },
              { value: hardest >= 0 ? gradeLabel(hardest, board.scale) : '–', label: 'hardest' },
            ]}
          />
        </View>
        <View className="mt-6">
          {results.map((result, index) => {
            const word = result.sent
              ? result.tries <= 1
                ? 'Flash'
                : `${result.tries} tries`
              : result.tries > 0
                ? 'Not sent'
                : 'Skipped';
            return (
              <View key={`${result.problemId}${index}`} className="h-14 flex-row items-center">
                <Text className="type-row w-[30px] text-muted">{index + 1}</Text>
                <View className="h-full flex-1 flex-row items-center gap-3 border-b border-line">
                  <Text className="type-row flex-1" numberOfLines={1}>
                    {displayName(result.problem.name)}
                  </Text>
                  <Text className={cn('type-sub', !result.sent && 'text-muted')}>{word}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <View>
          {header}
          <Text className="type-caption -mt-3.5 text-center text-muted">
            Problem {active.index + 1} of {active.problemIds.length}
          </Text>
          <View className="w-full max-w-3xl flex-row gap-1 self-center px-6 pb-1 pt-4">
            {active.problemIds.map((problemId, index) => (
              <Segment
                key={`${problemId}${index}`}
                state={index < active.index ? 'done' : index === active.index ? 'current' : 'ahead'}
              />
            ))}
          </View>
        </View>
      }
      contentClassName="gap-0 pt-3.5"
      footer={
        <View className="gap-3">
          <TriesStepper value={tries} onChange={setTries} />
          <View className={big ? 'flex-col-reverse gap-3' : 'flex-row gap-3'}>
            <Button
              variant="outline"
              size="lg"
              className={big ? undefined : 'flex-1 px-2'}
              onPress={() => record(false)}>
              <Text numberOfLines={1}>Not sent, next</Text>
            </Button>
            <Button size="lg" className={big ? undefined : 'flex-1'} onPress={() => record(true)}>
              <Icon as={CheckIcon} size={20} className="text-on-action" />
              <Text>Sent it</Text>
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
          <View className="mt-3 flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text className="type-title" numberOfLines={2}>
                {displayName(problem.name)}
              </Text>
              <Text className="type-caption text-muted">
                {next
                  ? `Next: ${displayName(next.name)}${DOT}${gradeLabel(next.grade, board.scale)}`
                  : 'Last one'}
              </Text>
            </View>
            <Text className="type-num">{gradeLabel(problem.grade, board.scale)}</Text>
          </View>
        </>
      ) : (
        <Text className="type-body text-muted">This problem is no longer here.</Text>
      )}
    </Screen>
  );
}
