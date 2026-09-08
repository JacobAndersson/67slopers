import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

type SectionHeaderProps = {
  title: string;
  /** Renders a "View all" style action on the right when provided. */
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
};

export function SectionHeader({ title, actionLabel, onAction, children }: SectionHeaderProps) {
  return (
    <View className="mt-2 flex-row items-center justify-between">
      <Text variant="h4">{title}</Text>
      {children}
      {actionLabel && onAction ? (
        <Button variant="ghost" size="sm" onPress={onAction}>
          <Text>{actionLabel}</Text>
        </Button>
      ) : null}
    </View>
  );
}
