import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BluetoothSlashIcon } from 'phosphor-react-native/src/icons/BluetoothSlash';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { DotsThreeVerticalIcon } from 'phosphor-react-native/src/icons/DotsThreeVertical';
import { HeartIcon } from 'phosphor-react-native/src/icons/Heart';
import { LightbulbFilamentIcon } from 'phosphor-react-native/src/icons/LightbulbFilament';
import { ListPlusIcon } from 'phosphor-react-native/src/icons/ListPlus';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { QrCodeIcon } from 'phosphor-react-native/src/icons/QrCode';
import { SealCheckIcon } from 'phosphor-react-native/src/icons/SealCheck';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useLargeText } from '@/hooks/use-large-text';
import { Appear } from '@/components/appear';
import { CircuitSheet } from '@/components/circuit-sheet';
import { ConfirmSheet } from '@/components/confirm-sheet';
import { IconButton } from '@/components/icon-button';
import { LogSendSheet } from '@/components/log-send-sheet';
import { HoldLegend, MoonBoard, boardWidthFor } from '@/components/moon-board';
import { ProjectRing, formatSends } from '@/components/problem-row';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Sheet } from '@/components/sheet';
import { StatPills } from '@/components/stat-pills';
import { TopBar } from '@/components/top-bar';
import { TriesStepper } from '@/components/tries-stepper';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useBoard } from '@/hooks/use-board';
import { DOT, shortDay } from '@/lib/copy';
import { filterProblems } from '@/lib/moonboard/filter';
import { gradeLabel } from '@/lib/moonboard/grades';
import { light, lightsOff, useLights } from '@/lib/moonboard/lights';
import { entriesFor, entryLabel, makeEntry, statusLabel } from '@/lib/moonboard/logbook';
import { displayName } from '@/lib/moonboard/names';
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
 * One problem (design: climb-problem, -scrolled, -lit, -reconnect, climb-own): the wall with
 * its holds ringed, then Log a go and Light it up, or, while it is lit, a tries counter and
 * Sent it. Dragging the wall left or right, or the arrows beside the legend, moves through
 * the list. Below the wall: the benchmark's figures, your log and your own note.
 */
export default function ProblemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const big = useLargeText();
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
  // How the log sheet opens: from Sent it the answer is Sent, from Log a go it is Not yet.
  const [logging, setLogging] = useState<'sent' | 'go' | null>(null);
  const [adding, setAdding] = useState(false);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState<
    { kind: 'problem' } | { kind: 'entry'; id: string } | null
  >(null);
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
  const reconnecting = status === 'reconnecting';
  const carouselWidth = Math.min(width - 48, 720);
  const boardWidth = boardWidthFor(width);
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
      <Screen header={<TopBar />}>
        <Text className="type-hero">This problem is{'\n'}no longer here.</Text>
        <Text className="type-body text-muted">It was deleted, or the board changed.</Text>
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
  // While lit the wall stays put: Sent it and the tries belong to this problem.
  const swipe = Gesture.Pan()
    .enabled(!lit)
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
  const problemStatus = board.status.get(problem.id);
  const state = statusLabel(problemStatus);
  const showLit = lit || reconnecting;
  const tryWord = tries > 0 ? `${DOT}try ${tries}` : '';
  // Room between the top bar and the footer (TopBar 62, content top 12, footer as drawn).
  const footerHeight =
    16 + (lit ? 80 + 12 + 64 : big ? 64 * 2 + 12 : 64) + Math.max(insets.bottom, 16) + 8;
  const firstView = height - insets.top - 62 - 12 - footerHeight - 8;

  const footer = lit ? (
    <View className="gap-3">
      <TriesStepper value={tries} onChange={(value) => setTries(problem.id, value)} />
      <Button size="lg" onPress={() => setLogging('sent')}>
        <Icon as={CheckIcon} size={20} className="text-on-action" />
        <Text>Sent it</Text>
      </Button>
    </View>
  ) : (
    <View className={big ? 'gap-3' : 'flex-row gap-3'}>
      <Button
        variant="outline"
        size="lg"
        className={big ? undefined : 'flex-1 px-0'}
        onPress={() => setLogging('go')}>
        <Text>Log a go</Text>
      </Button>
      <Button
        size="lg"
        className={big ? undefined : 'flex-1 px-0'}
        accessibilityHint={connected ? 'Lights the problem on the wall' : 'Connects the lights'}
        onPress={() => (connected ? light(problem, problem.id) : router.push('/climb/connect'))}>
        <Icon as={LightbulbFilamentIcon} size={20} className="text-on-action" />
        <Text>Light it up</Text>
      </Button>
    </View>
  );

  const header = (
    <TopBar
      titleAlign="left"
      title={
        reconnecting
          ? 'Reconnecting…'
          : own
            ? 'Set by you'
            : index >= 0
              ? `${index + 1} of ${list.length}`
              : undefined
      }
      right={
        <>
          {lit ? (
            <IconButton
              icon={LightbulbFilamentIcon}
              weight="fill"
              label="Lights off"
              onPress={() => lightsOff()}
            />
          ) : null}
          <IconButton icon={ListPlusIcon} label="Add to circuit" onPress={() => setAdding(true)} />
          {own ? (
            <IconButton
              icon={DotsThreeVerticalIcon}
              label="Problem options"
              onPress={() => setMenu(true)}
            />
          ) : (
            <IconButton
              icon={HeartIcon}
              weight={saved ? 'fill' : 'regular'}
              label={saved ? 'Remove from saved' : 'Save'}
              onPress={() => toggleSaved(problem.id)}
            />
          )}
        </>
      }
    />
  );

  return (
    <>
      <Screen header={header} footer={footer} contentClassName="gap-0 pt-3">
        {/* The first view is the problem and its wall; what follows starts below the fold,
            not half under the footer. */}
        <View style={{ minHeight: firstView }}>
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="type-title text-[26px] leading-8 font-black" numberOfLines={2}>
                {displayName(problem.name)}
              </Text>
              <View className="mt-1 flex-row items-center gap-1.5">
                {own ? null : <Icon as={SealCheckIcon} size={16} weight="fill" />}
                <Text className="type-caption shrink text-muted">
                  {own
                    ? `Set by you${DOT}${FEET_LABEL[own.feet]}`
                    : `Benchmark${DOT}set by ${problem.setter}`}
                </Text>
              </View>
              {reconnecting ? (
                <View className="mt-1.5 flex-row items-center gap-1.5">
                  <Icon as={BluetoothSlashIcon} size={16} />
                  <Text className="type-caption">Reconnecting lights{tryWord}</Text>
                </View>
              ) : lit ? (
                <View className="mt-1.5 flex-row items-center gap-1.5">
                  <Icon as={LightbulbFilamentIcon} weight="fill" size={16} />
                  <Text className="type-caption">Lit on the wall{tryWord}</Text>
                </View>
              ) : state ? (
                // Keyed by what it says, so a fresh send lands with a small beat.
                <Appear key={state}>
                  <View className="mt-1.5 flex-row items-center gap-1.5">
                    {problemStatus?.sent ? (
                      <Icon as={CheckCircleIcon} size={16} weight="fill" />
                    ) : (
                      <ProjectRing size={13} />
                    )}
                    <Text className="type-caption">{state.replace(' · ', DOT)}</Text>
                  </View>
                </Appear>
              ) : null}
            </View>
            <Text className="type-bignum">{gradeLabel(problem.grade, board.scale)}</Text>
          </View>

          <GestureDetector gesture={swipe}>
            <View className="mt-4 self-center overflow-hidden" style={{ width: carouselWidth }}>
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
          <View className="mt-3 min-h-12 flex-row items-center justify-between gap-2">
            {showLit ? (
              <View />
            ) : (
              <IconButton
                icon={CaretLeftIcon}
                label="Previous problem"
                disabled={!hasPrevious}
                onPress={() => go(-1)}
              />
            )}
            <HoldLegend className="flex-1" />
            {showLit ? (
              <View />
            ) : (
              <IconButton
                icon={CaretRightIcon}
                label="Next problem"
                disabled={!hasNext}
                onPress={() => go(1)}
              />
            )}
          </View>
        </View>

        {problem.sends !== undefined ? (
          <View className="mt-8">
            <StatPills
              items={[
                { value: formatSends(problem.sends), label: 'sends' },
                { value: problem.stars?.toFixed(1) ?? '–', label: 'stars' },
                { value: problem.tries?.toFixed(1) ?? '–', label: 'avg tries' },
              ]}
            />
          </View>
        ) : null}

        {history.length > 0 ? (
          <View className="mt-8">
            <SectionHeader title="Your log" />
            <View className="mt-2">
              {history.map((entry) => (
                <View key={entry.id} className="h-14 flex-row items-center gap-3">
                  {entry.sent ? (
                    <Icon as={CheckCircleIcon} size={20} weight="fill" />
                  ) : (
                    <View className="m-0.5 size-4 rounded-full border-[1.5px] border-text" />
                  )}
                  <View className="h-full flex-1 flex-row items-center gap-2 border-b border-line">
                    <Text className="type-sub flex-1" numberOfLines={1}>
                      {[
                        entryLabel(entry),
                        entry.felt ? `felt ${entry.felt}` : null,
                        entry.stars ? `${entry.stars}★` : null,
                        entry.note,
                      ]
                        .filter(Boolean)
                        .join(DOT)}
                    </Text>
                    <Text className="type-sub text-muted">{shortDay(entry.at)}</Text>
                    <IconButton
                      icon={TrashIcon}
                      variant="plain"
                      iconSize={20}
                      size={40}
                      label="Delete entry"
                      iconClassName="text-muted"
                      onPress={() => setConfirm({ kind: 'entry', id: entry.id })}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {own?.note ? <Text className="type-body mt-6 text-muted">{own.note}</Text> : null}
      </Screen>

      <LogSendSheet
        open={logging !== null}
        onClose={() => setLogging(null)}
        tries={tries}
        sent={logging !== 'go'}
        onSave={(result) => {
          addEntry(makeEntry(problem, board.board, result));
          if (result.sent && Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          }
          setLogging(null);
        }}
      />
      <CircuitSheet
        open={adding}
        onClose={() => setAdding(false)}
        problemId={problem.id}
        board={board.board}
      />
      <Sheet open={menu} onClose={() => setMenu(false)} title={displayName(problem.name)}>
        <Text className="type-body -mt-1 text-muted">A problem you set on this board.</Text>
        <View className="gap-3 pt-1">
          <Button
            size="lg"
            variant="outline"
            onPress={() => {
              setMenu(false);
              router.push(`/climb/share/${problem.id}`);
            }}>
            <Icon as={QrCodeIcon} size={20} />
            <Text>Share as a code</Text>
          </Button>
          <Button
            size="lg"
            variant="outline"
            onPress={() => {
              setMenu(false);
              router.push({ pathname: '/climb/new', params: { edit: problem.id } });
            }}>
            <Icon as={PencilSimpleIcon} size={20} />
            <Text>Edit holds and name</Text>
          </Button>
          <Button
            size="lg"
            variant="outline"
            onPress={() => {
              setMenu(false);
              setConfirm({ kind: 'problem' });
            }}>
            <Icon as={TrashIcon} size={20} />
            <Text>Delete problem</Text>
          </Button>
        </View>
      </Sheet>
      <ConfirmSheet
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm?.kind === 'problem' ? 'Delete this problem?' : 'Delete this entry?'}
        body={
          confirm?.kind === 'problem'
            ? 'It leaves your list and every circuit. Your log keeps its name.'
            : 'It comes out of your log and the board session it was in.'
        }
        safe={{ label: 'Keep it', onPress: () => setConfirm(null) }}
        destructive={{
          label: 'Delete',
          onPress: () => {
            if (confirm?.kind === 'entry') deleteEntry(confirm.id);
            if (confirm?.kind === 'problem') {
              deleteCustom(problem.id);
              router.back();
            }
            setConfirm(null);
          },
        }}
      />
    </>
  );
}
