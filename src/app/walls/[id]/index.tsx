import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { CameraIcon } from 'phosphor-react-native/src/icons/Camera';
import { MountainsIcon } from 'phosphor-react-native/src/icons/Mountains';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { RulerIcon } from 'phosphor-react-native/src/icons/Ruler';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { useCallback, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';

import { ConfirmSheet } from '@/components/confirm-sheet';
import { IconButton } from '@/components/icon-button';
import { MetricGrid } from '@/components/metric-grid';
import { MissingScreen } from '@/components/missing-screen';
import { Screen } from '@/components/screen';
import { Label, LargeTitle } from '@/components/section-header';
import { Sheet } from '@/components/sheet';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DOT, plural } from '@/lib/copy';
import { KIND_LABEL, formatAngle } from '@/lib/wall-photos/meta';
import {
  deletePhoto,
  deleteWall,
  getPhotoMeta,
  getWall,
  listPhotos,
  type StoredPhoto,
} from '@/lib/wall-photos/storage';
import type { PhotoMeta, Wall } from '@/lib/wall-photos/types';

const COLUMNS = 3;
const GAP = 6;
const GUTTER = 24;

function focalLength(exif: PhotoMeta['exif']): string | null {
  const mm = exif?.FocalLength;
  const mm35 = exif?.FocalLenIn35mmFilm;
  if (typeof mm !== 'number') return null;
  return typeof mm35 === 'number' ? `${mm.toFixed(1)} mm (${mm35} mm)` : `${mm.toFixed(1)} mm`;
}

/** One wall: its labels, the reference angle, and every photo taken of it. */
export default function WallScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const [wall, setWall] = useState<Wall | null>(() => getWall(id));
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [open, setOpen] = useState<{ photo: StoredPhoto; meta: PhotoMeta | null } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setWall(getWall(id));
      setPhotos(listPhotos(id));
    }, [id])
  );

  if (!wall) {
    return (
      <MissingScreen
        icon={MountainsIcon}
        title="This wall is gone."
        body="It was deleted, with its photos."
        action="Back to wall photos"
        onAction={() => router.back()}
      />
    );
  }

  const tile = (Math.min(width, 768) - GUTTER * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

  return (
    <Screen
      header={
        <TopBar
          right={
            <IconButton
              icon={PencilSimpleIcon}
              label="Edit wall"
              onPress={() => router.push({ pathname: '/walls/new', params: { id } })}
            />
          }
        />
      }
      contentClassName="gap-7"
      footer={
        <Button
          size="lg"
          onPress={() => router.push({ pathname: '/walls/[id]/capture', params: { id } })}>
          <Icon as={CameraIcon} weight="fill" size={20} className="text-on-action" />
          <Text>Take photos</Text>
        </Button>
      }>
      <LargeTitle
        title={wall.name}
        sub={[KIND_LABEL[wall.kind], plural(photos.length, 'photo')].join(DOT)}
      />

      <MetricGrid
        items={[
          {
            label: 'Said to be',
            value: wall.statedAngle === null ? '–' : formatAngle(wall.statedAngle),
          },
          {
            label: 'Measured',
            value: wall.measured ? formatAngle(wall.measured.angle, 1) : '–',
          },
        ]}
      />

      <View className="gap-3">
        <Button
          variant="outline"
          onPress={() => router.push({ pathname: '/walls/[id]/measure', params: { id } })}>
          <Icon as={RulerIcon} size={20} />
          <Text>{wall.measured ? 'Measure again' : 'Measure the angle'}</Text>
        </Button>
        <Text className="type-caption text-muted">
          Lay the phone on the wall to record the true angle. Every photo of this wall is labelled
          with it.
        </Text>
      </View>

      {wall.notes ? <Text className="type-body text-muted">{wall.notes}</Text> : null}

      {photos.length ? (
        <View className="gap-3">
          <Label>Photos</Label>
          <View className="flex-row flex-wrap" style={{ gap: GAP }}>
            {photos.map((photo) => (
              <Pressable
                key={photo.id}
                accessibilityRole="button"
                accessibilityLabel="Photo"
                onPress={() => setOpen({ photo, meta: getPhotoMeta(id, photo.id) })}
                className="overflow-hidden rounded-xl bg-raised active:opacity-80"
                style={{ width: tile, height: tile }}>
                <Image source={{ uri: photo.uri }} style={{ flex: 1 }} contentFit="cover" />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <Button variant="ghost" onPress={() => setConfirmDelete(true)}>
        <Icon as={TrashIcon} size={20} />
        <Text>Delete wall</Text>
      </Button>

      <Sheet open={!!open} onClose={() => setOpen(null)} title="Photo">
        {open ? (
          <View className="gap-5">
            <Image
              source={{ uri: open.photo.uri }}
              style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 16 }}
              contentFit="contain"
            />
            <MetricGrid
              items={[
                {
                  label: 'Camera up',
                  value:
                    open.meta?.motion.cameraElevation != null
                      ? formatAngle(open.meta.motion.cameraElevation, 1)
                      : '–',
                },
                {
                  label: 'Tilt',
                  value:
                    open.meta?.motion.horizonTilt != null
                      ? formatAngle(open.meta.motion.horizonTilt, 1)
                      : '–',
                },
              ]}
            />
            <Text className="type-caption text-muted">
              {[
                open.meta ? `${open.meta.image.width} × ${open.meta.image.height}` : null,
                focalLength(open.meta?.exif ?? null),
                open.meta?.device.modelName,
              ]
                .filter(Boolean)
                .join(DOT)}
            </Text>
            <Button
              variant="outline"
              onPress={() => {
                deletePhoto(id, open.photo.id);
                setPhotos((list) => list.filter((p) => p.id !== open.photo.id));
                setOpen(null);
              }}>
              <Icon as={TrashIcon} size={20} />
              <Text>Delete photo</Text>
            </Button>
          </View>
        ) : null}
      </Sheet>

      <ConfirmSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Delete ${wall.name}?`}
        body={`Its ${plural(photos.length, 'photo')} go too.`}
        safe={{ label: 'Keep it', onPress: () => setConfirmDelete(false) }}
        destructive={{
          label: 'Delete wall',
          onPress: () => {
            deleteWall(id);
            setConfirmDelete(false);
            router.back();
          },
        }}
      />
    </Screen>
  );
}
