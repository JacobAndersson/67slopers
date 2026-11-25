import { View, Pressable } from 'react-native';

import { Sheet } from '@/components/sheet';
import { Switch } from '@/components/switch';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useStore } from '@/lib/store/store';
import type { Settings } from '@/lib/store/types';

const ROWS: { key: keyof Pick<Settings, 'sound' | 'vibration' | 'genZMode'>; title: string }[] = [
  { key: 'sound', title: 'Sound cues' },
  { key: 'vibration', title: 'Vibration' },
  { key: 'genZMode', title: 'Gen Z mode' },
];

/**
 * The timer's settings (design: timer-settings): a bottom sheet "During the session" with the
 * cue switches, global to every workout. Opened from the sliders button in the timer's corner.
 */
export function WorkoutSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  return (
    <Sheet open={open} onClose={onClose} title="During the session">
      <View className="-mt-2">
        {ROWS.map(({ key, title }) => (
          <Pressable
            key={key}
            onPress={() => setSettings({ [key]: !settings[key] })}
            accessibilityRole="switch"
            accessibilityState={{ checked: settings[key] }}
            className="h-16 flex-row items-center justify-between border-b border-line active:opacity-80">
            <Text className="type-body-b">{title}</Text>
            <Switch checked={settings[key]} />
          </Pressable>
        ))}
      </View>
      <Button size="lg" onPress={onClose}>
        <Text>Done</Text>
      </Button>
    </Sheet>
  );
}
