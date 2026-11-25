import { TextClassContext } from '@/components/ui/text';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { useEffect } from 'react';
import { Platform, Pressable, type GestureResponderEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// Native only: on web the press scale is the `active:` class, and an inline transform from
// Reanimated would override it.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const ButtonPressable = Platform.OS === 'web' ? Pressable : AnimatedPressable;

const PRESS_SCALE = 0.97;
const PRESS_IN_MS = 100;
const PRESS_OUT_MS = 160;

// Rivet buttons are Ink pills (design/rivet/app/ui.py `button`): primary is solid Night (Snow in
// dark), ghost the same pill as a hairline, quiet text only. Destructive actions are never red:
// they use the ghost pill with their icon. Sizes: lg 64 (mid-session, sheets), default 52, sm 48.
const buttonVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-2 rounded-full',
    Platform.select({
      web: 'focus-visible:ring-text/40 whitespace-nowrap outline-none transition-[color,background-color,border-color,box-shadow,transform] focus-visible:ring-[3px] disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.97] motion-reduce:active:scale-100',
    })
  ),
  {
    variants: {
      variant: {
        default: 'bg-action active:opacity-90',
        destructive: 'border-[1.5px] border-text active:bg-raised',
        outline: 'border-[1.5px] border-text active:bg-raised',
        secondary: 'border-[1.5px] border-text active:bg-raised',
        ghost: 'active:bg-raised',
        link: '',
      },
      size: {
        default: 'h-[52px] px-6',
        sm: 'h-12 gap-1.5 px-5',
        lg: 'h-16 px-7',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva(
  cn('text-text type-body-b', Platform.select({ web: 'pointer-events-none transition-colors' })),
  {
    variants: {
      variant: {
        default: 'text-on-action',
        destructive: 'text-text',
        outline: 'text-text',
        secondary: 'text-text',
        ghost: 'text-text',
        link: cn(
          'text-text group-active:underline',
          Platform.select({ web: 'underline-offset-4 hover:underline' })
        ),
      },
      size: {
        default: '',
        sm: 'text-base',
        lg: 'text-lg',
        icon: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants>;

/** Every button dips slightly under the finger; the colour change alone is too quiet. */
function Button({ className, variant, size, style, onPressIn, onPressOut, ...props }: ButtonProps) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const disabled = !!props.disabled;

  // A button disabled mid-press (the stepper reaching its limit) may never get onPressOut.
  useEffect(() => {
    if (disabled) scale.set(1);
  }, [disabled, scale]);

  // Web scales through the `active:` class instead.
  const handlePressIn = (event: GestureResponderEvent) => {
    if (!reduced && Platform.OS !== 'web') {
      scale.set(withTiming(PRESS_SCALE, { duration: PRESS_IN_MS, easing: EASE_OUT }));
    }
    onPressIn?.(event);
  };
  const handlePressOut = (event: GestureResponderEvent) => {
    if (Platform.OS !== 'web') {
      scale.set(withTiming(1, { duration: PRESS_OUT_MS, easing: EASE_OUT }));
    }
    onPressOut?.(event);
  };

  return (
    <TextClassContext.Provider
      value={cn(buttonTextVariants({ variant, size }), props.disabled && 'text-disabled-fg')}>
      <ButtonPressable
        className={cn(
          buttonVariants({ variant, size }),
          props.disabled && variant !== 'ghost' && 'border-0 bg-disabled',
          className
        )}
        role="button"
        {...props}
        style={Platform.OS === 'web' ? style : [style as never, pressStyle]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      />
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
