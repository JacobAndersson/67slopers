import type { Icon as PhosphorIcon, IconWeight } from 'phosphor-react-native';
import { Pressable, type PressableProps } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

type IconButtonProps = Omit<PressableProps, 'children'> & {
  icon: PhosphorIcon;
  /** ghost: surface with a hairline; primary: solid Ink; plain: no chrome. */
  variant?: 'ghost' | 'primary' | 'plain';
  /** Diameter in pt: 48 by default, 64 for anything touched mid-session. */
  size?: number;
  iconSize?: number;
  weight?: IconWeight;
  /** Spoken name; icon buttons always need one. */
  label: string;
  className?: string;
  iconClassName?: string;
};

/** A round button with one icon (design/rivet/app/ui.py `icon_button`). */
export function IconButton({
  icon,
  variant = 'ghost',
  size = 48,
  iconSize = 22,
  weight,
  label,
  className,
  iconClassName,
  ...props
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={size < 48 ? (48 - size) / 2 : undefined}
      className={cn(
        'items-center justify-center rounded-full active:opacity-80',
        variant === 'ghost' && 'border border-line-strong bg-surface',
        variant === 'primary' && 'bg-action',
        props.disabled && 'opacity-40',
        className
      )}
      style={{ width: size, height: size }}
      {...props}>
      <Icon
        as={icon}
        size={iconSize}
        weight={weight}
        className={cn(variant === 'primary' ? 'text-on-action' : 'text-text', iconClassName)}
      />
    </Pressable>
  );
}
