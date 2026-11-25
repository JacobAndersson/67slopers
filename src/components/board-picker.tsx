import { Pressable, ScrollView, View } from 'react-native';

import { HangboardDiagram } from '@/components/hangboard-diagram';
import { Text } from '@/components/ui/text';
import { BOARD_IDS, getBoard, type BoardId } from '@/lib/boards';
import { cn } from '@/lib/utils';

type BoardPickerProps = {
  value: BoardId | undefined;
  onChange: (id: BoardId | undefined) => void;
};

/**
 * Boards as a sideways row of diagrams (design: builder-board-open), "No board" first. The one
 * chosen carries an ink outline.
 */
export function BoardPicker({ value, onChange }: BoardPickerProps) {
  return (
    <ScrollView
      horizontal
      accessibilityRole="radiogroup"
      accessibilityLabel="Hangboard"
      className="-mx-6 grow-0"
      contentContainerClassName="gap-3 px-6"
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <Option label="No board" active={value === undefined} onPress={() => onChange(undefined)} />
      {BOARD_IDS.map((id) => (
        <Option
          key={id}
          id={id}
          label={getBoard(id)!.name}
          active={value === id}
          onPress={() => onChange(id)}
        />
      ))}
    </ScrollView>
  );
}

function Option({
  id,
  label,
  active,
  onPress,
}: {
  id?: BoardId;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      aria-checked={active}
      accessibilityState={{ checked: active }}
      className="w-[116px] items-center gap-2 active:opacity-80">
      <View
        className={cn(
          'h-[72px] w-[116px] items-center justify-center rounded-2xl bg-canvas px-3',
          active ? 'border-2 border-text' : 'border border-line'
        )}>
        {id ? (
          <HangboardDiagram board={id} width={92} strokeWidth={0.6} />
        ) : (
          <Text className="type-title text-muted">—</Text>
        )}
      </View>
      <Text
        className={cn('text-center text-xs font-bold', active ? 'text-text' : 'text-muted')}
        numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}
