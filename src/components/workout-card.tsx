import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { formatClock } from '@/lib/dates';
import type { Workout } from '@/lib/store/types';
import { estimateDuration, summaryLine } from '@/lib/workout-summary';
import { cn } from '@/lib/utils';

/** A saved workout in the home list. Tapping opens its overview, which has Start. */
export function WorkoutCard({ workout, compact = false }: { workout: Workout; compact?: boolean }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/workout/${workout.id}`)}
      accessibilityRole="button"
      className={cn(
        'gap-3 rounded-lg border border-border bg-card px-4 py-3 active:bg-accent',
        compact ? 'min-h-36 w-64 shrink-0 justify-between' : 'flex-row items-center'
      )}>
      <View className="flex-1 gap-0.5">
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="font-semibold">{workout.name}</Text>
          {workout.isPreset ? (
            <Badge variant="secondary">
              <Text>Preset</Text>
            </Badge>
          ) : null}
        </View>
        <Text variant="muted">{summaryLine(workout)}</Text>
      </View>
      <Text variant="small" className="text-muted-foreground">
        {formatClock(estimateDuration(workout))}
      </Text>
    </Pressable>
  );
}
