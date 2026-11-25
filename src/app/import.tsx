import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowUpIcon } from 'phosphor-react-native/src/icons/ArrowUp';
import { PaperPlaneTiltIcon } from 'phosphor-react-native/src/icons/PaperPlaneTilt';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { QrCodeIcon } from 'phosphor-react-native/src/icons/QrCode';
import { useMemo } from 'react';
import { Platform, View } from 'react-native';

import { Card } from '@/components/card';
import { WorkoutTimeline } from '@/components/data-bars';
import { MissingScreen } from '@/components/missing-screen';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { StepList, StepListBoardProvider } from '@/components/step-list';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { getBoard } from '@/lib/boards';
import { formatClock } from '@/lib/dates';
import { useStore } from '@/lib/store/store';
import { CODEC_ERRORS, decodeWorkout } from '@/lib/workout-codec';
import { workoutShape } from '@/lib/workout-shape';
import { sameTimings, withIds } from '@/lib/workout-steps';
import { workoutFacts } from '@/lib/workout-summary';
import { overviewLine } from '@/lib/workout-words';

/**
 * A workout from a scanned or linked code (design: share-import, share-import-have, and the
 * bad-code and newer states). Everything it needs is in the code, so it shows at once, offline;
 * nothing is saved until the climber chooses to.
 */
export default function ImportScreen() {
  const { code = '' } = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();
  const workouts = useStore((s) => s.workouts);
  const addWorkout = useStore((s) => s.addWorkout);
  const setDraft = useStore((s) => s.setDraft);
  const result = useMemo(() => decodeWorkout(code), [code]);
  const steps = useMemo(() => (result.ok ? withIds(result.steps) : []), [result]);
  // One expansion per code, not per render.
  const decoded = useMemo(() => {
    if (!result.ok) return null;
    const timings = { ...(result.board ? { board: result.board } : {}), steps: result.steps };
    return { timings, facts: workoutFacts(timings), shape: workoutShape(timings) };
  }, [result]);
  const scanAgain = () => router.replace(Platform.OS === 'web' ? '/' : '/scan');

  if (!result.ok) {
    return result.error === CODEC_ERRORS.needsUpdate ? (
      <MissingScreen
        icon={ArrowUpIcon}
        title={'This needs a newer\nversion of Rivet.'}
        body="Update Rivet, then scan the code again."
        action="Scan again"
        onAction={scanAgain}
      />
    ) : (
      <MissingScreen
        icon={QrCodeIcon}
        slashed
        title={'That isn’t\na Rivet code.'}
        body="Rivet only reads its own workout and problem codes."
        action="Scan again"
        onAction={scanAgain}
      />
    );
  }

  const name = result.name ?? 'Shared workout';
  const board = getBoard(result.board);
  const { timings, facts, shape } = decoded!;
  const saved = workouts.find((w) => w.name === name && sameTimings(w, timings));

  return (
    <Screen
      header={<TopBar title="Shared workout" />}
      contentClassName="gap-0"
      footer={
        <View className="flex-row gap-3">
          <Button
            size="lg"
            variant="outline"
            className="flex-1"
            onPress={() => {
              setDraft({ name: result.name, timings });
              router.replace('/workout/run');
            }}>
            <Icon as={PlayIcon} size={20} />
            <Text>Start</Text>
          </Button>
          <Button
            size="lg"
            className="flex-1 px-3"
            onPress={() => {
              const workout =
                saved ??
                addWorkout({
                  name,
                  ...(result.description ? { description: result.description } : {}),
                  ...timings,
                });
              router.replace(`/workout/${workout.id}`);
            }}>
            <Text numberOfLines={1}>{saved ? 'Open my copy' : 'Save'}</Text>
          </Button>
        </View>
      }>
      <Text selectable className="type-large" role="heading">
        {name}
      </Text>
      <View className="mt-4 min-h-16 flex-row items-center gap-3 rounded-[20px] bg-raised px-4 py-3">
        <Icon as={PaperPlaneTiltIcon} size={22} />
        <Text className="type-caption flex-1 text-sm">
          {saved
            ? 'You already have this workout.'
            : 'Shared with you. Keep it, or start it without saving.'}
        </Text>
      </View>
      {result.description ? (
        <Text className="type-body mt-5 text-muted">{result.description}</Text>
      ) : null}

      <Card className="mt-5 flex-row px-6 py-5">
        {[
          ['Total time', formatClock(facts.seconds)],
          ['Hangs', String(facts.hangs)],
          ['Sets', String(facts.sets)],
        ].map(([label, value], i) => (
          <View key={label} className={i < 2 ? 'w-[110px] gap-1' : 'flex-1 gap-1'}>
            <Text className="type-caption text-muted">{label}</Text>
            <Text className="type-bignum text-[28px] leading-[30px]">{value}</Text>
          </View>
        ))}
      </Card>

      <SectionHeader title="The workout" className="mt-7" />
      <Text className="type-sub mt-1 text-muted">{overviewLine(timings)}</Text>
      <WorkoutTimeline pieces={shape} height={12} className="mt-4" />
      <View className="mt-5">
        <StepListBoardProvider board={board}>
          <StepList steps={steps} depth={0} />
        </StepListBoardProvider>
      </View>
    </Screen>
  );
}
