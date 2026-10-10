import { MinusIcon } from 'phosphor-react-native/src/icons/Minus';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

/** Goes on the current problem, counted with two big buttons. */
export function TriesStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <View className="h-14 flex-row items-center justify-between rounded-xl border border-border bg-card pl-4 pr-2">
      <Text className="font-medium">Tries</Text>
      <View className="flex-row items-center">
        <Pressable
          onPress={() => onChange(Math.max(0, value - 1))}
          accessibilityRole="button"
          accessibilityLabel="One try fewer"
          hitSlop={4}
          className="size-10 items-center justify-center rounded-xl bg-muted active:opacity-70">
          <Icon as={MinusIcon} size={20} />
        </Pressable>
        <Text className="w-11 text-center text-2xl font-bold" accessibilityLabel={`${value} tries`}>
          {value}
        </Text>
        <Pressable
          onPress={() => onChange(value + 1)}
          accessibilityRole="button"
          accessibilityLabel="One more try"
          hitSlop={4}
          className="size-10 items-center justify-center rounded-xl bg-muted active:opacity-70">
          <Icon as={PlusIcon} size={20} />
        </Pressable>
      </View>
    </View>
  );
}
