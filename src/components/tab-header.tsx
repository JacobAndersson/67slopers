import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

/** The large title of a dock-level screen, with its actions on the right. */
export function TabHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <View className="min-h-11 flex-row items-center justify-between">
      <Text className="text-3xl font-bold" role="heading">
        {title}
      </Text>
      <View className="flex-row items-center gap-1">{children}</View>
    </View>
  );
}
