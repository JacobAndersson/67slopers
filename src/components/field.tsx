import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react';
import { Keyboard, Platform, Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { useScreenScroll } from '@/components/screen';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useAppTheme } from '@/lib/use-theme';

type FieldProps = TextInputProps & {
  /** A caption above the box; also its spoken name. */
  label?: string;
  /** Shown under the box, with a warning icon in it; the box outline goes heavier. */
  error?: string | null;
  /** A muted line under the box when there is no error. */
  hint?: ReactNode;
  className?: string;
  inputClassName?: string;
};

/**
 * A text field (design/rivet/app/ui.py `field`): caption, a 52 pt white box with radius 12 and a
 * hairline that turns Ink when focused, and a plain-words error under it. Errors are never red.
 */
export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, error, hint, className, inputClassName, multiline, onFocus, onBlur, ...props },
  ref
) {
  const { theme } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const box = useRef<View>(null);
  const screenScroll = useScreenScroll();

  // Pull the field above the keyboard when it would cover it.
  useEffect(() => {
    if (!focused || !screenScroll) return;
    const lift = (keyboardTop: number) =>
      box.current?.measureInWindow((_x, y, _w, h) => {
        const overlap = y + h + 24 - keyboardTop;
        if (overlap > 0) screenScroll.scrollBy(overlap);
      });
    const sub = Keyboard.addListener('keyboardDidShow', (e) => lift(e.endCoordinates.screenY));
    const metrics = Platform.OS === 'web' ? undefined : Keyboard.metrics?.();
    if (metrics) lift(metrics.screenY);
    return () => sub.remove();
  }, [focused, screenScroll]);

  return (
    <View ref={box} className={cn('gap-2', className)}>
      {label ? <Text className="type-caption text-muted">{label}</Text> : null}
      <View
        className={cn(
          'flex-row items-center rounded-input bg-surface',
          error
            ? 'border-2 border-text'
            : focused
              ? 'border-[1.5px] border-text'
              : 'border border-line-strong'
        )}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={theme.muted}
          cursorColor={theme.text}
          selectionColor={theme.text}
          multiline={multiline}
          className={cn(
            'flex-1 px-4 text-[17px] text-text font-semibold',
            multiline ? 'min-h-[88px] py-3.5' : 'h-[52px]',
            inputClassName
          )}
          style={multiline ? { textAlignVertical: 'top' } : undefined}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {error ? (
          <Icon as={WarningCircleIcon} weight="fill" size={22} className="mr-4 text-text" />
        ) : null}
      </View>
      {error ? (
        <Text className="type-caption" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text className="type-caption text-muted">{hint}</Text>
      ) : null}
    </View>
  );
});

/** A 48 pt search pill with a magnifier and a clear button. */
export function SearchField({
  value,
  onChangeText,
  placeholder = 'Search',
  className,
  trailing,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
  /** Something at the end of the pill, such as a filter button. */
  trailing?: ReactNode;
}) {
  const { theme } = useAppTheme();
  return (
    <View
      className={cn(
        'h-12 flex-row items-center rounded-full border border-line-strong bg-surface pl-4 pr-1.5',
        className
      )}>
      <Icon as={MagnifyingGlassIcon} size={20} className="text-muted" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        cursorColor={theme.text}
        selectionColor={theme.text}
        accessibilityLabel={placeholder}
        returnKeyType="search"
        className="h-12 flex-1 px-2.5 text-[17px] text-text font-semibold"
      />
      {value ? (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          className="size-9 items-center justify-center rounded-full active:bg-raised">
          <Icon as={XIcon} size={18} className="text-muted" />
        </Pressable>
      ) : null}
      {trailing}
    </View>
  );
}
