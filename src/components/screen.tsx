import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
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

type ScreenScroll = {
  /** Scrolls the content by `dy` pixels (positive = further down the page). */
  scrollBy: (dy: number) => void;
};

const ScreenScrollContext = createContext<ScreenScroll | null>(null);

/** Lets inputs deep in a scrolling screen pull themselves above the keyboard. */
export function useScreenScroll(): ScreenScroll | null {
  return useContext(ScreenScrollContext);
}

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
  const scrollRef = useRef<ScrollView>(null);
  const offset = useRef(0);
  const api = useMemo<ScreenScroll>(
    () => ({
      scrollBy: (dy) =>
        scrollRef.current?.scrollTo({ y: Math.max(0, offset.current + dy), animated: true }),
    }),
    []
  );

  return (
    <ScreenScrollContext.Provider value={api}>
      <View className={cn('flex-1 bg-background', className)}>
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            className="flex-1"
            contentContainerClassName={cn(CONTENT, contentClassName)}
            keyboardShouldPersistTaps="handled"
            onScroll={(e) => {
              offset.current = e.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={64}>
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
    </ScreenScrollContext.Provider>
  );
}
