import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/**
 * A row of small figures on cards, value over caption (design: climb-problem-scrolled, three
 * across; climb-circuit-done, four across and `compact`).
 */
export function StatPills({
  items,
  compact,
}: {
  items: { value: string; label: string }[];
  compact?: boolean;
}) {
  return (
    <View className="flex-row gap-2">
      {items.map(({ value, label }) => (
        <View
          key={label}
          className={cn(
            'flex-1 items-center justify-center gap-1 border border-line bg-surface px-1 py-3',
            compact ? 'min-h-[76px] rounded-[18px]' : 'min-h-[84px] rounded-card'
          )}>
          <Text className={compact ? 'type-row' : 'type-num'} numberOfLines={1}>
            {value}
          </Text>
          <Text className="type-caption text-muted" numberOfLines={1}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}
