import { useRouter } from 'expo-router';
import { BluetoothConnectedIcon } from 'phosphor-react-native/src/icons/BluetoothConnected';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { View } from 'react-native';

import { LightSettings } from '@/components/light-settings';
import { Screen } from '@/components/screen';
import { LargeTitle } from '@/components/section-header';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { disconnect, forget, useLights } from '@/lib/moonboard/lights';
import { useClimb } from '@/lib/store/climb';

/** Board lights (design: climb-lights): what is connected, three settings, and the ways out. */
export default function LightsScreen() {
  const router = useRouter();
  const status = useLights((s) => s.status);
  const device = useLights((s) => s.device);
  const deviceName = useClimb((s) => s.lights.deviceName);
  const connected = status === 'connected';
  const name = device?.name ?? deviceName;

  return (
    <Screen header={<TopBar />} contentClassName="gap-0">
      <LargeTitle title="Board lights" />
      <View className="mt-6 h-24 flex-row items-center gap-4 rounded-3xl border border-line bg-surface px-5">
        <View className="size-12 items-center justify-center rounded-2xl bg-raised">
          <Icon as={BluetoothConnectedIcon} size={24} />
        </View>
        <View className="flex-1 gap-1">
          <Text className="type-row">{name ?? 'No board yet'}</Text>
          <View className="flex-row items-center gap-1.5">
            {connected ? <View className="size-2 rounded-full bg-text" /> : null}
            <Text className={connected ? 'type-caption' : 'type-caption text-muted'}>
              {connected
                ? 'Connected'
                : status === 'connecting' || status === 'reconnecting'
                  ? 'Connecting…'
                  : 'Not connected'}
            </Text>
          </View>
        </View>
      </View>

      <LightSettings className="mt-5" />

      {connected ? (
        <View className="mt-6 flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onPress={() => router.replace('/climb/connect')}>
            <Text>Test lights</Text>
          </Button>
          <Button variant="outline" className="flex-1" onPress={() => disconnect()}>
            <Text>Disconnect</Text>
          </Button>
        </View>
      ) : (
        <Button className="mt-6" onPress={() => router.replace('/climb/connect')}>
          <Text>Connect lights</Text>
        </Button>
      )}
      {name ? (
        <Button
          variant="ghost"
          className="mt-3"
          onPress={async () => {
            await forget();
            router.back();
          }}>
          <Icon as={TrashIcon} size={20} />
          <Text>Forget this board</Text>
        </Button>
      ) : null}
    </Screen>
  );
}
