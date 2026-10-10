import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

type HomeCardProps = {
  /** Which way of training this is, in small capitals. */
  label: string;
  title: string;
  detail: string;
  /** The picture on the left: an icon tile or a problem. */
  leading: ReactNode;
  onPress: () => void;
  accessibilityHint?: string;
  /** A button on the right that does the thing in one tap. Without it the card shows a caret. */
  action?: ReactNode;
  /** Something not set up yet: an outline that is easy to leave alone. */
  quiet?: boolean;
};

/** One way to train on Home. Every kind is the same size, so none of them leads. */
export function HomeCard({
  label,
  title,
  detail,
  leading,
  onPress,
  accessibilityHint,
  action,
  quiet,
}: HomeCardProps) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-3 rounded-2xl border border-border p-4',
        !quiet && 'bg-card'
      )}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityHint={accessibilityHint}
        className="flex-1 flex-row items-center gap-4 active:opacity-70">
        {leading}
        <View className="flex-1 gap-1">
          <Text className="text-xs uppercase text-muted-foreground font-medium">{label}</Text>
          <Text className="font-semibold" numberOfLines={1}>
            {title}
          </Text>
          <Text className="text-xs text-muted-foreground font-medium" numberOfLines={1}>
            {detail}
          </Text>
        </View>
        {action ? null : <Icon as={CaretRightIcon} size={18} className="text-muted-foreground" />}
      </Pressable>
      {action}
    </View>
  );
}

/** The square on the left of a card that has no picture of its own. */
export function HomeCardTile({ children, quiet }: { children: ReactNode; quiet?: boolean }) {
  return (
    <View
      className={cn(
        'h-[60px] w-[52px] items-center justify-center rounded-xl',
        quiet ? 'bg-muted' : 'bg-secondary'
      )}>
      {children}
    </View>
  );
}
