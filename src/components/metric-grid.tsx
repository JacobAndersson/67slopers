import { View } from 'react-native';

import { Text } from '@/components/ui/text';

/** Quiet, wrapping facts: enough room for values even on a narrow phone. */
export function MetricGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <View className="flex-row flex-wrap overflow-hidden rounded-lg border border-border bg-card">
      {items.map(({ label, value }) => (
        <View key={label} className="w-1/2 gap-1 p-4">
          <Text variant="small" className="text-muted-foreground">
            {label}
          </Text>
          <Text selectable className="text-2xl font-semibold">
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
}
