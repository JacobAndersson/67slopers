import { XIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';

import { BoardView } from '@/components/board-view';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { gripFor, grips, rowTitle, type Board, type Grip } from '@/lib/boards';

type HoldPickerProps = {
  board: Board;
  visible: boolean;
  /** The step's current hold ids. */
  initial: string[] | undefined;
  onDone: (holds: string[] | undefined) => void;
  onClose: () => void;
};

/**
 * Full-screen sheet for choosing where a hang happens. Selection is one grip: a mirrored pair
 * or a centre hold. The board and the chips are two views of the same choice.
 */
export function HoldPicker({ board, visible, initial, onDone, onClose }: HoldPickerProps) {
  const reduced = useReducedMotion();
  // The Modal unmounts its children while hidden, so the body's state resets on every open.
  return (
    <Modal
      visible={visible}
      animationType={reduced ? 'none' : 'slide'}
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <HoldPickerBody board={board} initial={initial} onDone={onDone} onClose={onClose} />
    </Modal>
  );
}

function HoldPickerBody({ board, initial, onDone, onClose }: Omit<HoldPickerProps, 'visible'>) {
  const insets = useSafeAreaInsets();
  const all = grips(board);
  const [selected, setSelected] = useState<Grip | undefined>(() =>
    initial ? gripFor(board, initial) : undefined
  );
  const rows = Array.from(new Set(all.map((g) => g.row)));
  const holds = selected?.holdIds ?? [];

  return (
    <>
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center gap-3 border-b border-border px-4 py-2">
          <Button variant="ghost" size="icon" accessibilityLabel="Cancel" onPress={onClose}>
            <Icon as={XIcon} className="size-6" />
          </Button>
          <Text className="flex-1 text-lg font-semibold">Choose grip</Text>
        </View>

        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="w-full max-w-3xl self-center gap-4 px-6 pb-8 pt-2">
          <View className="gap-4 py-4">
            <Text className="text-2xl font-semibold">{board.name}</Text>
            <BoardView
              board={board}
              holds={holds}
              mounted={board.holds.map((hold) => hold.id)}
              animated
              onPressHold={(id) => setSelected(all.find((g) => g.holdIds.includes(id)))}
            />
            <Text className="text-center font-medium">
              {selected ? selected.name : 'Tap a hold on the board or pick one below'}
            </Text>
          </View>

          {rows.map((row) => (
            <View key={row} className="gap-2">
              <Text variant="muted">{rowTitle(row)}</Text>
              <View className="flex-row flex-wrap gap-2">
                {all
                  .filter((g) => g.row === row)
                  .map((g) => {
                    const active = selected?.id === g.id;
                    return (
                      <Button
                        key={g.id}
                        variant={active ? 'default' : 'outline'}
                        accessibilityState={{ selected: active }}
                        // Long names (the 2000's mixed top edges) wrap instead of clipping.
                        className="h-auto min-h-12 max-w-full py-3"
                        onPress={() => setSelected(active ? undefined : g)}>
                        <Text className="shrink">{g.name}</Text>
                      </Button>
                    );
                  })}
              </View>
            </View>
          ))}

          <Button variant="outline" className="self-start" onPress={() => setSelected(undefined)}>
            <Text>No grip selected</Text>
          </Button>
        </ScrollView>
        <View
          className="w-full max-w-3xl gap-2 self-center border-t border-border px-6 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}>
          <Text variant="muted">{selected?.name ?? 'This hang will have no grip highlight.'}</Text>
          <Button size="lg" onPress={() => onDone(selected?.holdIds)}>
            <Text>{selected ? 'Use this grip' : 'Use no grip'}</Text>
          </Button>
        </View>
      </View>
    </>
  );
}
