import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { BOARD_IDS, getBoard, type BoardId } from '@/lib/boards';
import { BOARD_IMAGES } from '@/lib/boards/generated/images';
import { cn } from '@/lib/utils';

type BoardPickerProps = {
  value: BoardId | undefined;
  onChange: (id: BoardId | undefined) => void;
};

/** Chips for "no board" and each known board. The hang cards show where the holds are. */
export function BoardPicker({ value, onChange }: BoardPickerProps) {
  return (
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
