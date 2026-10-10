import { useRouter } from 'expo-router';
import { BluetoothIcon } from 'phosphor-react-native/src/icons/Bluetooth';
import { CaretDownIcon } from 'phosphor-react-native/src/icons/CaretDown';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { SlidersHorizontalIcon } from 'phosphor-react-native/src/icons/SlidersHorizontal';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, ScrollView, View } from 'react-native';

import { ButtonLabel } from '@/components/button-label';
import { Chip } from '@/components/chip';
import { FiltersSheet } from '@/components/filters-sheet';
import { MoonBoard, ProblemThumb } from '@/components/moon-board';
import { ProblemRow } from '@/components/problem-row';
import { Screen, useTabContentStyle } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { TabHeader } from '@/components/tab-header';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useBoard } from '@/hooks/use-board';
import { boardLabel, getHoldSet, getLayout } from '@/lib/moonboard/boards';
import { circuitGrades, circuitProblems, startRun } from '@/lib/moonboard/circuits';
import {
  DEFAULT_FILTER,
  SORTS,
  activeFilterCount,
  filterProblems,
  gradeRange,
  hiddenByHoldSets,
  type ProblemTab,
} from '@/lib/moonboard/filter';
import { gradeRangeLabel } from '@/lib/moonboard/grades';
import { autoConnect, useLights } from '@/lib/moonboard/lights';
import { sampleProblem } from '@/lib/moonboard/problems';
import type { Circuit, Problem } from '@/lib/moonboard/types';
import { useClimb, useClimbSession } from '@/lib/store/climb';

const TABS: { id: ProblemTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'projects', label: 'Projects' },
  { id: 'sent', label: 'Sent' },
  { id: 'saved', label: 'Saved' },
  { id: 'mine', label: 'Mine' },
];
/** What an empty tab says about itself. */
const EMPTY: Record<ProblemTab, string> = {
  all: 'Try a wider grade range or another search.',
  projects: 'Problems you have tried but not sent show up here.',
  sent: 'Problems you have sent show up here.',
  saved: 'Tap the heart on a problem to keep it here.',
  mine: '',
};

/** Before a board: what Climb is, and the way in. Nothing is asked for until then. */
function ClimbIntro() {
  const router = useRouter();
  // A real benchmark, to show what the tab is for before a board is set up.
  const sample = sampleProblem('2019-40');
  return (
    <Screen tab>
      <TabHeader title="Climb" />
      <View className="items-center gap-4 pt-2">
        <MoonBoard width={170} rows={18} holds={sample} labels={false} />
        <Text className="text-center text-2xl font-bold">Your MoonBoard, offline</Text>
        <Text variant="muted" className="max-w-xs text-center">
          1,960 benchmarks on this phone. Light them up over Bluetooth. No account.
        </Text>
      </View>
      <Button size="lg" onPress={() => router.push('/climb/setup')}>
        <ButtonLabel>Set up your board</ButtonLabel>
      </Button>
    </Screen>
  );
}

function CircuitCard({
  circuit,
  problems,
  rows,
  range,
}: {
  circuit: Circuit;
  problems: Problem[];
  rows: number;
  range: string | null;
}) {
  const router = useRouter();
  const setRun = useClimbSession((s) => s.setRun);
  const done = useClimb((s) => s.log.some((e) => e.circuitId === circuit.id));
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <Pressable
        onPress={() => router.push(`/climb/circuit/${circuit.id}`)}
        accessibilityRole="button"
        className="flex-1 gap-2 active:opacity-70">
        <Text className="text-lg font-semibold" numberOfLines={1}>
          {circuit.name}
        </Text>
        <Text className="text-xs text-muted-foreground font-medium">
          {problems.length} {problems.length === 1 ? 'problem' : 'problems'}
          {range ? ` · ${range}` : ''}
          {done ? '' : ' · not done yet'}
        </Text>
        <View className="flex-row gap-2">
          {problems.slice(0, 6).map((problem) => (
            <ProblemThumb key={problem.id} holds={problem} rows={rows} width={30} />
          ))}
        </View>
      </Pressable>
      <Button
        size="icon"
        className="size-12 rounded-full"
        disabled={problems.length === 0}
        accessibilityLabel={`Start ${circuit.name}`}
        onPress={() => {
          setRun(startRun({ ...circuit, problemIds: problems.map((p) => p.id) }));
          router.push(`/climb/circuit/${circuit.id}/run`);
        }}>
        <Icon as={PlayIcon} weight="fill" className="size-5 text-primary-foreground" />
      </Button>
    </View>
  );
}

/** The Climb tab: every problem for the wall, filtered, or the climber's circuits. */
export default function ClimbScreen() {
  const router = useRouter();
  const padding = useTabContentStyle();
  const board = useBoard();
  const filter = useClimbSession((s) => s.filter);
  const saved = useClimb((s) => s.saved);
  const setFilter = useClimbSession((s) => s.setFilter);
  const circuits = useClimb((s) => s.circuits);
  const addCircuit = useClimb((s) => s.addCircuit);
  const connected = useLights((s) => s.status === 'connected');
  const [view, setView] = useState<'problems' | 'circuits'>('problems');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (board) autoConnect();
    // Once per visit to the tab with a board, not on every list change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!board]);

  const shown = useMemo(
    () =>
      board
        ? filterProblems(board.problems, filter, board.setup.holdSets, board.status, saved)
        : [],
    [board, filter, saved]
  );
  const bounds = useMemo(
    () => (board ? gradeRange(board.problems) : ([0, 0] as [number, number])),
    [board]
  );
  const mine = useMemo(() => circuits.filter((c) => c.board === board?.board), [circuits, board]);
  if (!board) return <ClimbIntro />;

  const changed = activeFilterCount(filter, bounds);
  const hidden =
    shown.length === 0
      ? hiddenByHoldSets(board.problems, filter, board.setup.holdSets, board.status, saved)
      : 0;
  const missing = getLayout(board.setup.layout).holdSets.filter(
    (id) => !board.setup.holdSets.includes(id)
  );
  const summary = `${gradeRangeLabel(Math.max(filter.gradeMin, bounds[0]), Math.min(filter.gradeMax, bounds[1]), board.scale)} · ${SORTS.find((s) => s.id === filter.sort)!.label.toLowerCase()}`;

  const header = (
    <View className="gap-3 pb-3">
      <View className="min-h-11 flex-row items-center justify-between gap-3">
        <Pressable
          onPress={() => router.push('/climb/board')}
          accessibilityRole="button"
          accessibilityLabel={`${boardLabel(board.setup)}. Board settings`}
          className="flex-1 flex-row items-center gap-1.5 active:opacity-70">
          <Text className="text-lg font-semibold" numberOfLines={1}>
            {boardLabel(board.setup)}
          </Text>
          <Icon as={CaretDownIcon} size={16} />
        </Pressable>
        {connected ? (
          <Chip
            label="Lit"
            dotClassName="bg-hold-start"
            accessibilityLabel="Board lights, connected"
            onPress={() => router.push('/climb/lights')}
          />
        ) : (
          <Chip
            label="Connect"
            icon={BluetoothIcon}
            accessibilityLabel="Connect the board lights"
            onPress={() => router.push('/climb/connect')}
          />
        )}
      </View>
      <Segmented
        options={[
          { value: 'problems', label: 'Problems' },
          { value: 'circuits', label: 'Circuits' },
        ]}
        value={view}
        onChange={setView}
      />
      {view === 'problems' ? (
        <>
          <View className="flex-row gap-2">
            <View className="flex-1 justify-center">
              <Input
                value={filter.query}
                onChangeText={(query) => setFilter({ query })}
                placeholder="Search name or setter"
                accessibilityLabel="Search problems"
                autoCorrect={false}
                returnKeyType="search"
                className="h-12 rounded-xl border-border bg-card pl-11 sm:h-12"
              />
              <View pointerEvents="none" className="absolute left-3.5">
                <Icon as={MagnifyingGlassIcon} size={20} className="text-muted-foreground" />
              </View>
            </View>
            <Button
              variant="outline"
              size="icon"
              className="size-12 rounded-xl bg-card"
              accessibilityLabel={changed ? `Filters, ${changed} changed` : 'Filters'}
              onPress={() => setFiltersOpen(true)}>
              <Icon as={SlidersHorizontalIcon} size={22} />
              {changed ? (
                <View className="absolute -right-1.5 -top-1.5 size-5 items-center justify-center rounded-full border-2 border-background bg-primary">
                  <Text className="text-[10px] leading-3 text-primary-foreground font-bold">
                    {changed}
                  </Text>
                </View>
              ) : null}
            </Button>
          </View>
          {/* Five chips do not fit a phone: the row scrolls, out to the screen edges. */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            className="-mx-6"
            contentContainerClassName="gap-2 px-6">
            {TABS.map((tab) => (
              <Chip
                key={tab.id}
                label={tab.label}
                selected={filter.tab === tab.id}
                onPress={() => setFilter({ tab: tab.id })}
              />
            ))}
          </ScrollView>
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted-foreground font-medium">
              {filter.tab === 'mine' ? 'Set on this board' : summary}
            </Text>
            <Text className="text-xs text-muted-foreground font-medium">
              {shown.length} {shown.length === 1 ? 'problem' : 'problems'}
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );

  const setOne = (
    <View className="gap-3 pt-3">
      <Pressable
        onPress={() => router.push('/climb/new')}
        accessibilityRole="button"
        className="h-16 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-input active:opacity-70">
        <Icon as={PlusIcon} size={22} />
        <Text className="font-semibold">Set a problem</Text>
      </Pressable>
      {Platform.OS === 'web' ? null : (
        <Button variant="ghost" onPress={() => router.push('/scan')}>
          <Text>Or scan one from a friend</Text>
        </Button>
      )}
    </View>
  );

  const empty =
    filter.tab === 'mine' ? null : (
      <View className="items-center gap-3 px-4 pt-10">
        <View className="size-20 items-center justify-center rounded-3xl bg-muted">
          <Icon as={MagnifyingGlassIcon} size={36} />
        </View>
        <Text className="text-center text-xl font-semibold">
          {hidden > 0 ? 'Nothing here with your holds' : 'Nothing matches'}
        </Text>
        <Text variant="muted" className="text-center">
          {hidden > 0
            ? `${hidden} ${hidden === 1 ? 'problem needs' : 'problems need'} ${missing.map((id) => getHoldSet(id).name).join(' or ')}.`
            : EMPTY[filter.tab]}
        </Text>
        {changed || filter.query ? (
          <Button
            variant="outline"
            onPress={() => setFilter({ ...DEFAULT_FILTER, tab: filter.tab })}>
            <Text>Clear filters</Text>
          </Button>
        ) : null}
        {hidden > 0 ? (
          <Button variant="ghost" onPress={() => router.push('/climb/board')}>
            <Text>Add a hold set</Text>
          </Button>
        ) : null}
      </View>
    );

  // One handler for every row, so a change elsewhere does not re-render the whole list.
  const openProblem = (problem: Problem) => router.push(`/climb/problem/${problem.id}`);

  return (
    <View className="flex-1 bg-background">
      {view === 'problems' ? (
        <FlatList
          data={shown}
          keyExtractor={(problem) => problem.id}
          renderItem={({ item }) => (
            <ProblemRow
              problem={item}
              rows={board.rows}
              scale={board.scale}
              status={board.status.get(item.id)}
              onPress={openProblem}
            />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          ListFooterComponent={filter.tab === 'mine' ? setOne : null}
          contentContainerStyle={padding}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={8}
          windowSize={9}
        />
      ) : (
        <FlatList
          data={mine}
          keyExtractor={(circuit) => circuit.id}
          renderItem={({ item }) => {
            const problems = circuitProblems(item, board.find);
            const grades = circuitGrades(problems);
            return (
              <CircuitCard
                circuit={item}
                problems={problems}
                rows={board.rows}
                range={grades ? gradeRangeLabel(grades[0], grades[1], board.scale) : null}
              />
            );
          }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <Text variant="muted" className="pb-3">
              A circuit is a playlist: problems you climb in order. Add any problem from its screen.
            </Text>
          }
          ListFooterComponent={
            <Pressable
              onPress={() => {
                const circuit = addCircuit({
                  board: board.board,
                  name: 'New circuit',
                  problemIds: [],
                });
                router.push(`/climb/circuit/${circuit.id}/edit`);
              }}
              accessibilityRole="button"
              className="mt-3 h-16 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-input active:opacity-70">
              <Icon as={PlusIcon} size={22} />
              <Text className="font-semibold">New circuit</Text>
            </Pressable>
          }
          contentContainerStyle={padding}
        />
      )}
      <FiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        problems={board.problems}
        setup={board.setup}
        scale={board.scale}
        count={shown.length}
      />
    </View>
  );
}
