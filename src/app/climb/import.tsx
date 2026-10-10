import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { ButtonLabel } from '@/components/button-label';
import { HoldLegend, MoonBoard, boardWidthFor } from '@/components/moon-board';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { boardKey, boardLabel, getLayout, parseBoardKey } from '@/lib/moonboard/boards';
import { gradeLabel } from '@/lib/moonboard/grades';
import { decodeProblemCode } from '@/lib/moonboard/problem-code';
import { useClimb } from '@/lib/store/climb';

/**
 * A problem from a scanned code. Everything is in the code, so it shows straight away,
 * offline; nothing is saved until the climber chooses to.
 */
export default function ImportProblemScreen() {
  const { code = '' } = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const setup = useClimb((s) => s.setup);
  const scale = useClimb((s) => s.gradeScale);
  const addCustom = useClimb((s) => s.addCustom);
  const problem = useMemo(() => decodeProblemCode(code), [code]);

  if (!problem) {
    return (
      <Screen>
        <ButtonLabel>That code is not a 67slopers problem.</ButtonLabel>
        <Button variant="outline" className="self-start" onPress={() => router.back()}>
          <Text>Back</Text>
        </Button>
      </Screen>
    );
  }
  const where = parseBoardKey(problem.board);
  const fits = !!setup && boardKey(setup) === problem.board;

  return (
    <Screen
      footer={
        <Button
          size="lg"
          disabled={!fits}
          onPress={() => {
            const saved = addCustom(problem);
            router.replace(`/climb/problem/${saved.id}`);
          }}>
          <ButtonLabel>Save to my problems</ButtonLabel>
        </Button>
      }>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-2xl font-bold">{problem.name}</Text>
          <Text variant="muted">{boardLabel(where)}</Text>
        </View>
        <Text className="text-2xl font-bold">{gradeLabel(problem.grade, scale)}</Text>
      </View>
      <MoonBoard width={boardWidthFor(width)} rows={getLayout(where.layout).rows} holds={problem} />
      <HoldLegend />
      {fits ? null : (
        <Text variant="muted" className="text-center">
          This problem is for {boardLabel(where)}. Set that board up to save it.
        </Text>
      )}
    </Screen>
  );
}
