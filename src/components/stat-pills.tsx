import { View } from 'react-native';

import { Text } from '@/components/ui/text';

/** A row of small figures, value over label: three or four across. */
export function StatPills({ items }: { items: { value: string; label: string }[] }) {
  return (
    <View className="flex-row gap-2">
      {items.map(({ value, label }) => (
        <View
          key={label}
          className="flex-1 items-center rounded-xl border border-border bg-card py-2">
          <Text className="font-semibold">{value}</Text>
          <Text className="text-xs text-muted-foreground font-medium">{label}</Text>
        </View>
      ))}
    </View>
  );
}
