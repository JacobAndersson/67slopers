import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/**
 * Facts on one card, two across (design: climb-session, log-session): a caption over a 28 pt
 * number, the cells divided by hairlines that stop short of the card's edge.
 */
export function MetricGrid({
  items,
  className,
}: {
  items: { label: string; value: string }[];
  className?: string;
}) {
  const rows: (typeof items)[] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return (
    <View className={cn('rounded-card border border-line bg-surface px-5 py-2.5', className)}>
      {rows.map((row, r) => (
        <View key={r} className={cn('flex-row', r > 0 && 'border-t border-line')}>
          {row.map(({ label, value }, c) => (
            <View
              key={label}
              accessible
              accessibilityLabel={`${label}: ${value}`}
              className={cn(
                'flex-1 gap-0.5 py-3',
                c === 0 ? 'pl-1 pr-4' : 'border-l border-line pl-5'
              )}>
              <Text className="type-caption text-muted">{label}</Text>
              <Text selectable className="type-bignum text-[28px] leading-[30px]" numberOfLines={1}>
                {value}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
