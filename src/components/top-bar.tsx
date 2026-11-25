import { router } from 'expo-router';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { CaretDownIcon } from 'phosphor-react-native/src/icons/CaretDown';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

const LEFT = {
  back: { icon: CaretLeftIcon, label: 'Back' },
  close: { icon: XIcon, label: 'Close' },
  down: { icon: CaretDownIcon, label: 'Close' },
} satisfies Record<string, { icon: PhosphorIcon; label: string }>;

/** Gap between the safe area and the top bar. */
export const TOP_BAR_GAP = 6;

type TopBarProps = {
  /** The corner button: back (default), close, a down caret, or none. */
  left?: keyof typeof LEFT | null;
  onLeft?: () => void;
  /** A small centred title; large titles are set below the bar instead. */
  title?: string;
  /** Set the small title beside the corner button instead of centred (a position, "6 of 151"). */
  titleAlign?: 'center' | 'left';
  /** Round buttons or a text action on the right. */
  right?: ReactNode;
  className?: string;
};

/**
 * The bar of a pushed screen (design/rivet/app/ui.py `nav`): 48 pt round buttons in the
 * corners, an optional centred title. Sits under the status bar; the screen scrolls under it.
 */
export function TopBar({
  left = 'back',
  onLeft,
  title,
  titleAlign = 'center',
  right,
  className,
}: TopBarProps) {
  const insets = useSafeAreaInsets();
  const corner = left ? LEFT[left] : null;
  return (
    <View
      className={cn('flex-row items-center justify-between bg-canvas px-5', className)}
      style={{ paddingTop: insets.top + TOP_BAR_GAP, height: insets.top + TOP_BAR_GAP + 56 }}>
      <View className="min-w-12 flex-row">
        {corner ? (
          <IconButton
            icon={corner.icon}
            label={corner.label}
            onPress={onLeft ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
          />
        ) : null}
      </View>
      {title ? (
        <Text
          className={cn(
            'type-row absolute inset-x-20',
            titleAlign === 'center' ? 'text-center' : 'text-left'
          )}
          style={{ top: insets.top + TOP_BAR_GAP + 13 }}
          numberOfLines={1}
          role="heading">
          {title}
        </Text>
      ) : null}
      <View className="min-w-12 flex-row items-center justify-end gap-1">{right}</View>
    </View>
  );
}
