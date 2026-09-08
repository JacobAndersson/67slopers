import { BicepsFlexedIcon, SnailIcon, ThumbsUpIcon, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { FEEL_LABELS, FEELS, type Feel } from '@/lib/store/types';
import { cn } from '@/lib/utils';

export const FEEL_ICONS: Record<Feel, LucideIcon> = {
  weak: SnailIcon,
  normal: ThumbsUpIcon,
  strong: BicepsFlexedIcon,
};

type FeelPickerProps = {
  value?: Feel;
  onChange: (feel: Feel) => void;
};

/** "How did you feel?" as three big icon buttons. Tapping the selected one clears it. */
export function FeelPicker({ value, onChange }: FeelPickerProps) {
  return (
    <View className="flex-row gap-3">
      {FEELS.map((feel) => {
        const selected = value === feel;
        return (
          <Pressable
            key={feel}
            onPress={() => onChange(feel)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={FEEL_LABELS[feel]}
            className={cn(
              'flex-1 items-center gap-2 rounded-lg border-2 border-border bg-card py-4 active:bg-accent',
              selected && 'border-primary bg-primary'
            )}>
            <Icon
              as={FEEL_ICONS[feel]}
              className={cn('size-9', selected ? 'text-primary-foreground' : 'text-foreground')}
            />
            <Text className={cn('font-semibold', selected && 'text-primary-foreground')}>
              {FEEL_LABELS[feel]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Compact "felt strong" chip for lists and summaries. */
export function FeelBadge({ feel, size = 'sm' }: { feel: Feel; size?: 'sm' | 'lg' }) {
  const large = size === 'lg';
  return (
    <View
      className={cn(
        'flex-row items-center self-start rounded-full bg-secondary',
        large ? 'gap-2 px-4 py-2' : 'gap-1.5 px-2.5 py-1'
      )}>
      <Icon as={FEEL_ICONS[feel]} className={large ? 'size-6' : 'size-4'} />
      <Text className={cn('font-semibold', large ? 'text-lg' : 'text-sm')}>
        Felt {FEEL_LABELS[feel].toLowerCase()}
      </Text>
    </View>
  );
}
