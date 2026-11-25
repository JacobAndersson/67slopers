import { useRouter } from 'expo-router';
import { InfoIcon } from 'phosphor-react-native/src/icons/Info';
import { useMemo } from 'react';
import { View } from 'react-native';

import { PressableCard } from '@/components/card';
import { WorkoutTimeline } from '@/components/data-bars';
import { Screen } from '@/components/screen';
import { Label, LargeTitle } from '@/components/section-header';
import { TopBar } from '@/components/top-bar';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatClock } from '@/lib/dates';
import { LEVEL_LABELS, LEVELS, presetsByLevel, type Preset } from '@/lib/store/presets';
import { estimateDuration } from '@/lib/workout-summary';
import { workoutShape } from '@/lib/workout-shape';
import { protocolLine } from '@/lib/workout-words';

function PresetCard({ preset }: { preset: Preset }) {
  const router = useRouter();
  const shape = useMemo(() => workoutShape(preset), [preset]);
  return (
    <PressableCard
      onPress={() => router.push({ pathname: '/workout/new', params: { preset: preset.id } })}
      accessibilityHint="Opens it in the builder"
      className="px-6 pb-6 pt-5">
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="type-title flex-1">{preset.name}</Text>
        <Text className="type-sub text-muted">{formatClock(estimateDuration(preset))}</Text>
      </View>
      <Text className="type-sub mt-1.5 text-muted">{protocolLine(preset)}</Text>
      <Text className="mt-1.5 text-sm leading-[18px] font-semibold">{preset.description}</Text>
      <WorkoutTimeline pieces={shape} height={8} className="mt-4" />
    </PressableCard>
  );
}

/**
 * The built-in library (design: builder-presets): classic protocols by level, each with its
 * numbers, a line on what it is for and its shape. Opening one lands in the builder.
 */
export default function PresetsScreen() {
  return (
    <Screen header={<TopBar />} contentClassName="gap-0 pb-10">
      <LargeTitle title="Classic workouts" />
      <Text className="type-body mt-2 text-muted">
        Classic protocols with their usual numbers. Start one as it is, tweak it, or keep it.
      </Text>
      <View className="mt-4 flex-row gap-3 rounded-input bg-raised px-4 py-3.5">
        <Icon as={InfoIcon} size={22} />
        <Text className="flex-1 text-sm leading-[18px] font-bold">
          Hangboards load fingers hard. Climb for a year or two before you train on one.
        </Text>
      </View>
      {LEVELS.map((level) => (
        <View key={level} className="mt-7 gap-3">
          <Label>{LEVEL_LABELS[level]}</Label>
          {presetsByLevel(level).map((preset) => (
            <PresetCard key={preset.id} preset={preset} />
          ))}
        </View>
      ))}
    </Screen>
  );
}
