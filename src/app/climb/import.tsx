import { useLocalSearchParams, useRouter } from 'expo-router';
import { InfoIcon } from 'phosphor-react-native/src/icons/Info';
import { LightbulbFilamentIcon } from 'phosphor-react-native/src/icons/LightbulbFilament';
import { QrCodeIcon } from 'phosphor-react-native/src/icons/QrCode';
import { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { MoonBoard } from '@/components/moon-board';
import { MissingScreen } from '@/components/missing-screen';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DOT } from '@/lib/copy';
import { boardKey, getLayout, parseBoardKey } from '@/lib/moonboard/boards';
import { gradeLabel } from '@/lib/moonboard/grades';
import { displayName } from '@/lib/moonboard/names';
import { light, useLights } from '@/lib/moonboard/lights';
import { decodeProblemCode } from '@/lib/moonboard/problem-code';
import { useClimb } from '@/lib/store/climb';

/**
 * A problem from a scanned code (design: share-import-problem, share-import-other-board).
 * Everything is in the code, so it shows straight away, offline; nothing is saved until the
 * climber chooses to. A problem for another board says so and offers to set that board up.
 */
export default function ImportProblemScreen() {
  const { code = '' } = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const setup = useClimb((s) => s.setup);
  const scale = useClimb((s) => s.gradeScale);
  const addCustom = useClimb((s) => s.addCustom);
  const connected = useLights((s) => s.status === 'connected');
  const problem = useMemo(() => decodeProblemCode(code), [code]);

  if (!problem) {
    return (
      <MissingScreen
        icon={QrCodeIcon}
        slashed
        title={'That isn’t\na Rivet code.'}
        body="Rivet only reads its own workout and problem codes."
        action="Scan again"
        onAction={() => router.replace('/scan')}
      />
    );
  }
  const where = parseBoardKey(problem.board);
  const layout = getLayout(where.layout);
  const fits = !!setup && boardKey(setup) === problem.board;

  return (
    <Screen
      header={<TopBar title="Shared problem" />}
      contentClassName="gap-0"
      footer={
        fits ? (
          <View className="flex-row gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 px-0"
              onPress={() =>
                connected ? light(problem, 'import') : router.push('/climb/connect')
              }>
              <Icon as={LightbulbFilamentIcon} size={20} />
              <Text>Light it up</Text>
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onPress={() => {
                const saved = addCustom(problem);
                router.replace(`/climb/problem/${saved.id}`);
              }}>
              <Text>Save</Text>
            </Button>
          </View>
        ) : (
          <Button
            size="lg"
            onPress={() =>
              router.push({
                pathname: '/climb/setup',
                params: {
                  ...(setup ? { add: '1' } : {}),
                  layout: where.layout,
                  angle: String(where.angle),
                },
              })
            }>
            <Text numberOfLines={1}>Set up {layout.name}</Text>
          </Button>
        )
      }>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="type-title text-[26px] leading-8 font-black">
            {displayName(problem.name)}
          </Text>
          <Text className="type-caption text-muted">
            {`${layout.name}${DOT}${where.angle}°${DOT}set by a friend`}
          </Text>
        </View>
        <Text className="type-bignum">{gradeLabel(problem.grade, scale)}</Text>
      </View>
      <View className="mt-4 items-center">
        <MoonBoard width={Math.min(width - 104, 340)} rows={layout.rows} holds={problem} />
      </View>
      {fits ? null : (
        <View className="mt-4 flex-row items-center gap-3 rounded-tile bg-raised px-4 py-3">
          <Icon as={InfoIcon} size={22} />
          <Text className="type-caption flex-1 text-sm">
            This problem is for the {layout.name}. Set that board up to save it.
          </Text>
        </View>
      )}
    </Screen>
  );
}
