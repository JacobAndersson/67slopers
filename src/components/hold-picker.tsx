import { XIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BoardView } from '@/components/board-view';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { gripFor, grips, rowTitle, type Board, type Grip } from '@/lib/boards';
import { cn } from '@/lib/utils';

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
  // The Modal unmounts its children while hidden, so the body's state resets on every open.
  return (
    <Modal
      visible={visible}
      animationType="slide"
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
        <View className="flex-row items-center justify-between px-4 py-2">
          <Button variant="ghost" size="icon" accessibilityLabel="Cancel" onPress={onClose}>
            <Icon as={XIcon} className="size-6" />
          </Button>
          <Text className="text-lg font-semibold">Holds for this hang</Text>
          <Button variant="ghost" onPress={() => onDone(selected?.holdIds)}>
            <Text className="font-semibold">Done</Text>
          </Button>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="w-full max-w-3xl self-center gap-4 px-6 pb-8 pt-2">
          <View className="gap-2">
            <BoardView
              board={board}
              holds={holds}
              onPressHold={(id) => setSelected(all.find((g) => g.holdIds.includes(id)))}
            />
            <Text className="text-center text-muted-foreground">
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
                        size="sm"
                        variant={active ? 'default' : 'secondary'}
                        className={cn(active && 'border border-foreground')}
                        onPress={() => setSelected(active ? undefined : g)}>
                        <Text>{g.name}</Text>
                      </Button>
                    );
                  })}
              </View>
            </View>
          ))}

          <Button variant="outline" className="self-start" onPress={() => setSelected(undefined)}>
            <Text>No holds</Text>
          </Button>
        </ScrollView>
      </View>
    </>
  );
}
