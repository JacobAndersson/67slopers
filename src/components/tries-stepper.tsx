import { MinusIcon } from 'phosphor-react-native/src/icons/Minus';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

/**
 * Goes on the current problem, counted mid-session (design: screens_climb.py `tries`): an
 * 80 pt pill, "Tries" on the left, 64 pt − and + either side of the count.
 */
export function TriesStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <View className="min-h-20 flex-row items-center rounded-full border border-line-strong bg-surface pl-6 pr-2">
      <Text className="type-body-b flex-1">Tries</Text>
      <Pressable
        onPress={() => onChange(Math.max(0, value - 1))}
        disabled={value === 0}
        accessibilityRole="button"
        accessibilityLabel="One try fewer"
        className="size-16 items-center justify-center rounded-full border-[1.5px] border-text active:bg-raised disabled:opacity-30">
        <Icon as={MinusIcon} size={24} weight="bold" />
      </Pressable>
      <Text
        className="type-num w-[72px] text-center text-[28px] leading-8"
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Tries"
        accessibilityValue={{ text: `${value} ${value === 1 ? 'try' : 'tries'}` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) =>
          onChange(
            event.nativeEvent.actionName === 'increment' ? value + 1 : Math.max(0, value - 1)
          )
        }
        accessibilityLiveRegion="polite">
        {value}
      </Text>
      <Pressable
        onPress={() => onChange(value + 1)}
        accessibilityRole="button"
        accessibilityLabel="One more try"
        className="size-16 items-center justify-center rounded-full border-[1.5px] border-text active:bg-raised">
        <Icon as={PlusIcon} size={24} weight="bold" />
      </Pressable>
    </View>
  );
}
