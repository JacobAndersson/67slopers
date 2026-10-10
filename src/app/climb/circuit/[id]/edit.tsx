import { useLocalSearchParams, useRouter } from 'expo-router';
import { DotsSixVerticalIcon } from 'phosphor-react-native/src/icons/DotsSixVertical';
import { MinusCircleIcon } from 'phosphor-react-native/src/icons/MinusCircle';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { useCallback, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Sortable from 'react-native-sortables';

import { ButtonLabel } from '@/components/button-label';
import { ProblemThumb } from '@/components/moon-board';
import { Screen, useScreenScroll } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useArmed } from '@/hooks/use-armed';
import { useBoard } from '@/hooks/use-board';
import { circuitProblems } from '@/lib/moonboard/circuits';
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
      <View className="flex-row items-center gap-3 rounded-lg border border-border bg-card py-2 pl-3">
        <Pressable
          onPress={() => onChange(problems.filter((p) => p.id !== item.id).map((p) => p.id))}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.name}`}
          hitSlop={10}>
          <Icon as={MinusCircleIcon} size={22} className="text-destructive" />
        </Pressable>
        <ProblemThumb holds={item} rows={rows} width={30} />
        <View className="flex-1 gap-0.5">
          <Text className="font-semibold" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-xs text-muted-foreground font-medium">
            {gradeLabel(item.grade, scale)} · {item.setter}
          </Text>
        </View>
        <Sortable.Handle>
          <View
            className="h-full items-center justify-center px-4"
            accessibilityLabel="Drag to reorder">
            <Icon as={DotsSixVerticalIcon} className="size-5 text-muted-foreground" />
          </View>
        </Sortable.Handle>
      </View>
    ),
    [problems, rows, scale, onChange]
  );
  return (
    <Sortable.Grid
      columns={1}
      rowGap={8}
      data={problems}
      keyExtractor={(problem) => problem.id}
      renderItem={renderItem}
      customHandle
      {...(screen ? { scrollableRef: screen.scrollableRef } : {})}
      onDragEnd={({ data }) => onChange(data.map((problem) => problem.id))}
    />
  );
}

/** Rename a circuit, drag its problems into order, take some out, or delete it. */
export default function EditCircuitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const board = useBoard();
  const circuit = useClimb((s) => s.circuits.find((c) => c.id === id));
  const updateCircuit = useClimb((s) => s.updateCircuit);
  const deleteCircuit = useClimb((s) => s.deleteCircuit);
  const { armed, fire } = useArmed();
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
      footer={
        <Button size="lg" onPress={() => router.back()}>
          <ButtonLabel>Done</ButtonLabel>
        </Button>
      }>
      <View className="gap-2">
        <Label nativeID="circuit-name">Name</Label>
        <Input
          aria-labelledby="circuit-name"
          value={circuit.name}
          onChangeText={(name) => updateCircuit(circuit.id, { name })}
          selectTextOnFocus
          maxLength={40}
          className="h-12 sm:h-12"
        />
      </View>
      <View className="flex-row items-end justify-between pt-2">
        <Text variant="h4">Problems</Text>
        {problems.length > 1 ? (
          <Text className="text-xs text-muted-foreground font-medium">Drag to reorder</Text>
        ) : null}
      </View>
      {problems.length === 0 ? (
        <Text variant="muted">
          Empty so far. Open any problem and tap the list icon in its header to add it here.
        </Text>
      ) : (
        <Rows problems={problems} rows={board.rows} scale={board.scale} onChange={reorder} />
      )}
      <Button variant="outline" onPress={() => router.dismissTo('/climb')}>
        <Icon as={PlusIcon} className="size-5" />
        <Text>Add problems</Text>
      </Button>
      <Button
        variant="ghost"
        onPress={() =>
          fire('only', () => {
            deleteCircuit(circuit.id);
            router.dismissTo('/climb');
          })
        }>
        <Text className="text-destructive">{armed ? 'Tap again to delete' : 'Delete circuit'}</Text>
      </Button>
    </Screen>
  );
}
