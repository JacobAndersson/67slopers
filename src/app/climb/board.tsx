import { useRouter } from 'expo-router';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ConfirmSheet } from '@/components/confirm-sheet';
import { ProblemThumb } from '@/components/moon-board';
import { Screen } from '@/components/screen';
import { LargeTitle } from '@/components/section-header';
import { SettingGroup, SettingRow } from '@/components/setting-row';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DOT, plural } from '@/lib/copy';
import { boardKey, getLayout } from '@/lib/moonboard/boards';
import { disconnect, useLights } from '@/lib/moonboard/lights';
import { countClimbable, sampleProblem } from '@/lib/moonboard/problems';
import { useClimb } from '@/lib/store/climb';

/**
 * MoonBoard settings (design: climb-board): the current wall, its setup and lights, the other
 * walls to switch to, and how to add or remove one.
 */
export default function BoardScreen() {
  const router = useRouter();
  const setup = useClimb((s) => s.setup);
  const others = useClimb((s) => s.others);
  const switchBoard = useClimb((s) => s.switchBoard);
  const removeBoard = useClimb((s) => s.removeBoard);
  const custom = useClimb((s) => s.custom);
  const lightsName = useClimb((s) => s.lights.deviceName);
  const connected = useLights((s) => s.status === 'connected');
  const [confirm, setConfirm] = useState(false);

  const facts = useMemo(() => {
    if (!setup) return null;
    const board = boardKey(setup);
    return {
      board,
      layout: getLayout(setup.layout),
      fitting: countClimbable(board, setup.holdSets),
      own: custom.filter((p) => p.board === board).length,
      sample: sampleProblem(board),
    };
  }, [setup, custom]);

  if (!setup || !facts) {
    return (
      <Screen header={<TopBar />} contentClassName="gap-6">
        <LargeTitle title="MoonBoard" sub="No MoonBoard is set up yet." />
        <Button onPress={() => router.replace('/climb/setup')}>
          <Icon as={PlusIcon} size={20} className="text-on-action" />
          <Text>Set up your board</Text>
        </Button>
      </Screen>
    );
  }

  const sets = `${setup.holdSets.length} of ${facts.layout.holdSets.length}`;
  return (
    <Screen header={<TopBar />} contentClassName="gap-0">
      <LargeTitle title="MoonBoard" />
      <View className="mt-6 h-[120px] flex-row items-center gap-4 rounded-3xl border border-line bg-raised px-5">
        <ProblemThumb holds={facts.sample} rows={facts.layout.rows} height={80} />
        <View className="flex-1 gap-0.5">
          <Text className="type-title">{facts.layout.name}</Text>
          <Text className="type-sub text-muted">{`${setup.angle}°${DOT}${sets} hold sets`}</Text>
          <Text className="type-caption mt-1">
            {plural(facts.fitting, 'benchmark')}
            {facts.own ? `${DOT}${facts.own} of your own` : ''}
          </Text>
        </View>
      </View>

      <SettingGroup className="mt-5">
        <SettingRow
          title="Board, angle and holds"
          value={sets}
          onPress={() => router.push('/climb/setup')}
        />
        <SettingRow
          title="Lights"
          value={connected ? 'Connected' : (lightsName ?? 'Not connected')}
          onPress={() => router.push(connected || lightsName ? '/climb/lights' : '/climb/connect')}
        />
      </SettingGroup>

      {others.length > 0 ? (
        <SettingGroup title="Your other boards" className="mt-7">
          {others.map((other, index) => (
            <SettingRow
              key={boardKey(other.setup) + index}
              title={getLayout(other.setup.layout).name}
              description={`${other.setup.angle}°${DOT}${getLayout(other.setup.layout).rows} rows`}
              value="Switch"
              onPress={async () => {
                // The connected box is on the wall being left.
                await disconnect();
                switchBoard(index);
              }}
            />
          ))}
        </SettingGroup>
      ) : null}
      <Button variant="outline" className="mt-6" onPress={() => router.push('/climb/setup?add=1')}>
        <Icon as={PlusIcon} size={20} />
        <Text>Add another board</Text>
      </Button>
      <Button variant="ghost" className="mt-2" onPress={() => setConfirm(true)}>
        <Icon as={TrashIcon} size={20} />
        <Text>Remove this board</Text>
      </Button>
      <Text className="type-caption mt-1 text-center text-muted">
        Your sends and your own problems stay in the app.
      </Text>

      <ConfirmSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Remove this board?"
        body="Your sends and your own problems stay in the app."
        safe={{ label: 'Keep it', onPress: () => setConfirm(false) }}
        destructive={{
          label: 'Remove board',
          onPress: async () => {
            setConfirm(false);
            // The connected box is on the wall that is leaving; what the app remembers about
            // it goes with the board.
            await disconnect();
            removeBoard();
            if (others.length === 0) router.back();
          },
        }}
      />
    </Screen>
  );
}
