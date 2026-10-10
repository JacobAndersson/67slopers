import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { SettingGroup, SettingRow } from '@/components/setting-row';
import { TabHeader } from '@/components/tab-header';
import { Text } from '@/components/ui/text';
import { getBoard } from '@/lib/boards';
import { boardLabel } from '@/lib/moonboard/boards';
import { useLights } from '@/lib/moonboard/lights';
import { useClimb } from '@/lib/store/climb';
import { useStore } from '@/lib/store/store';

/** Boards, timer cues and grade scale. The timer's own menu keeps its quick toggles too. */
export default function SettingsScreen() {
  const router = useRouter();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const preferredBoard = useStore((s) => s.preferredBoard);
  const setup = useClimb((s) => s.setup);
  const scale = useClimb((s) => s.gradeScale);
  const setScale = useClimb((s) => s.setGradeScale);
  const lightsName = useClimb((s) => s.lights.deviceName);
  const connected = useLights((s) => s.status === 'connected');

  return (
    <Screen tab contentClassName="gap-6">
      <TabHeader title="Settings" />
      <SettingGroup title="Boards">
        <SettingRow
          title="Hangboard"
          value={preferredBoard ? getBoard(preferredBoard)?.name : 'None'}
          onPress={() => router.push('/board-setup')}
        />
        <SettingRow
          title="MoonBoard"
          value={setup ? boardLabel(setup) : 'Not set up'}
          onPress={() => router.push(setup ? '/climb/board' : '/climb/setup')}
        />
        {setup ? (
          <SettingRow
            title="Board lights"
            live={connected}
            value={connected ? 'Connected' : (lightsName ?? 'Not connected')}
            onPress={() => router.push(connected ? '/climb/lights' : '/climb/connect')}
          />
        ) : null}
      </SettingGroup>

      <SettingGroup title="Timer">
        <SettingRow
          title="Sound"
          checked={settings.sound}
          onCheckedChange={(sound) => setSettings({ sound })}
        />
        <SettingRow
          title="Vibration"
          checked={settings.vibration}
          onCheckedChange={(vibration) => setSettings({ vibration })}
        />
        <SettingRow
          title="Gen Z mode"
          checked={settings.genZMode}
          onCheckedChange={(genZMode) => setSettings({ genZMode })}
        />
      </SettingGroup>

      <SettingGroup title="Climbing">
        <SettingRow title="Grades">
          <View className="w-44">
            <Segmented
              options={[
                { value: 'font', label: 'Font' },
                { value: 'v', label: 'V-scale' },
              ]}
              value={scale}
              onChange={setScale}
            />
          </View>
        </SettingRow>
      </SettingGroup>

      <Text className="text-center text-xs text-muted-foreground font-medium">
        Everything stays on this phone.{'\n'}No account, no ads, no internet.
      </Text>
    </Screen>
  );
}
