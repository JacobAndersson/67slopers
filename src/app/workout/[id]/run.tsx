import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { Runner } from '@/components/runner';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useStore } from '@/lib/store/store';

/** Runs a saved workout. `?autostart=1` (Start on Home) counts down straight away. */
export default function RunScreen() {
  const { id, autostart } = useLocalSearchParams<{ id: string; autostart?: string }>();
  const router = useRouter();
  const workout = useStore((s) => s.workouts.find((w) => w.id === id));

  if (!workout) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
        <Text variant="muted">This workout no longer exists.</Text>
        <Button variant="outline" onPress={() => router.dismissTo('/')}>
          <Text>Back to home</Text>
        </Button>
      </View>
    );
  }
  // The store object is stable between edits, so the timer memoises on it directly.
  return (
    <Runner
      timings={workout}
      name={workout.name}
      workoutId={workout.id}
      autoStart={autostart === '1'}
    />
  );
}
