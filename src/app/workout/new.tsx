import { useRouter } from 'expo-router';

import { WorkoutForm } from '@/components/workout-form';
import { useStore } from '@/lib/store/store';

export default function NewWorkoutScreen() {
  const router = useRouter();
  const addWorkout = useStore((s) => s.addWorkout);

  return (
    <WorkoutForm
      submitLabel="Save workout"
      onSubmit={(values) => {
        const workout = addWorkout(values);
        router.replace(`/workout/${workout.id}`);
      }}
    />
  );
}
