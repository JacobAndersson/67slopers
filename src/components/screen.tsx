import type { PropsWithChildren } from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/** Height of the native tab bar, which content must clear on mobile. */
const BOTTOM_TAB_INSET = Platform.select({ ios: 50, android: 80 }) ?? 0;

type ScreenProps = PropsWithChildren<{
  title: string;
  className?: string;
}>;

/** Shared page frame: safe area, centered max-width column, and room for the tab bar. */
export function Screen({ title, className, children }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 flex-row justify-center bg-background">
      <View
        className={cn(
          'w-full max-w-3xl flex-1 gap-4 px-6',
          // On web the tab bar floats at the top of the page instead of the bottom.
          Platform.OS === 'web' ? 'pt-24' : 'pt-6',
          className
        )}
        style={{
          paddingTop: Platform.OS === 'web' ? undefined : insets.top + 24,
          paddingBottom: insets.bottom + BOTTOM_TAB_INSET + 16,
        }}>
        <Text role="heading" aria-level={1} className="text-4xl tracking-tight font-bold">
          {title}
        </Text>
        {children}
      </View>
    </View>
  );
}
