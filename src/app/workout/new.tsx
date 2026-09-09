import { useLocalSearchParams, useRouter } from 'expo-router';

import { WorkoutForm } from '@/components/workout-form';
import { findPreset } from '@/lib/store/presets';
import { useStore } from '@/lib/store/store';

/** A blank builder, or one prefilled from the presets library (`?preset=<id>`). */
export default function NewWorkoutScreen() {
  const router = useRouter();
  const { preset } = useLocalSearchParams<{ preset?: string }>();
  const template = findPreset(preset);
  const addWorkout = useStore((s) => s.addWorkout);
  const setDraft = useStore((s) => s.setDraft);

  return (
    <WorkoutForm
      key={template?.id ?? 'blank'}
      template={template ? { name: template.name, steps: template.steps } : undefined}
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
