import { useRouter } from 'expo-router';
import { PlayIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatClock } from '@/lib/dates';
import type { Workout } from '@/lib/store/types';
import { estimateDuration, summaryLine } from '@/lib/workout-summary';

/**
 * A saved workout in the home list. The play button starts it straight away; tapping
 * anywhere else opens its overview.
 */
export function WorkoutCard({ workout }: { workout: Workout }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/workout/${workout.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${workout.name}, open overview`}
      className="flex-row items-center gap-3 rounded-lg border border-border bg-card py-3 pl-4 pr-3 active:bg-accent">
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text className="font-semibold">{workout.name}</Text>
          {workout.isPreset ? (
            <Badge variant="secondary">
              <Text>Preset</Text>
            </Badge>
          ) : null}
        </View>
        <Text variant="muted">{summaryLine(workout)}</Text>
        <Text variant="muted">{formatClock(estimateDuration(workout))}</Text>
      </View>
      <Button
        size="icon"
        className="h-12 w-12 rounded-full"
        accessibilityLabel={`Start ${workout.name}`}
        onPress={(e) => {
          e.stopPropagation();
          router.push(`/workout/${workout.id}/run`);
        }}>
        <Icon as={PlayIcon} className="size-6" />
      </Button>
    </Pressable>
  );
}
