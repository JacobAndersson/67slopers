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

const buttonVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-2 rounded-md shadow-none',
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive whitespace-nowrap outline-none transition-[color,background-color,border-color,box-shadow,transform] focus-visible:ring-[3px] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.97] motion-reduce:active:scale-100",
    })
  ),
  {
    variants: {
      variant: {
        default: cn(
          'bg-primary active:bg-primary/90 shadow-sm shadow-black/5',
          Platform.select({ web: 'hover:bg-primary/90' })
        ),
        destructive: cn(
          'bg-destructive active:bg-destructive/90  shadow-sm shadow-black/5',
          Platform.select({
            web: 'hover:bg-destructive/90 focus-visible:ring-destructive/20 ',
          })
        ),
        outline: cn(
          'border-border bg-background active:bg-accent    border shadow-sm shadow-black/5',
          Platform.select({
            web: 'hover:bg-accent ',
          })
        ),
        secondary: cn(
          'bg-secondary active:bg-secondary/80 shadow-sm shadow-black/5',
          Platform.select({ web: 'hover:bg-secondary/80' })
        ),
        ghost: cn('active:bg-accent ', Platform.select({ web: 'hover:bg-accent ' })),
        link: '',
      },
      size: {
        default: cn('h-11 px-4 py-2', Platform.select({ web: 'has-[>svg]:px-3' })),
        sm: cn('h-10 gap-1.5 rounded-md px-3', Platform.select({ web: 'has-[>svg]:px-2.5' })),
        lg: cn('h-14 rounded-lg px-6', Platform.select({ web: 'has-[>svg]:px-4' })),
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva(
  cn(
    'text-foreground text-sm font-medium',
    Platform.select({ web: 'pointer-events-none transition-colors' })
  ),
  {
    variants: {
      variant: {
        default: 'text-primary-foreground',
        destructive: 'text-destructive-foreground',
        outline: cn(
          'group-active:text-accent-foreground',
          Platform.select({ web: 'group-hover:text-accent-foreground' })
        ),
        secondary: 'text-secondary-foreground',
        ghost: 'group-active:text-accent-foreground',
        link: cn(
          'text-primary group-active:underline',
          Platform.select({ web: 'underline-offset-4 hover:underline group-hover:underline' })
        ),
      },
      size: {
        default: '',
        sm: '',
        lg: '',
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
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <ButtonPressable
        className={cn(props.disabled && 'opacity-50', buttonVariants({ variant, size }), className)}
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
