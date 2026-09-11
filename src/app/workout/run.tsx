import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Runner } from '@/components/runner';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useStore } from '@/lib/store/store';

/**
 * Runs a workout that is not opened from its saved entry: an unfinished run picked up from
 * its checkpoint, or the unsaved draft from the store (Start on the setup screen, "Do it
 * again" on a session).
 */
export default function RunDraftScreen() {
  const router = useRouter();
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
  if (!draft) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
        <Text variant="muted">Nothing to run.</Text>
        <Button variant="outline" onPress={() => router.dismissTo('/')}>
          <Text>Back to home</Text>
        </Button>
      </View>
    );
  }
  return (
    <Runner
      timings={draft.timings}
      name={draft.name?.trim() || 'Quick workout'}
      workoutId={draft.workoutId}
      saveNameDefault={draft.name ?? ''}
    />
  );
}
