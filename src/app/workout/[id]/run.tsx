import { useLocalSearchParams } from 'expo-router';

import { MissingWorkout } from '@/components/missing-workout';
import { Runner } from '@/components/runner';
import { useStore } from '@/lib/store/store';

/** Runs a saved workout. `?autostart=1` (Start on Home) counts down straight away. */
export default function RunScreen() {
  const { id, autostart } = useLocalSearchParams<{ id: string; autostart?: string }>();
  const workout = useStore((s) => s.workouts.find((w) => w.id === id));

  if (!workout) return <MissingWorkout />;
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
