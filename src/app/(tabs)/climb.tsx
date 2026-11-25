import { useRouter } from 'expo-router';
import { CaretDownIcon } from 'phosphor-react-native/src/icons/CaretDown';
import { LightbulbFilamentIcon } from 'phosphor-react-native/src/icons/LightbulbFilament';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { QrCodeIcon } from 'phosphor-react-native/src/icons/QrCode';
import { SlidersHorizontalIcon } from 'phosphor-react-native/src/icons/SlidersHorizontal';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, Pressable, ScrollView, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useLargeText } from '@/hooks/use-large-text';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { SearchField } from '@/components/field';
import { FiltersSheet } from '@/components/filters-sheet';
import { IconButton } from '@/components/icon-button';
import { MoonBoard, ProblemThumb } from '@/components/moon-board';
import { ProblemRow } from '@/components/problem-row';
import { Screen, useTabContentStyle } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useBoard } from '@/hooks/use-board';
import { DOT, plural } from '@/lib/copy';
import { LAYOUTS, boardKey, getHoldSet, getLayout } from '@/lib/moonboard/boards';
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
import { benchmarkCount, sampleProblem } from '@/lib/moonboard/problems';
import type { Circuit, Problem } from '@/lib/moonboard/types';
import { useClimb, useClimbSession } from '@/lib/store/climb';
import { useAppTheme } from '@/lib/use-theme';

/** A problem row's height at normal text sizes (`ProblemRow`). */
const ROW_HEIGHT = 88;

const TABS: { id: ProblemTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'projects', label: 'Projects' },
  { id: 'sent', label: 'Sent' },
  { id: 'saved', label: 'Saved' },
  { id: 'mine', label: 'Mine' },
];
/** What an empty tab says about itself: a title and a line. */
const EMPTY: Record<ProblemTab, [string, string]> = {
  all: ['Nothing matches', 'Try a wider grade range or another search.'],
  projects: ['No projects yet', 'Problems you have tried but not sent\nshow up here.'],
  sent: ['No sends yet', 'Problems you have sent show up here.'],
  saved: ['Nothing saved yet', 'Tap the heart on a problem to keep it here.'],
  mine: ['', ''],
};

/** Before a board (design: climb-intro): what Climb is, and the way in. Nothing is asked for. */
function ClimbIntro() {
  const router = useRouter();
  // A real benchmark, to show what the tab is for before a board is set up.
  const sample = sampleProblem('2019-40');
  const total = LAYOUTS.reduce(
    (n, layout) =>
      n +
      layout.angles.reduce(
        (m, angle) => m + benchmarkCount(boardKey({ layout: layout.id, angle })),
        0
      ),
    0
  );
  return (
    <Screen tab contentClassName="gap-0">
      <Text className="type-large" role="heading">
        Climb
      </Text>
      <View className="mt-4 items-center">
        <MoonBoard width={182} rows={18} holds={sample} labels={false} radius={20} />
      </View>
      <Text className="type-hero mt-12">Your MoonBoard,{'\n'}offline</Text>
      <Text className="type-body mt-3 text-muted">
        {total > 0 ? `${total.toLocaleString()} benchmarks on this phone. ` : ''}Light them up over
        Bluetooth. No account.
      </Text>
      <Button size="lg" className="mt-6" onPress={() => router.push('/climb/setup')}>
        <Text>Set up your board</Text>
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
  return (
    <Card className="flex-row p-6 pt-5">
      <Pressable
        onPress={() => router.push(`/climb/circuit/${circuit.id}`)}
        accessibilityRole="button"
        className="flex-1 active:opacity-70">
        <Text className="type-title" numberOfLines={1}>
          {circuit.name}
        </Text>
        <Text className="type-sub mt-1.5 text-muted" numberOfLines={1}>
          {[plural(problems.length, 'problem'), range].filter(Boolean).join(DOT)}
        </Text>
        <View className="mt-[18px] flex-row gap-1.5">
          {problems.slice(0, 7).map((problem) => (
            <ProblemThumb key={problem.id} holds={problem} rows={rows} height={40} />
          ))}
          {problems.length === 0 ? (
            <Text className="type-caption text-muted">Add problems to climb it.</Text>
          ) : null}
        </View>
      </Pressable>
      <Pressable
        disabled={problems.length === 0}
        accessibilityRole="button"
        accessibilityLabel={`Start ${circuit.name}`}
        onPress={() => {
          setRun(startRun({ ...circuit, problemIds: problems.map((p) => p.id) }));
          router.push(`/climb/circuit/${circuit.id}/run`);
        }}
        className="ml-3 size-14 items-center justify-center rounded-full bg-action active:opacity-80 disabled:opacity-30">
        <Icon as={PlayIcon} weight="fill" size={24} className="text-on-action" />
      </Pressable>
    </Card>
  );
}

/** The chips run off the right edge; the canvas fades over them so the cut reads as more. */
function EdgeFade() {
  const { theme } = useAppTheme();
  return (
    <View pointerEvents="none" className="absolute bottom-0 right-0 top-0 w-12">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="chips-fade" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={theme.canvas} stopOpacity={0} />
            <Stop offset="1" stopColor={theme.canvas} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#chips-fade)" />
      </Svg>
    </View>
  );
}

/**
 * The Climb tab (design: climb-list, climb-circuits, climb-empty, climb-mine): every problem for
 * the wall, filtered, or the climber's circuits. The board's name opens its settings; the
 * lights' state sits top right.
 */
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
  // Large text: controls compact and lines wrap instead of colliding.
  const big = useLargeText();
  // Rows are a fixed 88 pt at normal sizes, so the list can place them without measuring.
  const [headerHeight, setHeaderHeight] = useState(0);
  const chips = useRef<ScrollView>(null);
  // The last chips sit past the edge: choosing one brings the row round to it.
  useEffect(() => {
    if (filter.tab === 'saved' || filter.tab === 'mine') chips.current?.scrollToEnd();
    else if (filter.tab === 'all' || filter.tab === 'projects') chips.current?.scrollTo({ x: 0 });
  }, [filter.tab]);

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
  // One handler for every row, so typing in the search box doesn't re-render every row.
  const openProblem = useCallback(
    (problem: Problem) => router.push(`/climb/problem/${problem.id}`),
    [router]
  );

  if (!board) return <ClimbIntro />;

  const changed = activeFilterCount(filter, bounds);
  const hidden =
    shown.length === 0
      ? hiddenByHoldSets(board.problems, filter, board.setup.holdSets, board.status, saved)
      : 0;
  const missing = getLayout(board.setup.layout).holdSets.filter(
    (id) => !board.setup.holdSets.includes(id)
  );
  const summary = `${gradeRangeLabel(Math.max(filter.gradeMin, bounds[0]), Math.min(filter.gradeMax, bounds[1]), board.scale)}${DOT}${SORTS.find((s) => s.id === filter.sort)!.label.toLowerCase()}`;
  const boardLine = `${getLayout(board.setup.layout).name}${DOT}${board.setup.angle}°`;

  const header = (
    <View className="pb-1.5" onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
      <View className="min-h-12 flex-row items-center justify-between gap-3">
        <Text className="type-large" role="heading">
          Climb
        </Text>
        {connected ? (
          <Pressable
            onPress={() => router.push('/climb/lights')}
            accessibilityRole="button"
            accessibilityLabel="Lights connected. Board lights"
            hitSlop={12}
            className="flex-row items-center gap-1.5 active:opacity-70">
            <Icon as={LightbulbFilamentIcon} weight="fill" size={18} />
            <Text className="type-caption">Lights connected</Text>
          </Pressable>
        ) : big ? (
          <IconButton
            icon={LightbulbFilamentIcon}
            label="Connect lights"
            onPress={() => router.push('/climb/connect')}
          />
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 px-4"
            onPress={() => router.push('/climb/connect')}>
            <Icon as={LightbulbFilamentIcon} size={18} />
            <Text className="type-sub">Connect lights</Text>
          </Button>
        )}
      </View>
      <Pressable
        onPress={() => router.push('/climb/board')}
        accessibilityRole="button"
        accessibilityLabel={`${boardLine}. Board settings`}
        hitSlop={8}
        className="flex-row items-center gap-1.5 self-start active:opacity-70">
        <Text className="type-sub text-muted" numberOfLines={1}>
          {boardLine}
        </Text>
        <Icon as={CaretDownIcon} size={16} className="text-muted" />
      </Pressable>
      <Segmented
        className="mt-5"
        options={[
          { value: 'problems', label: 'Problems' },
          { value: 'circuits', label: 'Circuits' },
        ]}
        value={view}
        onChange={setView}
      />
      {view === 'problems' ? (
        <>
          <View className="mt-4 flex-row items-center gap-3">
            <SearchField
              className="flex-1"
              value={filter.query}
              onChangeText={(query) => setFilter({ query })}
              placeholder={big ? 'Search' : 'Search name or setter'}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={changed ? `Filters, ${changed} changed` : 'Filters'}
              onPress={() => setFiltersOpen(true)}
              className="size-12 items-center justify-center rounded-full border border-line-strong bg-surface active:opacity-80">
              <Icon as={SlidersHorizontalIcon} size={24} />
              {changed ? (
                <View className="absolute -right-1 -top-1 size-[18px] items-center justify-center rounded-full bg-action">
                  <Text className="type-caption text-[11px] leading-[13px] text-on-action">
                    {changed}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </View>
          {/* Five chips do not fit a phone: the row scrolls, out to the screen edges. */}
          <View className="-mx-6 mt-4">
            <ScrollView
              ref={chips}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
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
            <EdgeFade />
          </View>
          <View className="mt-3 flex-row flex-wrap justify-between gap-x-4">
            <Text className="type-caption shrink text-muted">
              {filter.tab === 'mine' ? 'Set on this board' : summary}
            </Text>
            <Text className="type-caption text-muted">{plural(shown.length, 'problem')}</Text>
          </View>
        </>
      ) : null}
    </View>
  );

  const setOne = (
    <View className="gap-3 pt-4">
      <Button variant="outline" onPress={() => router.push('/climb/new')}>
        <Icon as={PlusIcon} size={20} />
        <Text>Set a problem</Text>
      </Button>
      {Platform.OS === 'web' ? null : (
        <Button variant="ghost" onPress={() => router.push('/scan')}>
          <Icon as={QrCodeIcon} size={20} />
          <Text>Or scan one from a friend</Text>
        </Button>
      )}
    </View>
  );

  const [emptyTitle, emptyLine] = EMPTY[filter.tab];
  const empty =
    filter.tab === 'mine' ? null : (
      <View className="items-start pt-10">
        <View className="size-[72px] items-center justify-center rounded-3xl bg-raised">
          <Icon as={MagnifyingGlassIcon} size={28} />
        </View>
        <Text className="type-title mt-5">
          {hidden > 0 ? 'Nothing here with your holds' : emptyTitle}
        </Text>
        <Text className="type-sub mt-2 text-muted">
          {hidden > 0
            ? `${plural(hidden, 'problem needs', 'problems need')} ${missing.map((id) => getHoldSet(id).name).join(' or ')}.`
            : emptyLine}
        </Text>
        <View className="mt-6 flex-row gap-3">
          {changed || filter.query ? (
            <Button
              variant="outline"
              className="w-[180px]"
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
      </View>
    );

  return (
    <View className="flex-1 bg-canvas">
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
          getItemLayout={
            big || !headerHeight
              ? undefined
              : (_, index) => ({
                  length: ROW_HEIGHT,
                  offset: padding.paddingTop + headerHeight + ROW_HEIGHT * index,
                  index,
                })
          }
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
          ListHeaderComponent={<View className="pb-3">{header}</View>}
          ListEmptyComponent={
            <Text className="type-sub pb-3 text-muted">
              A circuit is a playlist: problems you climb in order. Add any problem from its screen.
            </Text>
          }
          ListFooterComponent={
            <Button
              variant="outline"
              className="mt-3"
              onPress={() => {
                const circuit = addCircuit({
                  board: board.board,
                  name: 'New circuit',
                  problemIds: [],
                });
                router.push(`/climb/circuit/${circuit.id}/edit`);
              }}>
              <Icon as={PlusIcon} size={20} />
              <Text>New circuit</Text>
            </Button>
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
