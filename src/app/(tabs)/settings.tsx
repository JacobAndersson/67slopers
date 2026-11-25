import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { GameControllerIcon } from 'phosphor-react-native/src/icons/GameController';
import { LightbulbFilamentIcon } from 'phosphor-react-native/src/icons/LightbulbFilament';
import { SpeakerHighIcon } from 'phosphor-react-native/src/icons/SpeakerHigh';
import { VibrateIcon } from 'phosphor-react-native/src/icons/Vibrate';
import { View } from 'react-native';

import { useLargeText } from '@/hooks/use-large-text';
import { PitchMark } from '@/components/rivet-mark';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { SettingGroup, SettingRow } from '@/components/setting-row';
import { BoardSprayIcon, HangboardIcon } from '@/components/training-icons';
import { Text } from '@/components/ui/text';
import { getBoard } from '@/lib/boards';
import { getLayout } from '@/lib/moonboard/boards';
import { useLights } from '@/lib/moonboard/lights';
import { useClimb } from '@/lib/store/climb';
import { useStore } from '@/lib/store/store';
import type { AppearancePreference } from '@/lib/store/types';
import { useAppTheme } from '@/lib/use-theme';

/**
 * Boards, appearance, the cues during a session and the grade scale (design: log-settings).
 * Signed off with the promise that everything stays on the phone.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const preferredBoard = useStore((s) => s.preferredBoard);
  const setup = useClimb((s) => s.setup);
  const scale = useClimb((s) => s.gradeScale);
  const setScale = useClimb((s) => s.setGradeScale);
  const lightsName = useClimb((s) => s.lights.deviceName);
  const connected = useLights((s) => s.status === 'connected');
  // Large text: segmented controls go on their own line under their label.
  const large = useLargeText();

  return (
    <Screen tab contentClassName="gap-7">
      <Text className="type-large" role="heading">
        Settings
      </Text>

      <SettingGroup title="Boards">
        <SettingRow
          icon={HangboardIcon}
          title="Hangboard"
          value={preferredBoard ? getBoard(preferredBoard)?.name : 'None'}
          onPress={() => router.push('/board-setup')}
        />
        <SettingRow
          icon={BoardSprayIcon}
          title="MoonBoard"
          value={setup ? getLayout(setup.layout).name : 'Not set up'}
          onPress={() => router.push(setup ? '/climb/board' : '/climb/setup')}
        />
        {setup ? (
          <SettingRow
            icon={LightbulbFilamentIcon}
            title="Board lights"
            value={connected ? 'Connected' : (lightsName ?? 'Not connected')}
            onPress={() => router.push(connected ? '/climb/lights' : '/climb/connect')}
          />
        ) : null}
      </SettingGroup>

      <SettingGroup title="Appearance">
        <View className={large ? 'gap-3 py-4' : 'min-h-20 flex-row items-center gap-4'}>
          <Text className={large ? 'type-body-b' : 'type-body-b w-[72px]'}>Theme</Text>
          <Segmented
            className={large ? undefined : 'flex-1'}
            options={[
              { value: 'system', label: 'Auto' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            value={settings.appearance}
            onChange={(appearance: AppearancePreference) => setSettings({ appearance })}
          />
        </View>
      </SettingGroup>

      <SettingGroup title="During the session">
        <SettingRow
          icon={SpeakerHighIcon}
          title="Sound cues"
          checked={settings.sound}
          onCheckedChange={(sound) => setSettings({ sound })}
        />
        <SettingRow
          icon={VibrateIcon}
          title="Vibration"
          checked={settings.vibration}
          onCheckedChange={(vibration) => setSettings({ vibration })}
        />
        <SettingRow
          icon={GameControllerIcon}
          title="Gen Z mode"
          description="Gameplay under the timer"
          checked={settings.genZMode}
          onCheckedChange={(genZMode) => setSettings({ genZMode })}
        />
      </SettingGroup>

      <SettingGroup title="Climbing">
        <View className={large ? 'gap-3 py-4' : 'min-h-20 flex-row items-center gap-4'}>
          <Text className={large ? 'type-body-b' : 'type-body-b w-[72px]'}>Grades</Text>
          <Segmented
            className={large ? undefined : 'flex-1'}
            options={[
              { value: 'font', label: 'Font' },
              { value: 'v', label: 'V-scale' },
            ]}
            value={scale}
            onChange={setScale}
          />
        </View>
      </SettingGroup>

      <View className="mt-3 items-center">
        <Text className="type-caption text-center text-muted">
          Everything stays on this phone.{'\n'}No account, no ads, no internet.
        </Text>
        <View className="mt-5" accessible accessibilityLabel="Rivet">
          <PitchMark width={20} color={theme.text} />
        </View>
        <Text className="type-caption mt-2 text-muted">Climb Harder.</Text>
        <Text className="type-caption mt-1 text-xs text-muted font-semibold">
          Version {(Constants.expoConfig?.version ?? '1.0').replace(/\.0$/, '')}
        </Text>
      </View>
    </Screen>
  );
}
