import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Runner } from '@/components/runner';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useStore } from '@/lib/store/store';

/** Runs the unsaved draft from the store (a workout started straight from the setup screen). */
export default function RunDraftScreen() {
  const router = useRouter();
  const draft = useStore((s) => s.draft);

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
      saveNameDefault={draft.name ?? ''}
    />
  );
}
