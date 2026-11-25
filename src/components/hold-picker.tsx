import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { HangboardDiagram } from '@/components/hangboard-diagram';
import { Label, LargeTitle } from '@/components/section-header';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { gripFor, grips, nearestHold, shortGripName, type Board, type Grip } from '@/lib/boards';

type HoldPickerProps = {
  board: Board;
  visible: boolean;
  /** The step's current hold ids. */
  initial: string[] | undefined;
  onDone: (holds: string[] | undefined) => void;
  onClose: () => void;
};

/**
 * Full-screen sheet for choosing where a hang happens (design: builder-hold-picker). Selection
 * is one grip: a mirrored pair or a centre hold. The diagram and the chips are two views of the
 * same choice; tapping the chosen chip again clears it.
 */
export function HoldPicker({ board, visible, initial, onDone, onClose }: HoldPickerProps) {
  const reduced = useReducedMotion();
  // The Modal unmounts its children while hidden, so the body's state resets on every open.
  return (
    <Modal
      visible={visible}
      animationType={reduced ? 'none' : 'slide'}
      presentationStyle="fullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <HoldPickerBody board={board} initial={initial} onDone={onDone} onClose={onClose} />
    </Modal>
  );
}

/** "Top", then the rows named from the board down: upper, middle, bottom. */
function rowNames(rows: number[]): Record<number, string> {
  const sorted = [...rows].sort((a, b) => a - b);
  const last = sorted.length - 1;
  const names: Record<number, string> = {};
  sorted.forEach((row, i) => {
    if (i === 0) names[row] = 'Top';
    else if (i === last) names[row] = 'Bottom row';
    else if (sorted.length === 3) names[row] = 'Middle row';
    else if (sorted.length === 4) names[row] = i === 1 ? 'Upper row' : 'Middle row';
    else names[row] = `Row ${i}`;
  });
  return names;
}

/** How many hands a grip takes. */
const hands = (grip: Grip) =>
  grip.holdIds.length > 1 || grip.hold.side === 'center' ? 'both hands' : 'one hand';

function HoldPickerBody({ board, initial, onDone, onClose }: Omit<HoldPickerProps, 'visible'>) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Grip | undefined>(() =>
    initial ? gripFor(board, initial) : undefined
  );
  const [size, setSize] = useState({ width: 0, height: 0 });
  // Per board, not per tap: the grips, their rows and what each chip is called.
  const { all, rows, names, chipName } = useMemo(() => {
    const all = grips(board);
    // The edges are what a hang uses most, so the bottom row comes first.
    const rows = Array.from(new Set(all.map((g) => g.row))).sort((a, b) => b - a);
    // Grips by their plain name, unless two share it: then the depth tells them apart.
    const counts = new Map<string, number>();
    for (const g of all)
      counts.set(shortGripName(g.name), (counts.get(shortGripName(g.name)) ?? 0) + 1);
    const chipName = (g: Grip) =>
      (counts.get(shortGripName(g.name)) ?? 0) > 1 ? g.name : shortGripName(g.name);
    return { all, rows, names: rowNames(rows), chipName };
  }, [board]);
  const holds = selected?.holdIds ?? [];

  return (
    <View className="flex-1 bg-canvas">
      <TopBar left="close" onLeft={onClose} title="Choose grip" />
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="w-full max-w-3xl self-center px-6 pb-8 pt-3">
        <LargeTitle title={board.name} />
        <Card className="mt-4 p-4">
          <Pressable
            accessibilityLabel={`${board.name}. Tap a hold to choose it.`}
            onLayout={(e) => setSize(e.nativeEvent.layout)}
            onPress={(e) => {
              if (!size.width) return;
              const hold = nearestHold(
                board,
                e.nativeEvent.locationX / size.width,
                e.nativeEvent.locationY / size.height,
                size
              );
              if (hold) setSelected(all.find((g) => g.holdIds.includes(hold.id)));
            }}>
            <HangboardDiagram board={board.id} active={holds} strokeWidth={1.6} />
          </Pressable>
        </Card>
        <Text className="type-body-b mt-4" accessibilityLiveRegion="polite">
          {selected
            ? `${chipName(selected)}  ·  ${hands(selected)}`
            : 'Tap a hold on the board, or pick one below'}
        </Text>

        {rows.map((row) => (
          <View key={row} className="mt-7">
            <Label>{names[row]}</Label>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {all
                .filter((g) => g.row === row)
                .map((g) => (
                  <Chip
                    key={g.id}
                    label={chipName(g)}
                    accessibilityLabel={g.name}
                    selected={selected?.id === g.id}
                    onPress={() => setSelected(selected?.id === g.id ? undefined : g)}
                  />
                ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <View
        className="w-full max-w-3xl self-center border-t border-line bg-canvas px-6 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}>
        <Button size="lg" onPress={() => onDone(selected?.holdIds)}>
          <Text>{selected ? 'Use this grip' : 'Use no grip'}</Text>
        </Button>
      </View>
    </View>
  );
}
