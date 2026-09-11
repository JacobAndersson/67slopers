import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShareIcon, XIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { Platform, Share, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QrCode } from '@/components/qr-code';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { groupDigits, shareMessage } from '@/lib/codec/digits';
import { useStore } from '@/lib/store/store';
import { encodeWorkout } from '@/lib/workout-codec';
import { summaryLine } from '@/lib/workout-summary';

/** A saved workout as a full-screen QR code and its digits, to open in another 67slopers. */
export default function ShareWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const workout = useStore((s) => s.workouts.find((w) => w.id === id));
  const code = useMemo((): { digits: string } | { error: string } => {
    if (!workout) return { error: 'This workout no longer exists.' };
    try {
      return { digits: encodeWorkout(workout) };
    } catch (e) {
      const reason = e instanceof Error ? e.message : '';
      return { error: `Fix this workout in the editor before sharing it. ${reason}` };
    }
  }, [workout]);
  const size = Math.min(width - 48, height * 0.5, 440);

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }}>
      <View className="flex-row justify-end px-4">
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel="Close"
          onPress={() => router.back()}>
          <Icon as={XIcon} className="size-6" />
        </Button>
      </View>

      {workout && 'digits' in code ? (
        <>
          <View className="flex-1 items-center justify-center gap-6 px-6">
            <View className="items-center gap-1">
              <Text className="text-center text-2xl font-bold">{workout.name}</Text>
              <Text variant="muted" className="text-center">
                {summaryLine(workout)}
              </Text>
            </View>
            <QrCode value={code.digits} size={size} />
            <View className="items-center gap-2">
              <Text selectable className="text-center text-2xl tracking-wider font-semibold">
                {groupDigits(code.digits)}
              </Text>
              <Text variant="muted" className="text-center">
                Scan it from the camera button on the 67slopers home screen, or type the code there.
              </Text>
            </View>
          </View>
          {Platform.OS === 'web' ? null : (
            <View className="px-6">
              <Button
                size="lg"
                variant="outline"
                onPress={() => Share.share({ message: shareMessage(workout.name, code.digits) })}>
                <Icon as={ShareIcon} className="size-5" />
                <Text>Share as text</Text>
              </Button>
            </View>
          )}
        </>
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Text variant="muted" className="text-center">
            {'error' in code ? code.error : ''}
          </Text>
        </View>
      )}
    </View>
  );
}
