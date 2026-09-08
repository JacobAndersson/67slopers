import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { WorkoutCard } from '@/components/workout-card';
import { useStore } from '@/lib/store/store';

/** Every saved workout, most recently edited first. */
export default function WorkoutsScreen() {
  const router = useRouter();
  const workouts = useStore((s) => s.workouts);
  const sorted = useMemo(
    () => [...workouts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [workouts]
  );

  return (
    <Screen
      footer={
        <Button size="lg" onPress={() => router.push('/workout/new')}>
          <Text>New workout</Text>
        </Button>
      }>
      {sorted.length > 0 ? (
        <View className="gap-2">
          {sorted.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </View>
      ) : (
        <Text variant="muted">No saved workouts yet.</Text>
      )}
    </Screen>
  );
}
