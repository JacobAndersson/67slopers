import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { BoardView } from '@/components/board-view';
import { Text } from '@/components/ui/text';
import { BOARD_IDS, getBoard, type BoardId } from '@/lib/boards';
import { BOARD_IMAGES } from '@/lib/boards/generated/images';
import { cn } from '@/lib/utils';

type BoardPickerProps = {
  value: BoardId | undefined;
  onChange: (id: BoardId | undefined) => void;
  /** Every hold used in the workout, drawn on the map under the chips. */
  holds: string[];
};

/** Chips for "no board" and each known board, plus a map of the holds the workout uses. */
export function BoardPicker({ value, onChange, holds }: BoardPickerProps) {
  const board = getBoard(value);
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        <Chip label="No board" active={value === undefined} onPress={() => onChange(undefined)} />
        {BOARD_IDS.map((id) => (
          <Chip
            key={id}
            label={getBoard(id)!.name}
            thumb={BOARD_IMAGES[id].base}
            active={value === id}
            onPress={() => onChange(id)}
          />
        ))}
      </View>
      {board ? <BoardView board={board} holds={holds} /> : null}
    </View>
  );
}

function Chip({
  label,
  thumb,
  active,
  onPress,
}: {
  label: string;
  thumb?: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      className={cn(
        'items-center gap-1.5 rounded-lg border px-3 py-2',
        active ? 'border-foreground bg-accent' : 'border-border bg-card active:bg-muted'
      )}>
      {thumb ? (
        <Image source={thumb} style={{ width: 96, height: 25 }} contentFit="fill" />
      ) : (
        <View className="h-[25px] w-24 items-center justify-center rounded border border-dashed border-border">
          <Text variant="muted">—</Text>
        </View>
      )}
      <Text variant="small" className={cn(active ? 'font-semibold' : 'text-muted-foreground')}>
        {label}
      </Text>
    </Pressable>
  );
}
