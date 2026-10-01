import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { BoardPicker } from '@/components/board-picker';
import { BoardView } from '@/components/board-view';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { getBoard } from '@/lib/boards';
import { useStore } from '@/lib/store/store';

/** Optional, local board setup. The board artwork is loaded only on this route. */
export default function BoardSetupScreen() {
  const router = useRouter();
  const preferred = useStore((s) => s.preferredBoard);
  const hydrated = useStore((s) => s.hydrated);
  const edited = useRef(false);
  const setPreferredBoard = useStore((s) => s.setPreferredBoard);
  const [selected, setSelected] = useState(preferred);
  useEffect(() => {
    if (hydrated && !edited.current) setSelected(preferred);
  }, [hydrated, preferred]);
  const board = getBoard(selected);
  const finish = (withoutBoard = false) => {
    setPreferredBoard(withoutBoard ? undefined : selected);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  return (
    <>
      <Stack.Screen options={{ title: 'Your hangboard' }} />
      <Screen
        footer={
          <Button size="lg" disabled={!hydrated} onPress={() => finish()}>
            <Text>{board ? 'Use this board' : 'Continue without a board'}</Text>
          </Button>
        }>
        <Text variant="h2">Choose your board.</Text>
        <Text variant="muted">
          New workouts start with this board selected. Your saved workouts keep their own board.
        </Text>
        <BoardPicker
          value={selected}
          onChange={(id) => {
            edited.current = true;
            setSelected(id);
          }}
        />
        {board ? (
          <View className="gap-4 rounded-lg border border-border bg-card p-4">
            <BoardView board={board} holds={[]} />
            <Text className="font-semibold">{board.name}</Text>
            <Text variant="muted">Pick the edge or grip on each Hang step in the builder.</Text>
          </View>
        ) : null}
        <Button variant="ghost" onPress={() => finish(true)}>
          <Text>Skip board setup</Text>
        </Button>
      </Screen>
    </>
  );
}
