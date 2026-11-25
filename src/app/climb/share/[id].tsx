import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { QrCode } from '@/components/qr-code';
import { Text } from '@/components/ui/text';
import { DOT } from '@/lib/copy';
import { getLayout, parseBoardKey } from '@/lib/moonboard/boards';
import { gradeLabel } from '@/lib/moonboard/grades';
import { displayName } from '@/lib/moonboard/names';
import { encodeProblemCode } from '@/lib/moonboard/problem-code';
import { useClimb } from '@/lib/store/climb';

/**
 * An own problem as a QR code to scan into another Rivet (design: share-share-problem): name,
 * grade and board, the code on a white card, how to scan it. Works offline; the screen stays
 * awake while it is open.
 */
export default function ShareProblemScreen() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const problem = useClimb((s) => s.custom.find((p) => p.id === id));
  const scale = useClimb((s) => s.gradeScale);
  const code = useMemo(() => (problem ? encodeProblemCode(problem) : null), [problem]);
  const size = Math.min(width - 104, height * 0.42, 420);
  const where = problem ? parseBoardKey(problem.board) : null;

  return (
    <View
      className="flex-1 bg-canvas px-6"
      style={{ paddingTop: insets.top + 6, paddingBottom: insets.bottom + 16 }}>
      <View className="flex-row justify-end">
        <IconButton
          icon={XIcon}
          label="Close"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/climb'))}
        />
      </View>
      {problem && code && where ? (
        <View className="flex-1 items-center pt-10">
          <Text className="type-large text-center" role="heading" numberOfLines={2}>
            {displayName(problem.name)}
          </Text>
          <Text className="type-sub mt-2 text-center text-muted">
            {`${gradeLabel(problem.grade, scale)}${DOT}${getLayout(where.layout).name} · ${where.angle}°`}
          </Text>
          <View className="mt-8">
            <QrCode value={code} size={size} label={`QR code of ${problem.name}`} />
          </View>
          <Text className="type-sub mt-8 text-center text-muted">
            Open Rivet on the other phone and scan.{'\n'}No internet needed on either.
          </Text>
          <Text className="type-caption mt-4 text-center text-muted">
            The screen stays bright while this is open.
          </Text>
        </View>
      ) : (
        <View className="flex-1 justify-center">
          <Text className="type-body text-center text-muted">This problem is no longer here.</Text>
        </View>
      )}
    </View>
  );
}
