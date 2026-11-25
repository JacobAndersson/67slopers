import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

/** The large title of a dock-level screen, with its round buttons on the right. */
export function TabHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <View className="min-h-12 flex-row items-center justify-between">
      <Text className="type-large" role="heading">
        {title}
      </Text>
      <View className="flex-row items-center gap-3">{children}</View>
    </View>
  );
}
