import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Text } from '@/components/ui/text';
import { formatClock } from '@/lib/dates';
import { LEVEL_LABELS, LEVELS, presetsByLevel, type Preset } from '@/lib/store/presets';
import { estimateDuration, summaryLine } from '@/lib/workout-summary';

function PresetCard({ preset }: { preset: Preset }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/workout/new', params: { preset: preset.id } })}
      accessibilityRole="button"
      className="gap-3 rounded-lg border border-border bg-card p-5 active:bg-accent">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-lg font-semibold">{preset.name}</Text>
        <Text variant="small" className="text-muted-foreground">
          {formatClock(estimateDuration(preset))}
        </Text>
      </View>
      <Text variant="muted">{summaryLine(preset)}</Text>
      <Text className="text-sm leading-6 text-muted-foreground">{preset.description}</Text>
    </Pressable>
  );
}

/** The built-in library: classic protocols by level. Opening one lands in the builder. */
export default function PresetsScreen() {
  return (
    <Screen>
      <Text variant="muted">
        Classic protocols with their usual numbers. Open one to start it as is, tweak it, or save it
        to your workouts.
      </Text>
      {LEVELS.map((level) => (
        <View key={level} className="gap-2">
          <SectionHeader title={LEVEL_LABELS[level]} />
          {presetsByLevel(level).map((preset) => (
            <PresetCard key={preset.id} preset={preset} />
          ))}
        </View>
      ))}
    </Screen>
  );
}
