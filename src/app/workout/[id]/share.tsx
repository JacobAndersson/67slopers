import { useLocalSearchParams, useRouter } from 'expo-router';
import { XIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QrCode } from '@/components/qr-code';
import { SlabBrand } from '@/components/slab-brand';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useStore } from '@/lib/store/store';
import { encodeWorkout } from '@/lib/workout-codec';
import { summaryLine } from '@/lib/workout-summary';

/** A saved workout as a full-screen QR code, to scan into another 67slopers. */
export default function ShareWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const workout = useStore((s) => s.workouts.find((w) => w.id === id));
  const hydrated = useStore((s) => s.hydrated);
  const code = useMemo((): { digits: string } | { error: string } => {
    if (!workout) return { error: 'This workout no longer exists.' };
    try {
      return { digits: encodeWorkout(workout) };
    } catch (e) {
      const reason = e instanceof Error ? e.message : '';
      return { error: `Fix this workout in the editor before sharing it. ${reason}` };
    }
  }, [workout]);
  const size = Math.min(width - 48, height * 0.6, 480);

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }}>
      <View className="flex-row items-center justify-between px-4">
        <SlabBrand />
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel="Close"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <Icon as={XIcon} className="size-6" />
        </Button>
      </View>

      <View className="flex-1 items-center justify-center gap-6 px-6">
        {workout && 'digits' in code ? (
          <>
            <View className="items-center gap-1">
              <Text className="text-center text-2xl font-bold">{workout.name}</Text>
              <Text variant="muted" className="text-center">
                {summaryLine(workout)}
              </Text>
            </View>
            <QrCode value={code.digits} size={size} />
            <Text variant="muted" className="text-center">
              Scan it with the camera button on the 67slopers home screen.
            </Text>
          </>
        ) : (
          <Text variant="muted" className="text-center">
            {hydrated ? ('error' in code ? code.error : '') : 'Opening workout…'}
          </Text>
        )}
      </View>
    </View>
  );
}
