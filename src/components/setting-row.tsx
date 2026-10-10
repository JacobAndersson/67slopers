import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { Children, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Switch } from '@/components/switch';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/** A card of rows separated by hairlines. */
export function SettingGroup({ title, children }: { title?: string; children: ReactNode }) {
  const rows = Children.toArray(children);
  return (
    <View className="gap-2">
      {title ? (
        <Text className="text-xs uppercase text-muted-foreground font-medium">{title}</Text>
      ) : null}
      <View className="rounded-2xl border border-border bg-card px-4">
        {rows.map((row, index) => (
          <View key={index} className={cn(index > 0 && 'border-t border-border')}>
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
  /** A green dot before the title: something is connected. */
  live?: boolean;
  onPress?: () => void;
  /** Makes the row a switch. */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  children?: ReactNode;
};

export function SettingRow({
  title,
  description,
  value,
  live,
  onPress,
  checked,
  onCheckedChange,
  children,
}: SettingRowProps) {
  const toggles = checked !== undefined && onCheckedChange;
  return (
    <Pressable
      onPress={toggles ? () => onCheckedChange(!checked) : onPress}
      disabled={!toggles && !onPress}
      accessibilityRole={toggles ? 'switch' : onPress ? 'button' : undefined}
      accessibilityState={toggles ? { checked } : undefined}
      className="min-h-14 flex-row items-center gap-3 py-2 active:opacity-70">
      {live ? <View className="size-2.5 rounded-full bg-hold-start" /> : null}
      <View className="flex-1 gap-0.5">
        <Text className="font-medium">{title}</Text>
        {description ? (
          <Text className="text-xs text-muted-foreground font-medium">{description}</Text>
        ) : null}
      </View>
      {children}
      {value ? (
        <Text variant="muted" numberOfLines={1} className="max-w-[55%]">
          {value}
        </Text>
      ) : null}
      {toggles ? (
        <Switch checked={checked} />
      ) : onPress ? (
        <Icon as={CaretRightIcon} size={18} className="text-muted-foreground" />
      ) : null}
    </Pressable>
  );
}
