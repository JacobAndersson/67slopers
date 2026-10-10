import { useRouter } from 'expo-router';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { useMemo } from 'react';
import { View } from 'react-native';

import { ProblemThumb } from '@/components/moon-board';
import { Screen } from '@/components/screen';
import { SettingGroup, SettingRow } from '@/components/setting-row';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useArmed } from '@/hooks/use-armed';
import { boardKey, getLayout } from '@/lib/moonboard/boards';
import { disconnect, useLights } from '@/lib/moonboard/lights';
import { countClimbable, sampleProblem } from '@/lib/moonboard/problems';
import { useClimb } from '@/lib/store/climb';

/** The current wall, the others to switch to, and how to add or remove one. */
export default function BoardScreen() {
  const router = useRouter();
  const setup = useClimb((s) => s.setup);
  const others = useClimb((s) => s.others);
  const switchBoard = useClimb((s) => s.switchBoard);
  const removeBoard = useClimb((s) => s.removeBoard);
  const custom = useClimb((s) => s.custom);
  const lightsName = useClimb((s) => s.lights.deviceName);
  const connected = useLights((s) => s.status === 'connected');
  const { armed, fire } = useArmed();

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
      <Screen>
        <Text variant="muted">No MoonBoard is set up yet.</Text>
        <Button onPress={() => router.replace('/climb/setup')}>
          <Icon as={PlusIcon} className="size-5 text-primary-foreground" />
          <Text>Set up your board</Text>
        </Button>
      </Screen>
    );
  }

  return (
    <Screen contentClassName="gap-6">
      <View className="flex-row gap-4 rounded-2xl bg-secondary p-4">
        <ProblemThumb holds={facts.sample} rows={facts.layout.rows} width={52} />
        <View className="flex-1 justify-center gap-1">
          <Text className="text-xl font-bold">{facts.layout.name}</Text>
          <Text variant="muted">
            {setup.angle}° · {setup.holdSets.length} hold{' '}
            {setup.holdSets.length === 1 ? 'set' : 'sets'}
          </Text>
          <Text className="text-xs text-muted-foreground font-medium">
            {facts.fitting} benchmarks{facts.own ? ` · ${facts.own} of your own` : ''}
          </Text>
        </View>
      </View>

      <SettingGroup>
        <SettingRow
          title="Board, angle and hold sets"
          value={`${setup.holdSets.length} of ${facts.layout.holdSets.length} sets`}
          onPress={() => router.push('/climb/setup')}
        />
        <SettingRow
          title="Lights"
          live={connected}
          value={connected ? 'Connected' : (lightsName ?? 'Not connected')}
          onPress={() => router.push(connected || lightsName ? '/climb/lights' : '/climb/connect')}
        />
      </SettingGroup>

      {others.length > 0 ? (
        <SettingGroup title="Your other boards">
          {others.map((other, index) => (
            <SettingRow
              key={boardKey(other.setup) + index}
              title={getLayout(other.setup.layout).name}
              value={`${other.setup.angle}° · switch`}
              onPress={async () => {
                // The connected box is on the wall being left.
                await disconnect();
                switchBoard(index);
              }}
            />
          ))}
        </SettingGroup>
      ) : null}
      <Button variant="outline" onPress={() => router.push('/climb/setup?add=1')}>
        <Icon as={PlusIcon} className="size-5" />
        <Text>Add another board</Text>
      </Button>

      <View className="gap-1">
        <Button
          variant="ghost"
          onPress={() =>
            fire('only', async () => {
              // The connected box is on the wall that is leaving; what the app remembers about
              // it goes with the board.
              await disconnect();
              removeBoard();
              if (others.length === 0) router.back();
            })
          }>
          <Text className="text-destructive">
            {armed ? 'Tap again to remove' : 'Remove this board'}
          </Text>
        </Button>
        <Text className="text-center text-xs text-muted-foreground font-medium">
          Your sends and your own problems stay in the app.
        </Text>
      </View>
    </Screen>
  );
}
