import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { Children, type ReactNode } from 'react';
import { View } from 'react-native';

import { useLargeText } from '@/hooks/use-large-text';
import { ScalePressable } from '@/components/scale-pressable';
import { Label } from '@/components/section-header';
import { Switch } from '@/components/switch';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/**
 * A card of rows (design/rivet/app/ui.py `setting_row` on a radius-24 card): a caps label
 * above, rows divided by hairlines that start under the text.
 */
export function SettingGroup({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View className={cn('gap-2.5', className)}>
      {title ? <Label>{title}</Label> : null}
      <View className="rounded-3xl border border-line bg-surface px-5">
        {rows.map((row, index) => (
          <View key={index} className={cn(index > 0 && 'border-t border-line')}>
            {row}
          </View>
        ))}
      </View>
    </View>
  );
}

type SettingRowProps = {
  title: string;
  description?: string;
  /** Shown on the right, before the chevron. */
  value?: string;
  /** A dot before the value: something is connected. */
  live?: boolean;
  /** A 24 pt icon before the title. */
  icon?: PhosphorIcon;
  onPress?: () => void;
  /** Makes the row a switch. */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  children?: ReactNode;
};

/** One row: 17/800 title, an optional caption, then a switch or a muted value and a caret. */
export function SettingRow({
  title,
  description,
  value,
  live,
  icon,
  onPress,
  checked,
  onCheckedChange,
  children,
}: SettingRowProps) {
  const toggles = checked !== undefined && onCheckedChange;
  // Large text: the value moves under the title instead of squeezing it.
  const large = useLargeText();
  const valueView = value ? (
    <View
      className={large ? 'flex-row items-center gap-1.5' : 'shrink flex-row items-center gap-1.5'}>
      {live ? <View className="size-2 rounded-full bg-text" /> : null}
      <Text className="type-sub text-muted" numberOfLines={large ? 2 : 1}>
        {value}
      </Text>
    </View>
  ) : null;
  return (
    <ScalePressable
      feedback="dim"
      onPress={toggles ? () => onCheckedChange(!checked) : onPress}
      disabled={!toggles && !onPress}
      accessibilityRole={toggles ? 'switch' : onPress ? 'button' : undefined}
      accessibilityState={toggles ? { checked } : undefined}
      className="min-h-16 flex-row items-center gap-2 py-3">
      {icon ? <Icon as={icon} size={24} className="mr-2" /> : null}
      <View className="flex-1 gap-0.5">
        <Text className="type-body-b" numberOfLines={large ? undefined : 1}>
          {title}
        </Text>
        {description ? <Text className="type-caption text-muted">{description}</Text> : null}
        {large ? valueView : null}
      </View>
      {children}
      {large ? null : valueView}
      {toggles ? (
        <Switch checked={checked} />
      ) : onPress ? (
        <Icon as={CaretRightIcon} size={20} className="text-muted" />
      ) : null}
    </ScalePressable>
  );
}
