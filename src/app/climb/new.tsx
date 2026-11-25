import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowCounterClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowCounterClockwise';
import { LightbulbFilamentIcon } from 'phosphor-react-native/src/icons/LightbulbFilament';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, ScrollView, View, useWindowDimensions } from 'react-native';

import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { IconButton } from '@/components/icon-button';
import { MoonBoard, ProblemThumb, RoleSwatch } from '@/components/moon-board';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useBoard } from '@/hooks/use-board';
import { DOT, plural } from '@/lib/copy';
import { getLayout } from '@/lib/moonboard/boards';
import { EMPTY_HOLDS, draftProblem, tapHold } from '@/lib/moonboard/draft';
import { holdName, parseHold } from '@/lib/moonboard/grid';
import { GRADES, gradeLabel } from '@/lib/moonboard/grades';
import { light, lightsOff, useLights } from '@/lib/moonboard/lights';
import { holdCount } from '@/lib/moonboard/problems';
import { MAX_HOLDS } from '@/lib/moonboard/protocol';
import type { Feet, ProblemHolds, Role } from '@/lib/moonboard/types';
import { useClimb } from '@/lib/store/climb';
import { WALL } from '@/lib/theme';

const DRAFT = 'draft';

/** "2 start · 4 holds · add a finish hold", or the finish count once there is one. */
function draftLine(holds: ProblemHolds): string {
  const missing = draftProblem(holds);
  return [
    `${holds.start.length} start`,
    plural(holds.hold.length, 'hold'),
    missing ?? `${holds.finish.length} finish`,
  ].join(DOT);
}

/** A missing step in words, as the button says it: "Add a finish hold". */
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Setting a problem (design: climb-new, climb-save): pick a role, tap holds, then name it. With
 * the lights connected the wall mirrors every tap, so it can be set standing at the board.
 * `?edit=<id>` opens an own problem to change its holds and name.
 */
export default function NewProblemScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const board = useBoard();
  const addCustom = useClimb((s) => s.addCustom);
  const updateCustom = useClimb((s) => s.updateCustom);
  const editing = useClimb((s) => (edit ? s.custom.find((p) => p.id === edit) : undefined));
  const connected = useLights((s) => s.status === 'connected');
  const [history, setHistory] = useState<ProblemHolds[]>(() => [
    editing ? { start: editing.start, hold: editing.hold, finish: editing.finish } : EMPTY_HOLDS,
  ]);
  const [role, setRole] = useState<Role>('start');
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState(editing?.name ?? '');
  const [grade, setGrade] = useState<number | undefined>(editing?.grade);
  const [feet, setFeet] = useState<Feet>(editing?.feet ?? 'any');
  const [note, setNote] = useState(editing?.note ?? '');
  const holds = history[history.length - 1];
  // Without sight the grid is hard to aim at: a screen reader also gets a field to type a hold.
  const [reader, setReader] = useState(false);
  const [typed, setTyped] = useState('');
  useEffect(() => {
    void AccessibilityInfo.isScreenReaderEnabled().then(setReader);
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setReader);
    return () => sub.remove();
  }, []);
  const missing = draftProblem(holds);

  useEffect(() => {
    if (connected) light(holds, DRAFT);
  }, [connected, holds]);
  useEffect(
    () => () => {
      if (useLights.getState().lit === DRAFT) lightsOff();
    },
    []
  );

  if (!board) return null;
  const change = (next: ProblemHolds) => {
    if (next !== holds) setHistory([...history, next]);
  };

  if (naming) {
    const save = () => {
      const fields = { name: name.trim(), grade, feet, note: note.trim() || undefined, ...holds };
      if (editing) {
        updateCustom(editing.id, fields);
        router.back();
      } else {
        const problem = addCustom({ board: board.board, ...fields });
        router.replace(`/climb/problem/${problem.id}`);
      }
    };
    return (
      <Screen
        header={<TopBar title="Save problem" onLeft={() => setNaming(false)} />}
        contentClassName="gap-6 pt-4"
        footer={
          <View className="flex-row gap-3">
            <Button variant="outline" size="lg" className="flex-1" onPress={() => setNaming(false)}>
              <Text>Back</Text>
            </Button>
            <Button size="lg" className="flex-1 px-0" disabled={!name.trim()} onPress={save}>
              <Text>Save problem</Text>
            </Button>
          </View>
        }>
        <View className="flex-row items-center gap-5">
          <ProblemThumb holds={holds} rows={board.rows} height={96} />
          <View className="flex-1 gap-1">
            <Text className="type-title">{plural(holdCount(holds), 'hold')}</Text>
            <Text className="type-sub text-muted">
              {[
                `${holds.start.length} start`,
                plural(holds.hold.length, 'hold'),
                `${holds.finish.length} finish`,
              ].join(DOT)}
            </Text>
            <Text className="type-caption text-muted">
              {`${getLayout(board.setup.layout).name}${DOT}${board.setup.angle}°`}
            </Text>
          </View>
        </View>
        <Field
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="What is it called?"
          maxLength={40}
          autoFocus={!editing}
        />
        <View className="gap-2">
          <Text className="type-caption text-muted">Grade</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-6"
            contentContainerClassName="gap-2 px-6">
            <Chip label="Open" selected={grade === undefined} onPress={() => setGrade(undefined)} />
            {GRADES.map((_, index) => (
              <Chip
                key={index}
                label={gradeLabel(index, board.scale)}
                selected={grade === index}
                onPress={() => setGrade(index)}
              />
            ))}
          </ScrollView>
        </View>
        <View className="gap-2">
          <Text className="type-caption text-muted">Feet</Text>
          <Segmented
            options={[
              { value: 'any', label: 'Any' },
              { value: 'follow', label: 'With hands' },
              { value: 'footless', label: 'None' },
            ]}
            value={feet}
            onChange={setFeet}
          />
        </View>
        <Field
          value={note}
          onChangeText={setNote}
          placeholder="Notes for whoever climbs it next"
          accessibilityLabel="Notes"
          multiline
        />
      </Screen>
    );
  }

  return (
    <Screen
      header={<TopBar left="close" title={editing ? 'Edit problem' : 'New problem'} />}
      contentClassName="items-center gap-0 pt-2"
      footer={
        <View className="gap-3">
          <Segmented
            options={(['start', 'hold', 'finish'] as const).map((value) => ({
              value,
              label: capital(value),
              leading: <RoleSwatch role={value} size={12} plain />,
            }))}
            value={role}
            onChange={setRole}
          />
          <View className="flex-row gap-1">
            <IconButton
              icon={ArrowCounterClockwiseIcon}
              size={64}
              label="Undo"
              disabled={history.length < 2}
              onPress={() => setHistory(history.slice(0, -1))}
            />
            <IconButton
              icon={TrashIcon}
              size={64}
              label="Clear all holds"
              disabled={holdCount(holds) === 0}
              onPress={() => change(EMPTY_HOLDS)}
            />
            <Button
              size="lg"
              className="ml-1.5 flex-1 px-2"
              disabled={!!missing}
              onPress={() => setNaming(true)}>
              <Text numberOfLines={1}>{missing ? capital(missing) : 'Next'}</Text>
            </Button>
          </View>
        </View>
      }>
      {connected ? (
        <View className="mb-3 flex-row items-center gap-1.5">
          <Icon as={LightbulbFilamentIcon} weight="fill" size={18} />
          <Text className="type-caption">Mirroring on the wall</Text>
        </View>
      ) : null}
      <MoonBoard
        width={Math.min(width - 110, 340)}
        rows={board.rows}
        holds={holds}
        lit={connected}
        onHoldPress={(hold) => change(tapHold(holds, hold, role))}
        loupeColor={WALL[role]}
      />
      <Text className="type-sub mt-2 text-center" accessibilityLiveRegion="polite">
        {draftLine(holds)}
      </Text>
      <Text className="type-caption mt-1 text-center text-muted">
        Tap a hold again to remove it. Up to {MAX_HOLDS} holds.
      </Text>
      {reader ? (
        <View className="mt-4 w-full flex-row items-end gap-3">
          <Field
            className="flex-1"
            label="Type a hold, such as E8"
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
          />
          <Button
            variant="outline"
            disabled={!parseHold(typed.trim().toUpperCase(), board.rows)}
            onPress={() => {
              const at = parseHold(typed.trim().toUpperCase(), board.rows);
              if (!at) return;
              const hold = holdName(at);
              change(tapHold(holds, hold, role));
              AccessibilityInfo.announceForAccessibility(
                `${hold}. ${draftLine(tapHold(holds, hold, role))}`
              );
              setTyped('');
            }}>
            <Text>{`Add as ${role}`}</Text>
          </Button>
        </View>
      ) : null}
    </Screen>
  );
}
