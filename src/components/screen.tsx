import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/lib/utils';

type ScreenProps = PropsWithChildren<{
  /** Scroll the content (default) or keep it fixed. */
  scroll?: boolean;
  /** Pinned above the bottom safe area, for the screen's primary action. */
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}>;

const CONTENT = 'w-full max-w-3xl self-center gap-4 px-6 pt-4 pb-6';

/** Shared page frame under the native header: centered column, optional pinned footer. */
export function Screen({
  scroll = true,
  footer,
  className,
  contentClassName,
  children,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className={cn('flex-1 bg-background', className)}>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={cn(CONTENT, contentClassName)}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View className={cn('flex-1', CONTENT, contentClassName)}>{children}</View>
      )}
      {footer ? (
        <View
          className="w-full max-w-3xl self-center border-t border-border bg-background px-6 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}
