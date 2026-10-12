import { Stack, useRouter } from 'expo-router';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { ArrowsDownUpIcon } from 'phosphor-react-native/src/icons/ArrowsDownUp';
import { ArrowsLeftRightIcon } from 'phosphor-react-native/src/icons/ArrowsLeftRight';
import { BluetoothIcon } from 'phosphor-react-native/src/icons/Bluetooth';
import { BluetoothConnectedIcon } from 'phosphor-react-native/src/icons/BluetoothConnected';
import { BluetoothSlashIcon } from 'phosphor-react-native/src/icons/BluetoothSlash';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { CellSignalHighIcon } from 'phosphor-react-native/src/icons/CellSignalHigh';
import { CellSignalLowIcon } from 'phosphor-react-native/src/icons/CellSignalLow';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { DotsNineIcon } from 'phosphor-react-native/src/icons/DotsNine';
import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { PowerIcon } from 'phosphor-react-native/src/icons/Power';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ButtonLabel } from '@/components/button-label';
import { Appear } from '@/components/appear';
import { MoonBoard } from '@/components/moon-board';
import { Screen } from '@/components/screen';
import { LightSettings } from '@/components/light-settings';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { getLayout } from '@/lib/moonboard/boards';
import {
  cancelSearch,
  connect,
  lightCorners,
  lightsOff,
  search,
  useLights,
} from '@/lib/moonboard/lights';
import { cornerHolds } from '@/lib/moonboard/protocol';
import { useClimb } from '@/lib/store/climb';
import { useAppTheme } from '@/lib/use-theme';
import { cn } from '@/lib/utils';

type Phase = 'why' | 'search' | 'test' | 'fix' | 'done';

function Tile({ icon, tint = 'bg-secondary' }: { icon: PhosphorIcon; tint?: string }) {
  return (
    <View
      className={cn('size-[88px] items-center justify-center self-center rounded-[28px]', tint)}>
      <Icon as={icon} size={44} />
    </View>
  );
}

/** One ring travelling outwards while the search runs: the app is working, not stuck. */
function Pulse() {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) return;
    progress.set(withRepeat(withTiming(1, { duration: 1600, easing: Easing.linear }), -1));
  }, [progress, reducedMotion]);
  const style = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0 : 0.5 * (1 - progress.get()),
    transform: [{ scale: 0.4 + 0.6 * progress.get() }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      className="absolute size-52 rounded-full border-2 border-ring"
      style={style}
    />
  );
}

function Lead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <View className="items-center gap-2">
      <Text className="text-center text-2xl font-bold">{title}</Text>
      {children ? (
        <Text variant="muted" className="max-w-xs text-center">
          {children}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Connecting the LED kit: why Bluetooth, the search, the corner test and its fixes. Every
 * dead end offers a way on without lights, and Bluetooth is only asked for after Continue.
 */
export default function ConnectScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const status = useLights((s) => s.status);
  const devices = useLights((s) => s.devices);
  const device = useLights((s) => s.device);
  const setup = useClimb((s) => s.setup);
  const lights = useClimb((s) => s.lights);
  const setLights = useClimb((s) => s.setLights);
  const [step, setPhase] = useState<Phase>(status === 'connected' ? 'test' : 'why');
  const rows = setup ? getLayout(setup.layout).rows : 18;
  const corners = cornerHolds(rows);

  // Leaving mid-search stops the radio; the corner pattern does not stay on the wall.
  useEffect(
    () => () => {
      cancelSearch();
      if (useLights.getState().lit === 'corners') lightsOff();
    },
    []
  );

  // The moment the link is up the corner test takes over from the search.
  const phase: Phase =
    status === 'connected' && (step === 'why' || step === 'search') ? 'test' : step;
  useEffect(() => {
    if (phase === 'test') lightCorners();
  }, [phase]);

  // A lone board connects by itself after a moment; the browser's chooser already picked one.
  useEffect(() => {
    if (status !== 'searching' || devices.length !== 1) return;
    const timer = setTimeout(() => connect(devices[0]), Platform.OS === 'web' ? 0 : 1000);
    return () => clearTimeout(timer);
  }, [status, devices]);

  const without = (
    <Button variant="ghost" onPress={() => router.back()}>
      <Text>Climb without lights</Text>
    </Button>
  );
  const again = (label = 'Search again') => (
    <View className="gap-2">
      <Button
        size="lg"
        onPress={() => {
          setPhase('search');
          search();
        }}>
        <ButtonLabel>{label}</ButtonLabel>
      </Button>
      {without}
    </View>
  );

  let body: ReactNode;
  let footer: ReactNode;
  let title = 'Connect lights';

  if (phase === 'done') {
    title = '';
    footer = (
      <Button size="lg" onPress={() => router.back()}>
        <ButtonLabel>Start climbing</ButtonLabel>
      </Button>
    );
    body = (
      <>
        <Appear>
          <Tile icon={CheckCircleIcon} />
        </Appear>
        <Lead title="Lights connected">
          {device?.name ?? 'Your board'} reconnects on its own whenever you open Climb near the
          board.
        </Lead>
        <LightSettings />
      </>
    );
  } else if (phase === 'fix') {
    title = 'Fix the lights';
    const options: {
      icon: PhosphorIcon;
      title: string;
      text: string;
      on?: boolean;
      onPress: () => void;
    }[] = [
      {
        icon: ArrowsLeftRightIcon,
        title: 'Left and right swapped',
        text: 'We mirror the lights for you.',
        on: lights.mirror,
        onPress: () => setLights({ mirror: !lights.mirror }),
      },
      {
        icon: ArrowsDownUpIcon,
        title: 'Top and bottom swapped',
        text: 'We reverse the strip direction.',
        on: lights.reverse,
        onPress: () => setLights({ reverse: !lights.reverse }),
      },
      {
        icon: DotsNineIcon,
        title: 'Wrong holds light up',
        text: 'Check which board is set up.',
        onPress: () => router.push('/climb/setup'),
      },
      {
        icon: PowerIcon,
        title: 'Nothing lights up',
        text: 'Check the power, then tap to test again.',
        onPress: () => setPhase('test'),
      },
    ];
    footer = (
      <Button size="lg" onPress={() => setPhase('test')}>
        <ButtonLabel>Test again</ButtonLabel>
      </Button>
    );
    body = (
      <>
        <Text className="text-2xl font-bold">What do you see on the wall?</Text>
        <View className="gap-3">
          {options.map((option) => (
            <Pressable
              key={option.title}
              onPress={option.onPress}
              accessibilityRole={option.on === undefined ? 'button' : 'checkbox'}
              accessibilityState={option.on === undefined ? undefined : { checked: option.on }}
              className={cn(
                'flex-row items-center gap-4 rounded-2xl bg-card p-4 active:opacity-80',
                option.on ? 'border-2 border-foreground' : 'm-px border border-border'
              )}>
              <View
                className={cn(
                  'size-10 items-center justify-center rounded-xl',
                  option.on ? 'bg-secondary' : 'bg-muted'
                )}>
                <Icon as={option.icon} size={22} />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="font-semibold">{option.title}</Text>
                <Text className="text-xs text-muted-foreground font-medium">{option.text}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </>
    );
  } else if (phase === 'test' && status === 'connected') {
    title = 'Check the lights';
    footer = (
      <View className="gap-2">
        <Button
          size="lg"
          onPress={() => {
            lightsOff();
            setPhase('done');
          }}>
          <ButtonLabel>Yes, it matches</ButtonLabel>
        </Button>
        <Button variant="outline" size="lg" onPress={() => setPhase('fix')}>
          <ButtonLabel>No, something is off</ButtonLabel>
        </Button>
      </View>
    );
    body = (
      <>
        <MoonBoard width={190} rows={rows} holds={corners} labels={false} lit />
        <Lead title="Four corners lit?">
          Your wall should match this picture: A1, K1, A{rows} and K{rows} in blue.
        </Lead>
      </>
    );
  } else if (status === 'off') {
    footer = again();
    body = (
      <>
        <Tile icon={BluetoothSlashIcon} tint="bg-muted" />
        <Lead title="Bluetooth is off">Turn it on, then search again.</Lead>
      </>
    );
  } else if (status === 'denied') {
    footer = (
      <View className="gap-2">
        <Button size="lg" onPress={() => Linking.openSettings()}>
          <ButtonLabel>Open Settings</ButtonLabel>
        </Button>
        {without}
      </View>
    );
    body = (
      <>
        <Tile icon={LockSimpleIcon} tint="bg-muted" />
        <Lead title="Bluetooth is blocked">
          Allow Bluetooth for 67slopers in Settings to use the lights. Everything else works without
          it.
        </Lead>
      </>
    );
  } else if (status === 'unsupported') {
    footer = without;
    body = (
      <>
        <Tile icon={BluetoothSlashIcon} tint="bg-muted" />
        <Lead title="No Bluetooth here">
          {Platform.OS === 'web'
            ? 'This browser cannot talk to the board. Chrome and Edge can, or use the app on your phone.'
            : 'This build of the app cannot use Bluetooth.'}
        </Lead>
      </>
    );
  } else if (status === 'none' || status === 'failed') {
    footer = again();
    body = (
      <>
        <Tile icon={MagnifyingGlassIcon} tint="bg-muted" />
        <Lead title={status === 'none' ? 'No board found' : 'Could not connect'}>
          {status === 'none'
            ? 'Searched for 15 seconds without a reply.'
            : 'The board did not answer.'}
        </Lead>
        <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          {[
            'The LED kit has power: its control box light is on.',
            'No other phone has the board open in another app.',
            'You are within a few metres of the board.',
          ].map((tip, index) => (
            <View key={tip} className="flex-row gap-3">
              <View className="size-6 items-center justify-center rounded-full bg-secondary">
                <Text className="text-sm font-semibold" allowFontScaling={false}>
                  {index + 1}
                </Text>
              </View>
              <Text className="flex-1 text-sm">{tip}</Text>
            </View>
          ))}
        </View>
      </>
    );
  } else if (phase === 'search') {
    footer = without;
    body = (
      <>
        <View className="h-52 items-center justify-center">
          <Pulse />
          {[104, 76, 48].map((radius, index) => (
            <View
              key={radius}
              className="absolute rounded-full border-[1.5px] border-border"
              style={{ width: radius * 2, height: radius * 2, opacity: [0.35, 0.6, 1][index] }}
            />
          ))}
          <View className="size-[60px] items-center justify-center rounded-full bg-secondary">
            <Icon as={devices.length ? BluetoothConnectedIcon : BluetoothIcon} size={28} />
          </View>
        </View>
        <Lead
          title={
            devices.length === 0
              ? 'Looking for your board…'
              : `Found ${devices.length} ${devices.length === 1 ? 'board' : 'boards'}`
          }>
          {devices.length === 0
            ? 'This usually takes a few seconds.'
            : devices.length === 1
              ? 'Connecting to it.'
              : 'Tap the one on your wall.'}
        </Lead>
        <View className="gap-3">
          {devices.map((found, index) => {
            const busy = status === 'connecting' && device?.id === found.id;
            return (
              <Pressable
                key={found.id}
                onPress={() => connect(found)}
                accessibilityRole="button"
                className={cn(
                  'flex-row items-center gap-4 rounded-2xl bg-card p-4 active:opacity-80',
                  busy ? 'border-2 border-foreground' : 'm-px border border-border'
                )}>
                <View
                  className={cn(
                    'size-10 items-center justify-center rounded-xl',
                    busy ? 'bg-secondary' : 'bg-muted'
                  )}>
                  <Icon
                    as={(found.rssi ?? -60) > -75 ? CellSignalHighIcon : CellSignalLowIcon}
                    size={22}
                  />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="font-semibold">{found.name}</Text>
                  <Text className="text-xs text-muted-foreground font-medium">
                    {busy
                      ? 'Connecting…'
                      : (found.rssi ?? -60) > -75
                        ? 'Strong signal'
                        : 'Weak signal'}
                    {index === 0 && devices.length > 1 ? ' · closest' : ''}
                  </Text>
                </View>
                {busy ? (
                  <ActivityIndicator color={theme.foreground} />
                ) : (
                  <Icon as={CaretRightIcon} size={18} className="text-muted-foreground" />
                )}
              </Pressable>
            );
          })}
        </View>
      </>
    );
  } else {
    footer = (
      <Button
        size="lg"
        onPress={() => {
          setPhase('search');
          search();
        }}>
        <ButtonLabel>Continue</ButtonLabel>
      </Button>
    );
    body = (
      <>
        <Tile icon={BluetoothIcon} />
        <Lead title="Bluetooth, only for lights">
          67slopers talks to your board and nothing else. No internet, no location history, nothing
          leaves this phone.
        </Lead>
        <View className="rounded-2xl border border-border bg-card px-4">
          {[
            'The LED kit is plugged in',
            'You are standing near the board',
            'No other phone is connected',
          ].map((line, index) => (
            <View
              key={line}
              className={cn(
                'min-h-12 flex-row items-center gap-3',
                index > 0 && 'border-t border-border'
              )}>
              <Icon as={CheckCircleIcon} size={22} />
              <Text className="flex-1 text-sm font-medium">{line}</Text>
            </View>
          ))}
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title }} />
      <Screen footer={footer} contentClassName="gap-6 pt-8">
        {body}
      </Screen>
    </>
  );
}
