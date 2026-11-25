import { useLocalSearchParams, useRouter } from 'expo-router';
import { DotsSixVerticalIcon } from 'phosphor-react-native/src/icons/DotsSixVertical';
import { MinusCircleIcon } from 'phosphor-react-native/src/icons/MinusCircle';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Sortable from 'react-native-sortables';

import { ConfirmSheet } from '@/components/confirm-sheet';
import { Field } from '@/components/field';
import { ProblemThumb } from '@/components/moon-board';
import { Screen, useScreenScroll } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useBoard } from '@/hooks/use-board';
import { DOT } from '@/lib/copy';
import { circuitProblems } from '@/lib/moonboard/circuits';
import { displayName } from '@/lib/moonboard/names';
import { gradeLabel, type GradeScale } from '@/lib/moonboard/grades';
import type { Problem } from '@/lib/moonboard/types';
import { useClimb } from '@/lib/store/climb';

type RowsProps = {
  problems: Problem[];
  rows: number;
  scale: GradeScale;
  onChange: (ids: string[]) => void;
};

/** The circuit's problems as a list to drag into order, the same way builder steps move. */
function Rows({ problems, rows, scale, onChange }: RowsProps) {
  const screen = useScreenScroll();
  const renderItem = useCallback(
    ({ item }: { item: Problem }) => (
      <View className="h-[68px] flex-row items-center bg-canvas">
        <Pressable
          onPress={() => onChange(problems.filter((p) => p.id !== item.id).map((p) => p.id))}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${displayName(item.name)}`}
          hitSlop={10}
          className="mr-3">
          <Icon as={MinusCircleIcon} size={24} />
        </Pressable>
        <ProblemThumb holds={item} rows={rows} height={56} />
        <View className="ml-3 h-full flex-1 flex-row items-center border-b border-line">
          <View className="flex-1 gap-0.5">
            <Text className="type-row" numberOfLines={1}>
              {displayName(item.name)}
            </Text>
            <Text className="type-caption text-muted" numberOfLines={1}>
              {`${gradeLabel(item.grade, scale)}${DOT}${item.setter}`}
            </Text>
          </View>
          <Sortable.Handle>
            <View
              className="h-full items-center justify-center pl-4"
              accessibilityLabel="Drag to reorder">
              <Icon as={DotsSixVerticalIcon} size={24} className="text-muted" />
            </View>
          </Sortable.Handle>
        </View>
      </View>
    ),
    [problems, rows, scale, onChange]
  );
  return (
    <Sortable.Grid
      columns={1}
      rowGap={0}
      data={problems}
      keyExtractor={(problem) => problem.id}
      renderItem={renderItem}
      customHandle
      {...(screen ? { scrollableRef: screen.scrollableRef } : {})}
      onDragEnd={({ data }) => onChange(data.map((problem) => problem.id))}
    />
  );
}

/** Edit circuit (design: climb-circuit-edit): rename it, drag its problems into order. */
export default function EditCircuitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const board = useBoard();
  const circuit = useClimb((s) => s.circuits.find((c) => c.id === id));
  const updateCircuit = useClimb((s) => s.updateCircuit);
  const deleteCircuit = useClimb((s) => s.deleteCircuit);
  const [confirm, setConfirm] = useState(false);
  const problems = useMemo(
    () => (board && circuit ? circuitProblems(circuit, board.find) : []),
    [board, circuit]
  );
  const reorder = useCallback(
    (problemIds: string[]) => updateCircuit(id, { problemIds }),
    [updateCircuit, id]
  );

  if (!board || !circuit) return null;

  return (
    <Screen
      header={<TopBar title="Edit circuit" />}
      contentClassName="gap-0 pt-4"
      footer={
        <Button size="lg" onPress={() => router.back()}>
          <Text>Done</Text>
        </Button>
      }>
      <Field
        label="Name"
        value={circuit.name}
        onChangeText={(name) => updateCircuit(circuit.id, { name })}
        selectTextOnFocus
        maxLength={40}
      />
      <SectionHeader title="Problems" className="mb-2 mt-7">
        {problems.length > 1 ? (
          <Text className="type-caption text-muted">Drag to reorder</Text>
        ) : null}
      </SectionHeader>
      {problems.length === 0 ? (
        <Text className="type-sub text-muted">
          Empty so far. Open any problem and tap the list icon at the top to add it here.
        </Text>
      ) : (
        <Rows problems={problems} rows={board.rows} scale={board.scale} onChange={reorder} />
      )}
      <Button variant="outline" className="mt-4" onPress={() => router.dismissTo('/climb')}>
        <Icon as={PlusIcon} size={20} />
        <Text>Add problems</Text>
      </Button>
      <Button variant="ghost" className="mt-2" onPress={() => setConfirm(true)}>
        <Icon as={TrashIcon} size={20} />
        <Text>Delete circuit</Text>
      </Button>
      <ConfirmSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete this circuit?"
        body="Its problems stay on the board, and your log keeps every go."
        safe={{ label: 'Keep it', onPress: () => setConfirm(false) }}
        destructive={{
          label: 'Delete circuit',
          onPress: () => {
            setConfirm(false);
            deleteCircuit(circuit.id);
            router.dismissTo('/climb');
          },
        }}
      />
    </Screen>
  );
}
