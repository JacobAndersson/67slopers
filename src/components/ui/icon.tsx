import { cssInterop } from 'nativewind';
import type { Icon as PhosphorIcon, IconProps as PhosphorIconProps } from 'phosphor-react-native';
import * as React from 'react';
import { Platform } from 'react-native';

import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';

type IconProps = PhosphorIconProps & {
  as: PhosphorIcon;
  className?: string;
};

function IconImpl({ as: IconComponent, color, ...props }: IconProps) {
  // Web keeps NativeWind colors in CSS; nativeStyleToProp extracts them on native.
  return (
    <IconComponent
      color={color ?? (Platform.OS === 'web' ? 'currentColor' : undefined)}
      {...props}
    />
  );
}

cssInterop(IconImpl, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      color: 'color',
      height: 'size',
      width: 'size',
    },
  },
});

/**
 * Phosphor icon with NativeWind `className` support. Inherits the surrounding text
 * color (e.g. inside a Button) unless a `text-*` class overrides it.
 *
 * @example
 * <Icon as={PlayIcon} className="size-6 text-primary-foreground" />
 */
function Icon({
  as: IconComponent,
  className,
  size = 16,
  weight = 'regular',
  ...props
}: IconProps) {
  const textClass = React.useContext(TextClassContext);
  return (
    <IconImpl
      as={IconComponent}
      className={cn('text-foreground', textClass, className)}
      size={size}
      weight={weight}
      {...props}
    />
  );
}

export { Icon };
