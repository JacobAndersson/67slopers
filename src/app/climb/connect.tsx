import { useRouter } from 'expo-router';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { ArrowsDownUpIcon } from 'phosphor-react-native/src/icons/ArrowsDownUp';
import { ArrowsLeftRightIcon } from 'phosphor-react-native/src/icons/ArrowsLeftRight';
import { BluetoothIcon } from 'phosphor-react-native/src/icons/Bluetooth';
import { BluetoothSlashIcon } from 'phosphor-react-native/src/icons/BluetoothSlash';
import { CellSignalHighIcon } from 'phosphor-react-native/src/icons/CellSignalHigh';
import { CellSignalLowIcon } from 'phosphor-react-native/src/icons/CellSignalLow';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { DotsNineIcon } from 'phosphor-react-native/src/icons/DotsNine';
import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { PowerIcon } from 'phosphor-react-native/src/icons/Power';
import { useEffect, useState, type ReactNode } from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';

import { Appear } from '@/components/appear';
import { MoonBoard } from '@/components/moon-board';
import { Screen } from '@/components/screen';
import { LightSettings } from '@/components/light-settings';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { RivetLoader } from '@/components/rivet-loader';
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

/** The 96 pt Raised tile that carries a state's icon. */
function Tile({ icon, children }: { icon?: PhosphorIcon; children?: ReactNode }) {
  return (
    <View className="size-24 items-center justify-center self-center rounded-[30px] bg-raised">
      {icon ? <Icon as={icon} size={44} /> : children}
    </View>
  );
}

/** A state's title and line, centred under its tile. */
function Lead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <View className="items-center gap-3.5">
      <Text className="type-hero text-center" role="heading">
        {title}
      </Text>
      {children ? <Text className="type-body px-2 text-center text-muted">{children}</Text> : null}
    </View>
  );
}

/** Numbered things to check, on a card. */
function Checklist({ lines, compact }: { lines: string[]; compact?: boolean }) {
  return (
    <View
      className={cn(
        'rounded-3xl border border-line bg-surface pl-5 pr-3',
        compact ? 'py-1' : 'py-[18px]'
      )}>
      {lines.map((line, index) => (
        <View
          key={line}
          className={cn('flex-row gap-3.5', compact ? 'h-[60px] items-center' : 'py-2')}>
          <View className="size-7 items-center justify-center rounded-full bg-raised">
            <Text className="type-caption" allowFontScaling={false}>
              {index + 1}
            </Text>
          </View>
          <Text className={cn('flex-1', compact ? 'type-body-b' : 'type-sub mt-1')}>{line}</Text>
        </View>
      ))}
    </View>
  );
}

/** A choice on a card: a raised icon tile, a title and a line; outlined in Ink when chosen. */
function OptionCard({
  icon,
  title,
  text,
  on,
  onPress,
  trailing,
  role,
}: {
  icon: PhosphorIcon;
  title: string;
  text: string;
  on?: boolean;
  onPress: () => void;
  trailing?: ReactNode;
  role: 'button' | 'checkbox';
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityState={role === 'checkbox' ? { checked: !!on } : undefined}
      className={cn(
        'min-h-20 flex-row items-center gap-4 rounded-3xl bg-surface px-4 py-3 active:opacity-80',
        on ? 'border-2 border-text' : 'm-px border border-line'
      )}>
      <View className="size-11 items-center justify-center rounded-[14px] bg-raised">
        <Icon as={icon} size={22} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="type-row">{title}</Text>
        <Text className="type-caption text-muted">{text}</Text>
      </View>
      {trailing}
    </Pressable>
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
  const again = (
    <View className="gap-2">
      <Button
        size="lg"
        onPress={() => {
          setPhase('search');
          search();
        }}>
        <Text>Search again</Text>
      </Button>
      {without}
    </View>
  );

  let body: ReactNode;
  let footer: ReactNode;
  let title: string | undefined = 'Connect lights';
  // Most states sit lower, under a tile; lists and the fix question start near the top.
  let top = 'pt-16';

  if (phase === 'done') {
    title = undefined;
    top = 'pt-8';
    footer = (
      <Button size="lg" onPress={() => router.back()}>
        <Text>Start climbing</Text>
      </Button>
    );
    body = (
      <>
        <Appear>
          <Tile icon={CheckCircleIcon} />
        </Appear>
        <Lead title="Lights connected">
          {device?.name ?? 'Your board'} reconnects by itself when you open Climb near the board.
        </Lead>
        <LightSettings />
      </>
    );
  } else if (phase === 'fix') {
    title = 'Fix the lights';
    top = 'pt-3';
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
        text: 'Check the power, then test again.',
        onPress: () => setPhase('test'),
      },
    ];
    footer = (
      <Button size="lg" onPress={() => setPhase('test')}>
        <Text>Test again</Text>
      </Button>
    );
    body = (
      <>
        <Text className="type-hero" role="heading">
          What do you see{'\n'}on the wall?
        </Text>
        <View className="gap-3">
          {options.map((option) => (
            <OptionCard
              key={option.title}
              icon={option.icon}
              title={option.title}
              text={option.text}
              on={option.on}
              onPress={option.onPress}
              role={option.on === undefined ? 'button' : 'checkbox'}
              trailing={
                option.on ? <Icon as={CheckCircleIcon} size={24} weight="fill" /> : undefined
              }
            />
          ))}
        </View>
      </>
    );
  } else if (phase === 'test' && status === 'connected') {
    title = 'Check the lights';
    top = 'pt-3';
    footer = (
      <View className="gap-3">
        <Button
          size="lg"
          onPress={() => {
            lightsOff();
            setPhase('done');
          }}>
          <Text>Yes, it matches</Text>
        </Button>
        <Button variant="outline" size="lg" onPress={() => setPhase('fix')}>
          <Text>No, something is off</Text>
        </Button>
      </View>
    );
    body = (
      <>
        <MoonBoard width={202} rows={rows} holds={corners} labels={false} lit radius={20} />
        <Lead title="Four corners lit?">
          Your wall should match: A1, K1, A{rows} and K{rows} in blue.
        </Lead>
      </>
    );
  } else if (status === 'off') {
    footer = again;
    body = (
      <>
        <Tile icon={BluetoothSlashIcon} />
        <Lead title="Bluetooth is off">Turn it on, then search again.</Lead>
      </>
    );
  } else if (status === 'denied') {
    footer = (
      <View className="gap-2">
        <Button size="lg" onPress={() => Linking.openSettings()}>
          <Text>Open Settings</Text>
        </Button>
        {without}
      </View>
    );
    body = (
      <>
        <Tile icon={LockSimpleIcon} />
        <Lead title="Bluetooth is blocked">
          Allow Bluetooth for Rivet in Settings to use the lights. Everything else works without it.
        </Lead>
      </>
    );
  } else if (status === 'unsupported') {
    footer = without;
    body = (
      <>
        <Tile icon={BluetoothSlashIcon} />
        <Lead title="No Bluetooth here">
          {Platform.OS === 'web'
            ? 'This browser cannot talk to the board. Chrome and Edge can, or use the app on your phone.'
            : 'This build of the app cannot use Bluetooth.'}
        </Lead>
      </>
    );
  } else if (status === 'none' || status === 'failed') {
    footer = again;
    body = (
      <>
        <Tile icon={MagnifyingGlassIcon} />
        <Lead title={status === 'none' ? 'No board found' : 'Could not connect'}>
          {status === 'none'
            ? 'Searched for 15 seconds without a reply.'
            : 'The board did not answer.'}
        </Lead>
        <Checklist
          lines={[
            'The LED kit has power: its control box light is on.',
            'No other phone has the board open.',
            'You are within a few metres of the board.',
          ]}
        />
      </>
    );
  } else if (phase === 'search' && devices.length > 1) {
    top = 'pt-3';
    footer = without;
    body = (
      <>
        <Lead title={`Found ${devices.length} boards`}>Tap the one on your wall.</Lead>
        <View className="gap-3">
          {devices.map((found, index) => {
            const busy = status === 'connecting' && device?.id === found.id;
            const strong = (found.rssi ?? -60) > -75;
            return (
              <OptionCard
                key={found.id}
                icon={strong ? CellSignalHighIcon : CellSignalLowIcon}
                title={found.name}
                text={
                  busy
                    ? 'Connecting…'
                    : `${strong ? 'Strong signal' : 'Weak signal'}${index === 0 ? '  ·  closest' : ''}`
                }
                on={busy}
                role="button"
                onPress={() => connect(found)}
                trailing={busy ? <RivetLoader size={24} color={theme.text} /> : undefined}
              />
            );
          })}
        </View>
      </>
    );
  } else if (phase === 'search') {
    footer = without;
    const one = devices[0];
    body = (
      <>
        {/* The brand's loader, the one sanctioned moving use of the bars: working, not stuck. */}
        <Tile>
          <RivetLoader size={60} color={theme.text} />
        </Tile>
        <Lead title={one ? `Connecting to ${one.name}` : 'Looking for your board'}>
          {one ? 'Hold on a moment.' : 'This usually takes a few seconds.'}
        </Lead>
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
        <Text>Continue</Text>
      </Button>
    );
    body = (
      <>
        <Tile icon={BluetoothIcon} />
        <Lead title={'Bluetooth, only\nfor the lights'}>
          Rivet talks to your board and nothing else. No internet, no location, nothing leaves this
          phone.
        </Lead>
        <Checklist
          compact
          lines={[
            'The LED kit is plugged in',
            'You are standing near the board',
            'No other phone is connected',
          ]}
        />
      </>
    );
  }

  return (
    <Screen
      header={<TopBar left="close" title={title} />}
      footer={footer}
      contentClassName={cn('gap-8', top)}>
      {body}
    </Screen>
  );
}
