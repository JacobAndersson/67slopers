import { MinusIcon } from 'phosphor-react-native/src/icons/Minus';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, TextInput, View } from 'react-native';

import { ScalePressable } from '@/components/scale-pressable';
import { Icon } from '@/components/ui/icon';
import { useScreenScroll } from '@/components/screen';
import { Text } from '@/components/ui/text';
import { parseStepperInput } from '@/lib/stepper-input';
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
  /** Show the label as a caption above the pill (it is always spoken). */
  showLabel?: boolean;
};

const HOLD_DELAY_MS = 300;
const HOLD_INTERVAL_MS = 80;

const INPUT_CLASS =
  'type-num h-12 min-w-16 rounded-input border-[1.5px] border-text bg-surface px-2 text-center text-[26px] text-text';

/**
 * − value + on one 64 pt pill (design/rivet/app/ui.py `stepper`): both buttons the same weight,
 * hold to repeat. Tapping the value opens
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
  showLabel = true,
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
  // A hold that has started repeating must not add one more step when the finger lifts.
  const repeated = useRef(false);
  const press = (direction: 1 | -1) => {
    if (repeated.current) repeated.current = false;
    else bump(direction);
  };
  const startHold = (direction: 1 | -1) => {
    stop();
    repeated.current = false;
    const repeat = () => {
      repeated.current = true;
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
    const entry =
      inputMode === 'clock' ? { minutes: draftMinutes, seconds: draftSeconds } : { value: draft };
    const nextValue = parseStepperInput(entry, min, max);
    if (nextValue !== value) onChange(nextValue);
    setEditing(false);
  };

  // Android's Back hides the keyboard without blurring the field: take what was typed then.
  const commitRef = useRef(commit);
  useEffect(() => {
    commitRef.current = commit;
  });
  useEffect(() => {
    if (!editing) return;
    const sub = Keyboard.addListener('keyboardDidHide', () => commitRef.current());
    return () => sub.remove();
  }, [editing]);

  return (
    <View ref={rowRef} className="gap-2">
      {showLabel ? <Text className="type-caption text-muted">{label}</Text> : null}
      <View className="h-16 flex-row items-center justify-between rounded-full border border-line-strong bg-surface px-1.5">
        {editing && inputMode === 'clock' ? (
          <View className="size-[52px]" />
        ) : (
          <RoundButton
            direction={-1}
            label={label}
            disabled={editing || value <= min}
            onPress={() => press(-1)}
            onPressIn={() => startHold(-1)}
            onPressOut={stop}
          />
        )}

        {editing ? (
          inputMode === 'clock' ? (
            <View className="flex-row items-center gap-1">
              <TextInput
                className={INPUT_CLASS}
                value={draftMinutes}
                onChangeText={(minutes) => {
                  setDraftMinutes(minutes);
                  onChange(parseStepperInput({ minutes, seconds: draftSeconds }, min, max));
                }}
                keyboardType="number-pad"
                maxLength={2}
                autoFocus
                selectTextOnFocus
                returnKeyType="next"
                onSubmitEditing={() => secondsRef.current?.focus()}
                blurOnSubmit={false}
                accessibilityLabel={`${label} minutes`}
              />
              <Text className="type-num text-[26px]">:</Text>
              <TextInput
                ref={secondsRef}
                className={INPUT_CLASS}
                value={draftSeconds}
                onChangeText={(seconds) => {
                  setDraftSeconds(seconds);
                  onChange(parseStepperInput({ minutes: draftMinutes, seconds }, min, max));
                }}
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
              className={INPUT_CLASS}
              value={draft}
              onChangeText={(text) => {
                setDraft(text);
                onChange(parseStepperInput({ value: text }, min, max));
              }}
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
          <ScalePressable
            onPress={beginEdit}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${label}`}
            accessibilityHint="Type a value"
            className="h-12 min-w-24 flex-1 items-center justify-center rounded-full">
            <Text className="type-num text-[26px] leading-[30px]">
              {format ? format(value) : String(value)}
            </Text>
          </ScalePressable>
        )}

        {editing && inputMode === 'clock' ? (
          <View className="size-[52px]" />
        ) : (
          <RoundButton
            direction={1}
            label={label}
            disabled={editing || value >= max}
            onPress={() => press(1)}
            onPressIn={() => startHold(1)}
            onPressOut={stop}
          />
        )}
      </View>
      {hint ? <Text className="type-caption text-muted">{hint}</Text> : null}
    </View>
  );
}

/** − or +: a 52 pt hairline circle; both directions carry the same weight. */
function RoundButton({
  direction,
  label,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
}: {
  direction: 1 | -1;
  label: string;
  disabled: boolean;
  onPress: () => void;
  onPressIn: () => void;
  onPressOut: () => void;
}) {
  return (
    <ScalePressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`${direction < 0 ? 'Decrease' : 'Increase'} ${label}`}
      className={cn(
        'size-[52px] items-center justify-center rounded-full border-[1.5px] border-text',
        disabled && 'opacity-30'
      )}>
      <Icon as={direction < 0 ? MinusIcon : PlusIcon} size={22} weight="bold" />
    </ScalePressable>
  );
}
