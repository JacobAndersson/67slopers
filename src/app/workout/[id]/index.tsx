import { useLocalSearchParams, useRouter } from 'expo-router';
import { CopyIcon } from 'phosphor-react-native/src/icons/Copy';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { QrCodeIcon } from 'phosphor-react-native/src/icons/QrCode';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/card';
import { WorkoutTimeline } from '@/components/data-bars';
import { HangboardDiagram } from '@/components/hangboard-diagram';
import { MetricGrid } from '@/components/metric-grid';
import { MissingWorkout } from '@/components/missing-workout';
import { Screen } from '@/components/screen';
import { Label, LargeTitle, SectionHeader } from '@/components/section-header';
import { StepList, StepListBoardProvider } from '@/components/step-list';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { firstGrip } from '@/lib/workout-grip';
import { getBoard } from '@/lib/boards';
import { DOT, LABEL_DOT, shortDay } from '@/lib/copy';
import { formatClock } from '@/lib/dates';
import { mark } from '@/lib/perf';
import { lastSessionForWorkout } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/store';
import type { Feel } from '@/lib/store/types';
import { holdsInWorkout, withIds } from '@/lib/workout-steps';
import { workoutFacts } from '@/lib/workout-summary';
import { workoutShape } from '@/lib/workout-shape';
import { overviewLine } from '@/lib/workout-words';

const FELT: Record<Feel, string> = { weak: 'Off day', normal: 'Felt solid', strong: 'Felt strong' };

/**
 * One workout (design: builder-overview): what it is for, its numbers, the board with the grips
 * it uses, its shape and its steps read-only, then Duplicate and Share. Start is pinned below.
 */
export default function WorkoutOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const workout = useStore((s) => s.workouts.find((w) => w.id === id));
  const sessions = useStore((s) => s.sessions);
  const duplicateWorkout = useStore((s) => s.duplicateWorkout);
  const last = useMemo(
    () => (id ? lastSessionForWorkout(sessions, id) : undefined),
    [sessions, id]
  );
  const steps = useMemo(() => (workout ? withIds(workout.steps) : []), [workout]);
  const facts = useMemo(() => (workout ? workoutFacts(workout) : null), [workout]);
  const shape = useMemo(() => (workout ? workoutShape(workout) : []), [workout]);

  if (!workout || !facts) return <MissingWorkout />;

  const board = getBoard(workout.board);
  const grip = firstGrip(workout);
  const holds = holdsInWorkout(workout.steps);

  return (
    <Screen
      header={
        <TopBar
          right={
            <Button
              variant="outline"
              size="sm"
              className="w-[84px] px-0"
              onPress={() => router.push(`/workout/${workout.id}/edit`)}>
              <Text>Edit</Text>
            </Button>
          }
        />
      }
      contentClassName="gap-0"
      footer={
        <Button
          size="lg"
          onPress={() => {
            mark('start');
            router.push(`/workout/${workout.id}/run`);
          }}>
          <Icon as={PlayIcon} weight="fill" size={22} className="text-on-action" />
          <Text>Start workout</Text>
        </Button>
      }>
      <LargeTitle title={workout.name} />
      {workout.description ? (
        <Text selectable className="type-body mt-2 text-muted">
          {workout.description}
        </Text>
      ) : null}

      <MetricGrid
        className="mt-6"
        items={[
          { label: 'Total time', value: formatClock(facts.seconds) },
          { label: 'Time hanging', value: formatClock(facts.hangSeconds) },
          { label: 'Sets', value: String(facts.sets) },
          { label: 'Hangs', value: String(facts.hangs) },
        ]}
      />

      {board ? (
        <Card className="mt-4 px-6 pb-5 pt-6">
          <Label>{[board.name, grip].filter(Boolean).join(LABEL_DOT)}</Label>
          <HangboardDiagram
            board={board.id}
            active={holds}
            style={{ marginTop: 16 }}
            accessibilityLabel={`${board.name}, the grips this workout uses`}
          />
        </Card>
      ) : null}

      <SectionHeader title="The workout" className="mt-8" />
      <Text className="type-sub mt-1.5 text-muted">{overviewLine(workout)}</Text>
      <WorkoutTimeline pieces={shape} className="mb-5 mt-4" />
      <StepListBoardProvider board={board}>
        <StepList steps={steps} depth={0} />
      </StepListBoardProvider>

      <View className="mt-4 flex-row gap-3">
        <Button
          variant="outline"
          className="flex-1 px-2"
          onPress={() => {
            const copy = duplicateWorkout(workout.id);
            if (!copy) return;
            // Push the copy then its editor, so Save returns to the copy. Two pushes
            // queue in order; replace+push in the same tick raced and could drop Edit.
            router.push(`/workout/${copy.id}`);
            router.push(`/workout/${copy.id}/edit`);
          }}>
          <Icon as={CopyIcon} size={20} />
          <Text>Duplicate</Text>
        </Button>
        <Button
          variant="outline"
          className="flex-1 px-2"
          onPress={() => router.push(`/workout/${workout.id}/share`)}>
          <Icon as={QrCodeIcon} size={20} />
          <Text>Share</Text>
        </Button>
      </View>

      <Text className="type-sub mt-6 text-muted">
        {last
          ? `Last done ${shortDay(last.completedAt).toLowerCase()}${DOT}${last.completedSets}/${last.totalSets} sets`
          : 'Not done yet'}
      </Text>
      {last?.feel ? (
        <View className="mt-2.5 h-9 justify-center self-start rounded-full bg-raised px-4">
          <Text className="text-sm font-bold">{FELT[last.feel]}</Text>
        </View>
      ) : null}
    </Screen>
  );
}
