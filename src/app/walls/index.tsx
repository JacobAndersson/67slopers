import { useFocusEffect, useRouter } from 'expo-router';
import { ExportIcon } from 'phosphor-react-native/src/icons/Export';
import { MountainsIcon } from 'phosphor-react-native/src/icons/Mountains';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { useCallback, useState } from 'react';
import { Platform, View } from 'react-native';

import { ListRow } from '@/components/card';
import { Screen } from '@/components/screen';
import { LargeTitle } from '@/components/section-header';
import { TopBar } from '@/components/top-bar';
import { BoardSprayIcon } from '@/components/training-icons';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DOT, plural } from '@/lib/copy';
import { KIND_LABEL, wallAngleLabel } from '@/lib/wall-photos/meta';
import { countPhotos, exportWalls, listWalls } from '@/lib/wall-photos/storage';
import type { Wall } from '@/lib/wall-photos/types';

type Row = { wall: Wall; photos: number };

/**
 * Wall photos: example pictures of real walls, each labelled with its angle, to teach Rivet to
 * read a wall from a photo. Everything stays in the app's own folder until it is exported.
 */
export default function WallsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [exportNote, setExportNote] = useState<string | null>(null);

  // Photos are added on other screens; the list is read again whenever it comes back.
  useFocusEffect(
    useCallback(() => {
      setRows(listWalls().map((wall) => ({ wall, photos: countPhotos(wall.id) })));
    }, [])
  );

  const total = rows.reduce((sum, row) => sum + row.photos, 0);

  const onExport = async () => {
    setExportNote(null);
    try {
      const written = await exportWalls();
      setExportNote(
        written
          ? `Copied ${plural(written, 'new photo')}.`
          : 'No new photos. The labels are up to date.'
      );
    } catch {
      setExportNote('Nothing was copied.');
    }
  };

  return (
    <Screen
      header={<TopBar />}
      contentClassName="gap-6"
      footer={
        <Button size="lg" onPress={() => router.push('/walls/new')}>
          <Icon as={PlusIcon} size={20} className="text-on-action" />
          <Text>New wall</Text>
        </Button>
      }>
      <LargeTitle
        title="Wall photos"
        sub="Photos of walls with their angle, to teach Rivet to read a wall from a picture."
      />

      {rows.length ? (
        <View className="gap-3">
          {rows.map(({ wall, photos }) => (
            <ListRow
              key={wall.id}
              icon={wall.kind === 'gym' ? MountainsIcon : BoardSprayIcon}
              title={wall.name}
              sub={[KIND_LABEL[wall.kind], wallAngleLabel(wall), plural(photos, 'photo')]
                .filter(Boolean)
                .join(DOT)}
              chevron
              onPress={() => router.push({ pathname: '/walls/[id]', params: { id: wall.id } })}
            />
          ))}
        </View>
      ) : (
        <Text className="type-body text-muted">
          Start with a wall you know the angle of, like your MoonBoard, then take photos of it from
          a few different spots.
        </Text>
      )}

      {total ? (
        Platform.OS === 'android' ? (
          <View className="gap-3">
            <Button variant="outline" onPress={onExport}>
              <Icon as={ExportIcon} size={20} />
              <Text>Copy to a folder</Text>
            </Button>
            {exportNote ? (
              <Text className="type-caption text-center text-muted">{exportNote}</Text>
            ) : null}
          </View>
        ) : (
          <Text className="type-caption text-muted">
            The photos are in the Files app: On My iPhone › Rivet › walls.
          </Text>
        )
      ) : null}
    </Screen>
  );
}
