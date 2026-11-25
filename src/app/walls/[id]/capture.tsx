import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CameraIcon } from 'phosphor-react-native/src/icons/Camera';
import { CameraSlashIcon } from 'phosphor-react-native/src/icons/CameraSlash';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useCallback, useRef, useState } from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useMotionSamples } from '@/hooks/use-motion-samples';
import { plural } from '@/lib/copy';
import { backElevation, horizonTilt } from '@/lib/wall-photos/geometry';
import { formatAngle, newId, photoMeta } from '@/lib/wall-photos/meta';
import { getWall, listPhotos, savePhoto } from '@/lib/wall-photos/storage';

const SHUTTER = 76;

/** The largest picture size the camera offers, as "4032x3024". */
function largest(sizes: string[]): string | null {
  const area = (size: string) => size.split('x').reduce((a, n) => a * (Number(n) || 0), 1);
  return sizes.reduce<string | null>((best, s) => (!best || area(s) > area(best) ? s : best), null);
}

/**
 * Photographs a wall for the training data (Night in both modes, like the scanner). Every
 * press saves the full-size photo with a sidecar of gravity around the shutter, the camera's
 * EXIF and the phone, so the angle can later be worked out from the picture alone.
 */
export default function CaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [focused, setFocused] = useState(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pictureSize, setPictureSize] = useState<string | null>(null);
  const [photos, setPhotos] = useState(() => listPhotos(id));
  const [failed, setFailed] = useState(false);
  const camera = useRef<CameraView>(null);
  const { samples, latest } = useMotionSamples(focused);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, [])
  );

  const granted = !!permission?.granted && Platform.OS !== 'web';
  const blocked = permission !== null && !permission.granted && !permission.canAskAgain;

  const onReady = async () => {
    setReady(true);
    try {
      const sizes = await camera.current?.getAvailablePictureSizesAsync();
      if (sizes?.length) setPictureSize(largest(sizes));
    } catch {
      // The default size is fine; the sidecar records the real one either way.
    }
  };

  const onShoot = async () => {
    const wall = getWall(id);
    if (!camera.current || busy || !wall) return;
    setBusy(true);
    setFailed(false);
    const pressedAt = performance.now();
    const takenAt = new Date();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const picture = await camera.current.takePictureAsync({ quality: 1, exif: true });
      const savedAt = performance.now();
      const photoId = newId(takenAt.getTime());
      const stored = savePhoto(
        picture.uri,
        photoMeta({
          id: photoId,
          wall,
          takenAt,
          file: `${photoId}.jpg`,
          image: { width: picture.width, height: picture.height },
          exif: (picture.exif as Record<string, unknown> | undefined) ?? null,
          device: {
            platform: Platform.OS,
            osName: Device.osName,
            osVersion: Device.osVersion,
            brand: Device.brand,
            manufacturer: Device.manufacturer,
            modelName: Device.modelName,
            modelId: Device.modelId ?? null,
          },
          appVersion: Constants.expoConfig?.version ?? null,
          pictureSize,
          zoom: 0,
          pressedAt,
          savedAt,
          samples: samples.current,
        })
      );
      setPhotos((list) => [stored, ...list]);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const elevation = latest ? backElevation(latest.gravity) : null;
  const tilt = latest ? horizonTilt(latest.gravity) : null;
  const level = tilt !== null && Math.abs(tilt) < 1;

  return (
    <View className="flex-1 bg-night-deep">
      <StatusBar style="light" />
      {granted && focused ? (
        <CameraView
          ref={camera}
          style={{ position: 'absolute', inset: 0 }}
          facing="back"
          zoom={0}
          // Show the whole 4:3 frame the photo keeps, not a crop of it.
          ratio="4:3"
          pictureSize={pictureSize ?? undefined}
          onCameraReady={onReady}
          animateShutter
        />
      ) : null}

      <View
        className="flex-row items-center justify-between pb-3 pl-6 pr-5"
        style={{ paddingTop: insets.top + 6, backgroundColor: 'rgba(20, 26, 46, 0.8)' }}>
        <View className="flex-1">
          <Text className="type-title text-snow" role="heading" numberOfLines={1}>
            {getWall(id)?.name ?? 'Wall'}
          </Text>
          <Text className="type-caption text-night-300">{plural(photos.length, 'photo')}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Done"
          onPress={() => router.back()}
          className="size-12 items-center justify-center rounded-full bg-night active:opacity-80">
          <Icon as={XIcon} size={22} className="text-snow" />
        </Pressable>
      </View>

      {granted ? (
        <>
          {/* The horizon: a line that turns with the phone and goes solid when it is level. */}
          {tilt !== null ? (
            <View
              pointerEvents="none"
              className="absolute self-center"
              style={{ top: '50%', width: 160, transform: [{ rotate: `${-tilt}deg` }] }}>
              <View
                className="h-[3px] rounded-full bg-snow"
                style={{ opacity: level ? 1 : 0.45 }}
              />
            </View>
          ) : null}

          <View
            className="absolute inset-x-6 items-center gap-1 rounded-3xl px-5 py-3"
            style={{ bottom: insets.bottom + 150, backgroundColor: 'rgba(20, 26, 46, 0.8)' }}
            accessibilityLiveRegion="polite">
            <Text className="type-sub text-center text-snow">
              {failed
                ? 'That photo didn’t save. Try again.'
                : 'Fill the frame with the wall. Shoot from a few spots: straight on, from the sides, closer and further.'}
            </Text>
            {elevation !== null ? (
              <Text className="type-caption text-night-300">
                Camera {formatAngle(elevation)} up · tilt {formatAngle(tilt ?? 0, 1)}
              </Text>
            ) : null}
          </View>

          <View
            className="absolute inset-x-0 flex-row items-center justify-between px-8"
            style={{ bottom: insets.bottom + 40 }}>
            <View className="size-14 overflow-hidden rounded-2xl bg-night">
              {photos[0] ? (
                <Image source={{ uri: photos[0].uri }} style={{ flex: 1 }} contentFit="cover" />
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Take photo"
              disabled={!ready || busy}
              onPress={onShoot}
              className="items-center justify-center rounded-full border-4 border-snow active:opacity-80"
              style={{ width: SHUTTER, height: SHUTTER, opacity: ready && !busy ? 1 : 0.5 }}>
              <View className="size-[60px] rounded-full bg-snow" />
            </Pressable>
            <View className="size-14" />
          </View>
        </>
      ) : permission === null ? null : (
        <View className="mx-6 mt-28 items-center rounded-[32px] bg-night px-6 pb-7 pt-9">
          <View className="size-20 items-center justify-center rounded-[26px] bg-night-500">
            <Icon as={blocked ? CameraSlashIcon : CameraIcon} size={36} className="text-snow" />
          </View>
          <Text className="type-title mt-6 text-center text-snow">
            {blocked ? 'The camera is off' : 'Allow the camera'}
          </Text>
          <Text className="type-sub mt-2 text-center text-night-300">
            {blocked
              ? 'Turn it on for Rivet in Settings to photograph walls.'
              : 'Photos stay on this phone until you copy them off.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={blocked ? () => Linking.openSettings() : requestPermission}
            className="mt-14 h-16 w-full items-center justify-center rounded-full bg-snow active:opacity-90">
            <Text className="type-body-b text-lg text-night">
              {blocked ? 'Open Settings' : 'Allow camera'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
