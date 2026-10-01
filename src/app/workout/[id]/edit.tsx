import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { WorkoutForm } from '@/components/workout-form';
import { useStore } from '@/lib/store/store';

export default function EditWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const workout = useStore((s) => s.workouts.find((w) => w.id === id));
  const hydrated = useStore((s) => s.hydrated);
  const updateWorkout = useStore((s) => s.updateWorkout);
  const deleteWorkout = useStore((s) => s.deleteWorkout);

  if (!workout) {
    return (
      <Screen>
        <Text variant="muted">
          {hydrated ? 'This workout no longer exists.' : 'Opening workout…'}
        </Text>
        {hydrated ? (
          <Button variant="outline" onPress={() => router.dismissTo('/')}>
            <Text>Back to home</Text>
          </Button>
        ) : null}
      </Screen>
    );
  }

  return (
    <WorkoutForm
      initial={workout}
      submitLabel="Save changes"
      onSubmit={(values) => {
        updateWorkout(workout.id, values);
        router.dismissTo(`/workout/${workout.id}`);
      }}
      onDelete={() => {
        deleteWorkout(workout.id);
        router.dismissTo('/');
      }}
    />
  );
}
