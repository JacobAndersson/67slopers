import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen } from '@/components/screen';
import { Text } from '@/components/ui/text';
import { WorkoutForm } from '@/components/workout-form';
import { useStore } from '@/lib/store/store';

export default function EditWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const workout = useStore((s) => s.workouts.find((w) => w.id === id));
  const updateWorkout = useStore((s) => s.updateWorkout);
  const deleteWorkout = useStore((s) => s.deleteWorkout);

  if (!workout) {
    return (
      <Screen>
        <Text variant="muted">This workout no longer exists.</Text>
      </Screen>
    );
  }

  return (
    <WorkoutForm
      initial={workout}
      submitLabel="Save changes"
      onSubmit={(values) => {
        updateWorkout(workout.id, values);
        router.back();
      }}
      onDelete={() => {
        deleteWorkout(workout.id);
        router.dismissTo('/');
      }}
    />
  );
}
