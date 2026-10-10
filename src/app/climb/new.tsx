import { Stack, useRouter } from 'expo-router';
import { ArrowCounterClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowCounterClockwise';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { useEffect, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';

import { ButtonLabel } from '@/components/button-label';
import { Chip } from '@/components/chip';
import { MoonBoard, ProblemThumb, ROLE_COLOR, boardWidthFor } from '@/components/moon-board';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useBoard } from '@/hooks/use-board';
import { boardLabel } from '@/lib/moonboard/boards';
import { EMPTY_HOLDS, draftProblem, draftSummary, tapHold } from '@/lib/moonboard/draft';
import { GRADES, gradeLabel } from '@/lib/moonboard/grades';
import { light, lightsOff, useLights } from '@/lib/moonboard/lights';
import { holdCount } from '@/lib/moonboard/problems';
import { MAX_HOLDS } from '@/lib/moonboard/protocol';
import type { Feet, ProblemHolds, Role } from '@/lib/moonboard/types';
import { useClimb } from '@/lib/store/climb';

const DRAFT = 'draft';

/**
 * Setting a problem: pick a role, tap holds, then name it. With the lights connected the
 * wall mirrors every tap, so it can be set standing in front of the board.
 */
export default function NewProblemScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const board = useBoard();
  const addCustom = useClimb((s) => s.addCustom);
  const connected = useLights((s) => s.status === 'connected');
  const [history, setHistory] = useState<ProblemHolds[]>([EMPTY_HOLDS]);
  const [role, setRole] = useState<Role>('start');
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<number | undefined>();
  const [feet, setFeet] = useState<Feet>('any');
  const [note, setNote] = useState('');
  const holds = history[history.length - 1];
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
    return (
      <>
        <Stack.Screen options={{ title: 'Save problem' }} />
        <Screen
          footer={
            <View className="flex-row gap-3">
              <Button variant="outline" size="lg" onPress={() => setNaming(false)}>
                <ButtonLabel>Back</ButtonLabel>
              </Button>
              <Button
                size="lg"
                className="flex-1"
                disabled={!name.trim()}
                onPress={() => {
                  const problem = addCustom({
                    board: board.board,
                    name: name.trim(),
                    grade,
                    feet,
                    note: note.trim() || undefined,
                    ...holds,
                  });
                  router.replace(`/climb/problem/${problem.id}`);
                }}>
                <ButtonLabel>Save problem</ButtonLabel>
              </Button>
            </View>
          }>
          <View className="flex-row items-center gap-4">
            <ProblemThumb holds={holds} rows={board.rows} width={76} />
            <View className="gap-1">
              <Text className="font-semibold">{holdCount(holds)} holds</Text>
              <Text variant="muted">{draftSummary(holds)}</Text>
              <Text variant="muted">{boardLabel(board.setup)}</Text>
            </View>
          </View>
          <View className="gap-2">
            <Label nativeID="problem-name">Name</Label>
            <Input
              aria-labelledby="problem-name"
              value={name}
              onChangeText={setName}
              placeholder="What is it called?"
              maxLength={40}
              autoFocus
              className="h-12 sm:h-12"
            />
          </View>
          <View className="gap-2">
            <Text className="text-sm font-medium">Grade</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2">
              <Chip
                label="Open"
                selected={grade === undefined}
                onPress={() => setGrade(undefined)}
              />
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
            <Text className="text-sm font-medium">Feet</Text>
            <Segmented
              options={[
                { value: 'any', label: 'Any holds' },
                { value: 'follow', label: 'Follow hands' },
                { value: 'footless', label: 'Footless' },
              ]}
              value={feet}
              onChange={setFeet}
            />
          </View>
          <Textarea
            value={note}
            onChangeText={setNote}
            placeholder="Notes for whoever climbs it next"
          />
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'New problem' }} />
      <Screen
        footer={
          <View className="gap-3">
            <Segmented
              options={[
                { value: 'start', label: 'Start', dot: ROLE_COLOR.start },
                { value: 'hold', label: 'Hold', dot: ROLE_COLOR.hold },
                { value: 'finish', label: 'Finish', dot: ROLE_COLOR.finish },
              ]}
              value={role}
              onChange={setRole}
            />
            <View className="flex-row gap-3">
              <Button
                variant="outline"
                size="lg"
                className="w-14 px-0"
                accessibilityLabel="Undo"
                disabled={history.length < 2}
                onPress={() => setHistory(history.slice(0, -1))}>
                <Icon as={ArrowCounterClockwiseIcon} size={22} />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-14 px-0"
                accessibilityLabel="Clear all holds"
                disabled={holdCount(holds) === 0}
                onPress={() => change(EMPTY_HOLDS)}>
                <Icon as={TrashIcon} size={22} />
              </Button>
              <Button
                size="lg"
                className="flex-1"
                disabled={!!missing}
                onPress={() => setNaming(true)}>
                <ButtonLabel>Next</ButtonLabel>
              </Button>
            </View>
          </View>
        }>
        {connected ? (
          <View className="self-center">
            <Chip label="Mirroring on the wall" dotClassName="bg-hold-start" />
          </View>
        ) : null}
        <MoonBoard
          width={boardWidthFor(width)}
          rows={board.rows}
          holds={holds}
          lit={connected}
          onHoldPress={(hold) => change(tapHold(holds, hold, role))}
        />
        <Text className="text-center text-xs text-ring font-medium">
          {draftSummary(holds)}
          {missing ? ` · ${missing}` : ''}
        </Text>
        <Text className="text-center text-xs text-muted-foreground font-medium">
          Tap a hold again to remove it. Up to {MAX_HOLDS} holds.
        </Text>
      </Screen>
    </>
  );
}
