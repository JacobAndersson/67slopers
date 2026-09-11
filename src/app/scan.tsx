import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import { XIcon } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { normalizeDigits } from '@/lib/codec/digits';
import { CODEC_ERRORS, decodeWorkout } from '@/lib/workout-codec';

const NOT_OURS = 'That QR code is not a 67slopers workout.';

/**
 * Reads a workout's QR code with the camera. The camera is only asked for when the user taps
 * Allow here, and only the code is read: no photo is taken or kept. A QR code that is not a
 * workout leaves the camera running with a note instead of opening anything.
 */
export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [focused, setFocused] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const opened = useRef(false);
  const lastData = useRef<string | null>(null);

  // Only one camera preview can run at a time, so it is released whenever this screen is not
  // in front; coming back re-arms the scanner.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      opened.current = false;
      lastData.current = null;
      return () => setFocused(false);
    }, [])
  );

  // The scanner reports the same code on every frame; each distinct code is checked once.
  const onScan = (data: string) => {
    if (opened.current || data === lastData.current) return;
    lastData.current = data;
    const code = normalizeDigits(data);
    const result = code ? decodeWorkout(code) : null;
    if (!result || !result.ok) {
      setNotice(
        result?.ok === false && result.error === CODEC_ERRORS.needsUpdate ? result.error : NOT_OURS
      );
      return;
    }
    opened.current = true;
    router.replace({ pathname: '/import', params: { code } });
  };

  const blocked = permission !== null && !permission.granted && !permission.canAskAgain;

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }}>
      <View className="flex-row items-center justify-between pl-6 pr-4">
        <Text className="text-xl font-semibold">Scan a workout</Text>
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel="Close"
          onPress={() => router.back()}>
          <Icon as={XIcon} className="size-6" />
        </Button>
      </View>

      <View className="w-full max-w-xl flex-1 justify-center gap-4 self-center px-6">
        {Platform.OS === 'web' ? (
          <Text variant="muted" className="text-center">
            Scan workouts with 67slopers on your phone.
          </Text>
        ) : (
          <>
            <View className="aspect-square w-full overflow-hidden rounded-xl bg-muted">
              {permission?.granted ? (
                focused ? (
                  <CameraView
                    style={{ flex: 1 }}
                    facing="back"
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={({ data }) => onScan(data)}
                  />
                ) : null
              ) : (
                <View className="flex-1 items-center justify-center gap-4 p-6">
                  <Text className="text-center">
                    {blocked
                      ? 'Camera access is off for 67slopers. Turn it on in the settings to scan workouts.'
                      : "Allow the camera to scan a workout's QR code. Only the code is read."}
                  </Text>
                  <Button onPress={blocked ? () => Linking.openSettings() : requestPermission}>
                    <Text>{blocked ? 'Open settings' : 'Allow camera'}</Text>
                  </Button>
                </View>
              )}
            </View>
            <Text variant="muted" className="text-center">
              {notice ?? "Point the camera at the QR code on a workout's Share screen."}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}
