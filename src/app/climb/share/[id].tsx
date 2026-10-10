import { useLocalSearchParams, useRouter } from 'expo-router';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QrCode } from '@/components/qr-code';
import { SlabBrand } from '@/components/slab-brand';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { boardLabel, parseBoardKey } from '@/lib/moonboard/boards';
import { gradeLabel } from '@/lib/moonboard/grades';
import { encodeProblemCode } from '@/lib/moonboard/problem-code';
import { useClimb } from '@/lib/store/climb';

/** An own problem as a full-screen QR code, to scan into another 67slopers. Works offline. */
export default function ShareProblemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const problem = useClimb((s) => s.custom.find((p) => p.id === id));
  const scale = useClimb((s) => s.gradeScale);
  const code = useMemo(() => (problem ? encodeProblemCode(problem) : null), [problem]);
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
          onPress={() => router.back()}>
          <Icon as={XIcon} className="size-6" />
        </Button>
      </View>
      <View className="flex-1 items-center justify-center gap-6 px-6">
        {problem && code ? (
          <>
            <View className="items-center gap-1">
              <Text className="text-center text-2xl font-bold">{problem.name}</Text>
              <Text variant="muted" className="text-center">
                {gradeLabel(problem.grade, scale)} · {boardLabel(parseBoardKey(problem.board))}
              </Text>
            </View>
            <QrCode value={code} size={size} />
            <Text variant="muted" className="max-w-xs text-center">
              Scan with 67slopers on another phone. It works without internet on both.
            </Text>
          </>
        ) : (
          <Text variant="muted">This problem no longer exists.</Text>
        )}
      </View>
    </View>
  );
}
