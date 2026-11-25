import { useEffect } from 'react';

import { MissingWorkout } from '@/components/missing-workout';
import { Runner } from '@/components/runner';
import { useStore } from '@/lib/store/store';

/**
 * Runs a workout that is not opened from its saved entry: an unfinished run picked up from
 * its checkpoint, or the unsaved draft from the store (Start on the setup screen, "Do it
 * again" on a session).
 */
export default function RunDraftScreen() {
  const draft = useStore((s) => s.draft);
  const resume = useStore((s) => s.resume);
  const setResume = useStore((s) => s.setResume);

  // A picked-up run belongs to this visit only.
  useEffect(() => () => setResume(null), [setResume]);

  if (resume) {
    return (
      <Runner
        timings={resume.timings}
        name={resume.name}
        workoutId={resume.workoutId}
        saveNameDefault={resume.saveNameDefault ?? ''}
        resume={resume}
      />
    );
  }
  if (!draft) return <MissingWorkout />;
  return (
    <Runner
      timings={draft.timings}
      name={draft.name?.trim() || 'Quick workout'}
      workoutId={draft.workoutId}
      saveNameDefault={draft.name ?? ''}
    />
  );
}
