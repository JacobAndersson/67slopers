import { useRouter } from 'expo-router';
import { BluetoothConnectedIcon } from 'phosphor-react-native/src/icons/BluetoothConnected';
import { View } from 'react-native';

import { Screen } from '@/components/screen';
import { LightSettings } from '@/components/light-settings';
import { SettingRow } from '@/components/setting-row';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { disconnect, forget, useLights } from '@/lib/moonboard/lights';
import { useClimb } from '@/lib/store/climb';

/** The board's lights: what is connected, the three light settings, and the ways out. */
export default function LightsScreen() {
  const router = useRouter();
  const status = useLights((s) => s.status);
  const device = useLights((s) => s.device);
  const lights = useClimb((s) => s.lights);
  const setLights = useClimb((s) => s.setLights);
  const connected = status === 'connected';
  const name = device?.name ?? lights.deviceName;

  return (
    <Screen contentClassName="gap-6">
      <View className="flex-row items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <View className="size-10 items-center justify-center rounded-xl bg-secondary">
          <Icon as={BluetoothConnectedIcon} size={22} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-semibold">{name ?? 'No board yet'}</Text>
          <View className="flex-row items-center gap-1.5">
            {connected ? <View className="size-2 rounded-full bg-hold-start" /> : null}
            <Text className="text-xs text-muted-foreground font-medium">
              {connected
                ? 'Connected'
                : status === 'connecting' || status === 'reconnecting'
                  ? 'Connecting…'
                  : 'Not connected'}
            </Text>
          </View>
        </View>
      </View>

      <LightSettings>
        <SettingRow
          title="Connect automatically"
          description="When Climb opens near the board"
          checked={lights.autoConnect}
          onCheckedChange={(autoConnect) => setLights({ autoConnect })}
        />
      </LightSettings>

      {connected ? (
        <View className="flex-row gap-3">
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
        <Button onPress={() => router.replace('/climb/connect')}>
          <Text>Connect lights</Text>
        </Button>
      )}
      {name ? (
        <Button
          variant="ghost"
          onPress={async () => {
            await forget();
            router.back();
          }}>
          <Text className="text-destructive">Forget this board</Text>
        </Button>
      ) : null}
    </Screen>
  );
}
