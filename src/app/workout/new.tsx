import { useRouter } from 'expo-router';

import { WorkoutForm } from '@/components/workout-form';
import { useStore } from '@/lib/store/store';

export default function NewWorkoutScreen() {
  const router = useRouter();
  const addWorkout = useStore((s) => s.addWorkout);
  const setDraft = useStore((s) => s.setDraft);

  return (
    <WorkoutForm
      submitLabel="Save"
      onSubmit={(values) => {
        const workout = addWorkout(values);
        router.replace(`/workout/${workout.id}`);
      }}
      onStart={({ name, ...timings }) => {
        setDraft({ name: name || undefined, timings });
        router.push('/workout/run');
      }}
    />
  );
}
