import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import { XIcon } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { normalizeDigits } from '@/lib/codec/digits';

/**
 * Reads a workout code from the camera, or typed or pasted. The camera is only asked for when
 * the user taps Allow here, and only the code is read: no photo is taken or kept.
 */
export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [typed, setTyped] = useState('');
  const [focused, setFocused] = useState(true);
  const opened = useRef(false);

  // Only one camera preview can run at a time, so it is released whenever this screen is not
  // in front; coming back re-arms the scanner.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      opened.current = false;
      return () => setFocused(false);
    }, [])
  );

  const open = (text: string) => {
    const code = normalizeDigits(text);
    if (code.length < 2 || opened.current) return;
    opened.current = true;
    router.replace({ pathname: '/import', params: { code } });
  };

  const canScan = Platform.OS !== 'web';
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

      <View className="w-full max-w-xl flex-1 gap-6 self-center px-6 pt-4">
        {canScan ? (
          <View className="aspect-square w-full overflow-hidden rounded-xl bg-muted">
            {permission?.granted ? (
              focused ? (
                <CameraView
                  style={{ flex: 1 }}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={({ data }) => open(data)}
                />
              ) : null
            ) : (
              <View className="flex-1 items-center justify-center gap-4 p-6">
                <Text className="text-center">
                  {blocked
                    ? 'Camera access is off for 67slopers. Turn it on in the system settings, or type the code below.'
                    : 'Point the camera at a 67slopers QR code. Only the code is read.'}
                </Text>
                {blocked ? null : (
                  <Button onPress={requestPermission}>
                    <Text>Allow camera</Text>
                  </Button>
                )}
              </View>
            )}
          </View>
        ) : null}

        <View className="gap-2">
          <Text variant="muted">{canScan ? 'Or type the code' : 'Type or paste the code'}</Text>
          <Input
            value={typed}
            onChangeText={setTyped}
            placeholder="1234 5678 90"
            keyboardType="number-pad"
            returnKeyType="go"
            onSubmitEditing={() => open(typed)}
          />
          <Button
            size="lg"
            disabled={normalizeDigits(typed).length < 2}
            onPress={() => open(typed)}>
            <Text>Open workout</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}
