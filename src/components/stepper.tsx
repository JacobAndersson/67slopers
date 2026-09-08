import { MinusIcon, PlusIcon } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

type StepperProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** How the value reads, e.g. seconds as "7s" or "3:00". */
  format?: (value: number) => string;
  hint?: string;
};

const HOLD_DELAY_MS = 300;
const HOLD_INTERVAL_MS = 80;

/** Labelled − / + control with 44 px targets and hold-to-repeat. Never a raw text field. */
export function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
  hint,
}: StepperProps) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ value, onChange });
  useEffect(() => {
    latest.current = { value, onChange };
  });

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

  return (
    <View className="flex-row items-center gap-3 py-1">
      <View className="flex-1 gap-0.5">
        <Text className="font-medium">{label}</Text>
        {hint ? <Text variant="muted">{hint}</Text> : null}
      </View>
      <Button
        variant="outline"
        size="icon"
        className="h-11 w-11"
        disabled={value <= min}
        onPress={() => bump(-1)}
        onPressIn={() => startHold(-1)}
        onPressOut={stop}
        accessibilityLabel={`Decrease ${label}`}>
        <Icon as={MinusIcon} className="size-5" />
      </Button>
      <Text className="min-w-16 text-center text-xl font-semibold" accessibilityLiveRegion="polite">
        {format ? format(value) : String(value)}
      </Text>
      <Button
        variant="outline"
        size="icon"
        className="h-11 w-11"
        disabled={value >= max}
        onPress={() => bump(1)}
        onPressIn={() => startHold(1)}
        onPressOut={stop}
        accessibilityLabel={`Increase ${label}`}>
        <Icon as={PlusIcon} className="size-5" />
      </Button>
    </View>
  );
}
