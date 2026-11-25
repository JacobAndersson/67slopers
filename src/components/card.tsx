import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { ScalePressable } from '@/components/scale-pressable';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/** A white surface (Night in dark) with radius 28 and a hairline (design/rivet/app/ui.py `card`). */
export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return (
    <View className={cn('rounded-card border border-line bg-surface', className)} {...props} />
  );
}

/** A pressable card that dips under the finger. */
export function PressableCard({
  className,
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  emphasis,
}: {
  className?: string;
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** A Night outline instead of the hairline: the card that needs an answer. */
  emphasis?: boolean;
}) {
  return (
    <ScalePressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      className={cn(
        'rounded-card bg-surface',
        emphasis ? 'border-[1.5px] border-text' : 'border border-line',
        className
      )}>
      {children}
    </ScalePressable>
  );
}

/** The 44 pt raised tile that carries a row's icon; `board` tints it Dusk for board sessions. */
export function IconTile({
  icon,
  board,
  size = 44,
  className,
}: {
  icon: PhosphorIcon;
  board?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <View
      className={cn(
        'items-center justify-center rounded-tile',
        board ? 'bg-board-soft' : 'bg-raised',
        className
      )}
      style={{ width: size, height: size }}>
      <Icon as={icon} size={22} className="text-text" />
    </View>
  );
}

type ListRowProps = {
  title: string;
  sub?: ReactNode;
  icon?: PhosphorIcon;
  /** Tint the icon tile Dusk: a board session or problem. */
  board?: boolean;
  /** Something drawn in place of the icon tile (a wall thumbnail). */
  thumb?: ReactNode;
  /** Muted text at the end, or a big value with a caption under it. */
  right?: ReactNode;
  rightSub?: string;
  chevron?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Row height: 72 by default. */
  height?: number;
  className?: string;
  accessibilityLabel?: string;
};

/** A list row on its own card (design/rivet/app/ui.py `row`). */
export function ListRow({
  title,
  sub,
  icon,
  board,
  thumb,
  right,
  rightSub,
  chevron,
  onPress,
  onLongPress,
  height = 72,
  className,
  accessibilityLabel,
}: ListRowProps) {
  return (
    <ScalePressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={!onPress && !onLongPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      className={cn(
        'flex-row items-center gap-3.5 rounded-card border border-line bg-surface pl-3.5 pr-4',
        className
      )}
      style={{ minHeight: height }}>
      {icon ? <IconTile icon={icon} board={board} /> : thumb}
      <View className={cn('flex-1 gap-0.5 py-3', !icon && !thumb && 'pl-0.5')}>
        <Text className="type-row" numberOfLines={1}>
          {title}
        </Text>
        {sub ? (
          <Text className="type-caption text-muted" numberOfLines={2}>
            {sub}
          </Text>
        ) : null}
      </View>
      {right !== undefined ? (
        rightSub ? (
          <View className="items-end">
            <Text className="type-num">{right}</Text>
            <Text className="type-caption text-muted">{rightSub}</Text>
          </View>
        ) : typeof right === 'string' ? (
          <Text className="type-sub text-muted">{right}</Text>
        ) : (
          right
        )
      ) : null}
      {chevron ? <Icon as={CaretRightIcon} size={20} className="text-muted" /> : null}
    </ScalePressable>
  );
}
