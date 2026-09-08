import { MinusIcon, PlusIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useScreenScroll } from '@/components/screen';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

type StepperProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  /** Step for the − / + buttons. Typed values are only clamped to min and max. */
  step?: number;
  /** How the value reads, e.g. seconds as "7s" or "3:00". */
  format?: (value: number) => string;
  /** `clock` edits minutes and seconds in two fields; `number` edits one whole number. */
  inputMode?: 'number' | 'clock';
  hint?: string;
};

const HOLD_DELAY_MS = 300;
const HOLD_INTERVAL_MS = 80;

const INPUT_CLASS =
  'h-11 min-w-14 rounded-md border border-border bg-background px-2 text-center text-xl font-semibold text-foreground';

/**
 * Labelled − / + control with 44 px targets and hold-to-repeat. Tapping the value opens
 * direct entry: one number, or minutes and seconds side by side for clock values.
 */
export function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
  inputMode = 'number',
  hint,
}: StepperProps) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ value, onChange });
  useEffect(() => {
    latest.current = { value, onChange };
  });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftMinutes, setDraftMinutes] = useState('');
  const [draftSeconds, setDraftSeconds] = useState('');
  const secondsRef = useRef<TextInput>(null);
  const rowRef = useRef<View>(null);
  const screenScroll = useScreenScroll();

  // When the keyboard opens for this row, scroll it above the keyboard if it is covered.
  useEffect(() => {
    if (!editing || !screenScroll) return;
    const sub = Keyboard.addListener('keyboardDidShow', (e) => {
      rowRef.current?.measureInWindow((_x, y, _w, h) => {
        const overlap = y + h + 24 - e.endCoordinates.screenY;
        if (overlap > 0) screenScroll.scrollBy(overlap);
      });
    });
    return () => sub.remove();
  }, [editing, screenScroll]);

  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const bump = (direction: 1 | -1) => {
    const { value: current, onChange: change } = latest.current;
    const nextValue = clamp(current + direction * step);
    if (nextValue !== current) change(nextValue);
  };

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const startHold = (direction: 1 | -1) => {
    stop();
    const repeat = () => {
      bump(direction);
      timer.current = setTimeout(repeat, HOLD_INTERVAL_MS);
    };
    timer.current = setTimeout(repeat, HOLD_DELAY_MS);
  };
  useEffect(() => stop, []);

  const beginEdit = () => {
    if (inputMode === 'clock') {
      setDraftMinutes(String(Math.floor(value / 60)));
      setDraftSeconds(String(value % 60).padStart(2, '0'));
    } else {
      setDraft(String(value));
    }
    setEditing(true);
  };

  const commit = () => {
    const parse = (text: string) => {
      const n = parseInt(text.replace(/\D/g, ''), 10);
      return Number.isFinite(n) ? n : 0;
    };
    const typed =
      inputMode === 'clock'
        ? parse(draftMinutes) * 60 + Math.min(59, parse(draftSeconds))
        : parse(draft);
    const nextValue = clamp(typed);
    if (nextValue !== value) onChange(nextValue);
    setEditing(false);
  };

  return (
    <View ref={rowRef} className="flex-row items-center gap-3 py-1">
      <View className="flex-1 gap-0.5">
        <Text className="font-medium">{label}</Text>
        {hint ? <Text variant="muted">{hint}</Text> : null}
      </View>
      <Button
        variant="outline"
        size="icon"
        className="h-11 w-11"
        disabled={editing || value <= min}
        onPress={() => bump(-1)}
        onPressIn={() => startHold(-1)}
        onPressOut={stop}
        accessibilityLabel={`Decrease ${label}`}>
        <Icon as={MinusIcon} className="size-5" />
      </Button>

      {editing ? (
        inputMode === 'clock' ? (
          <View className="flex-row items-center gap-1">
            <TextInput
              className={cn(INPUT_CLASS, 'font-semibold')}
              value={draftMinutes}
              onChangeText={setDraftMinutes}
              keyboardType="number-pad"
              maxLength={2}
              autoFocus
              selectTextOnFocus
              returnKeyType="next"
              onSubmitEditing={() => secondsRef.current?.focus()}
              blurOnSubmit={false}
              accessibilityLabel={`${label} minutes`}
            />
            <Text className="text-xl font-semibold">:</Text>
            <TextInput
              ref={secondsRef}
              className={cn(INPUT_CLASS, 'font-semibold')}
              value={draftSeconds}
              onChangeText={setDraftSeconds}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={commit}
              onBlur={commit}
              accessibilityLabel={`${label} seconds`}
            />
          </View>
        ) : (
          <TextInput
            className={cn(INPUT_CLASS, 'font-semibold')}
            value={draft}
            onChangeText={setDraft}
            keyboardType="number-pad"
            maxLength={3}
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={commit}
            onBlur={commit}
            accessibilityLabel={`${label} value`}
          />
        )
      ) : (
        <Pressable
          onPress={beginEdit}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${label}`}
          className="h-11 min-w-16 items-center justify-center rounded-md border border-dashed border-border px-2 active:bg-accent">
          <Text className="text-xl font-semibold">{format ? format(value) : String(value)}</Text>
        </Pressable>
      )}

      <Button
        variant="outline"
        size="icon"
        className="h-11 w-11"
        disabled={editing || value >= max}
        onPress={() => bump(1)}
        onPressIn={() => startHold(1)}
        onPressOut={stop}
        accessibilityLabel={`Increase ${label}`}>
        <Icon as={PlusIcon} className="size-5" />
      </Button>
    </View>
  );
}
