import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CameraIcon } from 'phosphor-react-native/src/icons/Camera';
import { CameraSlashIcon } from 'phosphor-react-native/src/icons/CameraSlash';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useCallback, useRef, useState } from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { normalizeDigits } from '@/lib/codec/digits';
import { decodeProblemCode } from '@/lib/moonboard/problem-code';
import { PALETTE } from '@/lib/theme';
import { CODEC_ERRORS, decodeWorkout } from '@/lib/workout-codec';

const FINDER = 260;
const CORNER = 44;

/**
 * Reads the QR code of a workout or a board problem (design: share-scan, -scan-invalid,
 * -scan-permission, -scan-blocked). Night in both modes: the camera fills the screen under a
 * viewfinder. The camera is asked for only when the user taps Allow here, and only the code is
 * read. A code that isn't ours leaves the camera running with a note.
 */
export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [focused, setFocused] = useState(true);
  const [notOurs, setNotOurs] = useState(false);
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
    if (decodeProblemCode(data)) {
      opened.current = true;
      router.replace({ pathname: '/climb/import', params: { code: data.trim() } });
      return;
    }
    const code = normalizeDigits(data);
    const result = code ? decodeWorkout(code) : null;
    if (result && (result.ok || result.error === CODEC_ERRORS.needsUpdate)) {
      // A newer code opens the import screen, which says what to do about it.
      opened.current = true;
      router.replace({ pathname: '/import', params: { code } });
      return;
    }
    setNotOurs(true);
  };

  const granted = !!permission?.granted && Platform.OS !== 'web';
  const blocked = permission !== null && !permission.granted && !permission.canAskAgain;

  return (
    <View className="flex-1 bg-night-deep">
      <StatusBar style="light" />
      {granted && focused ? (
        <CameraView
          style={{ position: 'absolute', inset: 0 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => onScan(data)}
        />
      ) : null}

      <View
        className="flex-row items-center justify-between pl-6 pr-5"
        style={{ paddingTop: insets.top + 6 }}>
        <Text className="type-title text-snow" role="heading">
          Scan a code
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          className="size-12 items-center justify-center rounded-full bg-night active:opacity-80">
          <Icon as={XIcon} size={22} className="text-snow" />
        </Pressable>
      </View>

      {Platform.OS === 'web' ? (
        <Notice
          icon={CameraSlashIcon}
          title="Scan on your phone"
          body={'Browsers can’t read the code.\nOpen Rivet on your phone to scan.'}
        />
      ) : granted ? (
        <>
          <View
            className="absolute self-center"
            style={{ top: '50%', marginTop: -FINDER / 2 - 40 }}
            pointerEvents="none">
            <Viewfinder />
          </View>
          <View
            className="absolute inset-x-6 min-h-[76px] flex-row items-center gap-4 rounded-3xl px-5 py-3"
            style={{ bottom: insets.bottom + 150, backgroundColor: 'rgba(20, 26, 46, 0.8)' }}
            accessibilityLiveRegion="polite">
            {notOurs ? <Icon as={WarningCircleIcon} size={24} className="text-snow" /> : null}
            <Text
              className={
                notOurs ? 'type-sub flex-1 text-snow' : 'type-sub flex-1 text-center text-snow'
              }>
              {notOurs
                ? 'That isn’t a Rivet code. Rivet reads only its own workouts and problems.'
                : 'Point the camera at the QR code on a workout’s or problem’s Share screen.'}
            </Text>
          </View>
        </>
      ) : permission === null ? null : blocked ? (
        <Notice
          icon={CameraSlashIcon}
          title="The camera is off"
          body={'Turn it on for Rivet in Settings to\nscan workouts and problems.'}
          action="Open Settings"
          onAction={() => Linking.openSettings()}
        />
      ) : (
        <Notice
          icon={CameraIcon}
          title="Allow the camera"
          body={'Only the code is read. Nothing is\nrecorded or sent.'}
          action="Allow camera"
          onAction={requestPermission}
        />
      )}
    </View>
  );
}

/** Four rounded Snow corners around where the code goes. */
function Viewfinder() {
  const s = FINDER;
  const r = 14;
  const corners = [
    [0, 0, 1, 1],
    [s, 0, -1, 1],
    [0, s, 1, -1],
    [s, s, -1, -1],
  ];
  const d = corners
    .map(
      ([x, y, dx, dy]) =>
        `M${x} ${y + dy * CORNER}V${y + dy * r}Q${x} ${y} ${x + dx * r} ${y}H${x + dx * CORNER}`
    )
    .join('');
  return (
    <Svg width={s + 6} height={s + 6} viewBox={`-3 -3 ${s + 6} ${s + 6}`}>
      <Path d={d} stroke={PALETTE.snow} strokeWidth={5} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

/** A Night card in place of the camera: why it is not running and what to do. */
function Notice({
  icon,
  title,
  body,
  action,
  onAction,
}: {
  icon: typeof CameraIcon;
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View className="mx-6 mt-28 items-center rounded-[32px] bg-night px-6 pb-7 pt-9">
      <View className="size-20 items-center justify-center rounded-[26px] bg-night-500">
        <Icon as={icon} size={36} className="text-snow" />
      </View>
      <Text className="type-title mt-6 text-center text-snow">{title}</Text>
      <Text className="type-sub mt-2 text-center text-night-300">{body}</Text>
      {action && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          className="mt-14 h-16 w-full items-center justify-center rounded-full bg-snow active:opacity-90">
          <Text className="type-body-b text-lg text-night">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
