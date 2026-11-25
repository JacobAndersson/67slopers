import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { QrCode } from '@/components/qr-code';
import { Text } from '@/components/ui/text';
import { formatClock } from '@/lib/dates';
import { useStore } from '@/lib/store/store';
import { encodeWorkout } from '@/lib/workout-codec';
import { estimateDuration } from '@/lib/workout-summary';

/**
 * A saved workout as a QR code to scan into another Rivet (design: share-share-workout): the
 * name and length, the code on a white card with the app icon in it, how to scan it. No digits
 * to copy. The screen stays awake while it is open.
 */
export default function ShareWorkoutScreen() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const workout = useStore((s) => s.workouts.find((w) => w.id === id));
  const hydrated = useStore((s) => s.hydrated);
  const code = useMemo((): { digits: string } | { error: string } => {
    if (!workout) return { error: 'This workout is no longer here.' };
    try {
      return { digits: encodeWorkout(workout) };
    } catch {
      return {
        error: 'This workout can’t be shared yet. Open it in the editor and save it first.',
      };
    }
  }, [workout]);
  const size = Math.min(width - 104, height * 0.46, 420);

  return (
    <View
      className="flex-1 bg-canvas px-6"
      style={{ paddingTop: insets.top + 6, paddingBottom: insets.bottom + 16 }}>
      <View className="flex-row justify-end">
        <IconButton
          icon={XIcon}
          label="Close"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
      </View>

      {workout && 'digits' in code ? (
        <View className="flex-1 items-center pt-10">
          <Text className="type-large text-center" role="heading" numberOfLines={2}>
            {workout.name}
          </Text>
          <Text className="type-sub mt-2 text-center text-muted">
            {formatClock(estimateDuration(workout))}
          </Text>
          <View className="mt-8">
            <QrCode value={code.digits} size={size} label={`QR code of ${workout.name}`} />
          </View>
          <Text className="type-sub mt-8 text-center text-muted">
            Open Rivet on the other phone and tap{'\n'}the scan button on Home.
          </Text>
          <Text className="type-caption mt-4 text-center text-muted">
            The screen stays bright while this is open.
          </Text>
        </View>
      ) : (
        <View className="flex-1 justify-center">
          <Text className="type-body text-center text-muted">
            {hydrated ? ('error' in code ? code.error : '') : ''}
          </Text>
        </View>
      )}
    </View>
  );
}
