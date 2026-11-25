import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { HangboardDiagram } from '@/components/hangboard-diagram';
import { Screen } from '@/components/screen';
import { LargeTitle } from '@/components/section-header';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { BOARD_IDS, getBoard, type BoardId } from '@/lib/boards';
import { useStore } from '@/lib/store/store';
import { cn } from '@/lib/utils';

/** The order boards are offered in (BOARD_IDS is append-only, so it cannot carry this). */
const ORDER: BoardId[] = [
  'beastmaker-1000',
  'beastmaker-2000',
  'fika-vetelangd',
  'metolius-project',
  'metolius-simulator-3d',
  'tension-grindstone-mk2',
  'metolius-wood-grips-compact',
  'metolius-wood-grips-deluxe',
];
const ordered = [
  ...ORDER.filter((id) => BOARD_IDS.includes(id)),
  ...BOARD_IDS.filter((id) => !ORDER.includes(id)),
];

/** Board names short enough for a tile: "Simulator 3D", "Grips Compact". */
const tileName = (name: string) =>
  name
    .replace(/^Tension /, '')
    .replace(/^Metolius Wood Grips II /, 'Grips ')
    .replace(/^Metolius Simulator/, 'Simulator');

/**
 * The default hangboard (design: builder-board-setup): every board as a diagram in a grid of
 * two. New workouts start with the one chosen; saved workouts keep their own.
 */
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
  const choose = (id: BoardId) => {
    edited.current = true;
    setSelected(id);
  };
  return (
    <Screen
      header={<TopBar />}
      contentClassName="gap-0"
      footer={
        <Button size="lg" disabled={!hydrated || !board} onPress={() => finish()}>
          <Text>Use this board</Text>
        </Button>
      }>
      <LargeTitle title="Your hangboard" />
      <Text className="type-body mt-2 text-muted">
        New workouts start with this board. Saved workouts keep their own.
      </Text>
      <View
        className="mt-7 flex-row flex-wrap justify-between gap-y-2"
        accessibilityRole="radiogroup"
        accessibilityLabel="Hangboard">
        {ordered.map((id) => {
          const active = selected === id;
          const name = getBoard(id)!.name;
          const short = tileName(name);
          return (
            <Pressable
              key={id}
              onPress={() => choose(id)}
              accessibilityRole="radio"
              accessibilityLabel={name}
              accessibilityState={{ checked: active }}
              aria-checked={active}
              className={cn(
                'mb-1 min-h-[120px] w-[48.3%] justify-between rounded-[24px] bg-surface px-4 pb-4 pt-[18px] active:opacity-80',
                active ? 'border-2 border-text' : 'border border-line'
              )}>
              <HangboardDiagram board={id} strokeWidth={0.8} />
              <Text className="mt-3 text-sm leading-[18px] font-extrabold" numberOfLines={2}>
                {short}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Button variant="ghost" className="mt-3" onPress={() => finish(true)}>
        <Text>Skip board setup</Text>
      </Button>
    </Screen>
  );
}
