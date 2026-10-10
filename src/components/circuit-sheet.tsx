import { useRouter } from 'expo-router';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { Pressable, View } from 'react-native';

import { ButtonLabel } from '@/components/button-label';
import { CheckBox } from '@/components/check-box';
import { Sheet } from '@/components/sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { toggleProblem } from '@/lib/moonboard/circuits';
import type { BoardKey } from '@/lib/moonboard/types';
import { useClimb } from '@/lib/store/climb';

type CircuitSheetProps = { open: boolean; onClose: () => void; problemId: string; board: BoardKey };

/** Puts a problem in circuits, or takes it out. A problem can sit in several. */
export function CircuitSheet({ open, onClose, problemId, board }: CircuitSheetProps) {
  const router = useRouter();
  const circuits = useClimb((s) => s.circuits);
  const updateCircuit = useClimb((s) => s.updateCircuit);
  const addCircuit = useClimb((s) => s.addCircuit);
  const mine = circuits.filter((c) => c.board === board);

  return (
    <Sheet open={open} onClose={onClose} title="Add to circuit">
      <View>
        {mine.map((circuit) => {
          const on = circuit.problemIds.includes(problemId);
          return (
            <Pressable
              key={circuit.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() =>
                updateCircuit(circuit.id, {
                  problemIds: toggleProblem(circuit, problemId).problemIds,
                })
              }
              className="min-h-[60px] flex-row items-center gap-3 border-b border-border active:opacity-70">
              <View className="flex-1 gap-0.5">
                <Text className="font-medium">{circuit.name}</Text>
                <Text className="text-xs text-muted-foreground font-medium">
                  {circuit.problemIds.length}{' '}
                  {circuit.problemIds.length === 1 ? 'problem' : 'problems'}
                </Text>
              </View>
              <CheckBox checked={on} />
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            const circuit = addCircuit({ board, name: 'New circuit', problemIds: [problemId] });
            onClose();
            router.push(`/climb/circuit/${circuit.id}/edit`);
          }}
          className="min-h-[52px] flex-row items-center gap-3 active:opacity-70">
          <Icon as={PlusIcon} size={22} />
          <Text className="font-semibold">New circuit</Text>
        </Pressable>
      </View>
      <Button size="lg" onPress={onClose}>
        <ButtonLabel>Done</ButtonLabel>
      </Button>
    </Sheet>
  );
}
