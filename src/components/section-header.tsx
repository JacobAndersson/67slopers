import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

type SectionHeaderProps = {
  title: string;
  /** A quiet text action on the right, such as "View all". */
  actionLabel?: string;
  onAction?: () => void;
  /** Anything else on the right: a muted summary, extra buttons. */
  children?: ReactNode;
  className?: string;
};

/** A 22/800 section title with an optional muted action (design/rivet/app/ui.py `section`). */
export function SectionHeader({
  title,
  actionLabel,
  onAction,
  children,
  className,
}: SectionHeaderProps) {
  return (
    <View className={cn('flex-row items-center justify-between gap-3', className)}>
      <Text className="type-title" role="heading">
        {title}
      </Text>
      <View className="shrink flex-row items-center gap-1">
        {children}
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={12} accessibilityRole="button">
            <Text className="type-sub text-muted">{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** A 12/800 caps label in muted ink: card eyebrows, list groups. */
export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <Text className={cn('type-label text-muted', className)}>{children}</Text>;
}

/** The 34/900 title of a screen, with an optional muted line under it. */
export function LargeTitle({
  title,
  sub,
  className,
}: {
  title: string;
  sub?: ReactNode;
  className?: string;
}) {
  return (
    <View className={cn('gap-1.5', className)}>
      <Text className="type-large" role="heading">
        {title}
      </Text>
      {sub ? <Text className="type-sub text-muted">{sub}</Text> : null}
    </View>
  );
}
