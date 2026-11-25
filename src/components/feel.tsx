import { View } from 'react-native';

import { Segmented } from '@/components/segmented';
import { FEEL_LABELS, FEELS, type Feel } from '@/lib/store/types';

type FeelPickerProps = {
  value?: Feel;
  onChange: (feel: Feel) => void;
};

const OPTIONS = FEELS.map((feel) => ({ value: feel, label: FEEL_LABELS[feel] }));

/**
 * "How did it feel?" in words on one 64 pt segmented pill (design: timer-done, log-session):
 * Off day · Solid · Strong, never preselected. Tapping the chosen one again clears it.
 */
export function FeelPicker({ value, onChange }: FeelPickerProps) {
  return (
    <View accessibilityLabel="How did it feel?">
      <Segmented options={OPTIONS} value={value ?? null} onChange={onChange} height={64} />
    </View>
  );
}
