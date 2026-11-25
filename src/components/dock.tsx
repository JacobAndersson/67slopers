import { TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';
import { GearSixIcon } from 'phosphor-react-native/src/icons/GearSix';
import { HouseIcon } from 'phosphor-react-native/src/icons/House';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { BoardSprayIcon, HangboardIcon } from '@/components/training-icons';
import { Icon } from '@/components/ui/icon';
import { useLights } from '@/lib/moonboard/lights';
import { SPRING_SETTLE } from '@/lib/motion';
import { useAppTheme } from '@/lib/use-theme';

const WIDTH = 300;
const HEIGHT = 64;
const PAD = 8;
const SLOT = (WIDTH - PAD * 2) / 5;
const TILE = { width: SLOT - 4, height: HEIGHT - 16 };

export const DOCK_TABS = [
  { name: 'home', href: '/', label: 'Home', icon: HouseIcon },
  { name: 'hang', href: '/hang', label: 'Hang', icon: HangboardIcon },
  { name: 'climb', href: '/climb', label: 'Climb', icon: BoardSprayIcon },
  { name: 'log', href: '/log', label: 'Log', icon: CalendarBlankIcon },
  { name: 'settings', href: '/settings', label: 'Settings', icon: GearSixIcon },
] as const;

const offsetOf = (index: number) => PAD + index * SLOT + 2;

const dockBottom = (inset: number) => Math.max(inset, 16) + 8;

type DockItemProps = TabTriggerSlotProps & {
  icon: PhosphorIcon;
  label: string;
  badge?: boolean;
  onActive: () => void;
};

function DockItem({ icon, label, badge, onActive, isFocused, ...props }: DockItemProps) {
  useEffect(() => {
    if (isFocused) onActive();
  }, [isFocused, onActive]);
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!isFocused }}
      className="items-center justify-center active:opacity-70"
      style={{ width: SLOT, height: HEIGHT }}>
      <Icon
        as={icon}
        size={26}
        weight={isFocused ? 'fill' : 'regular'}
        className={isFocused ? 'text-dock-fg' : 'text-dock-dim'}
      />
      {badge ? (
        <View
          className="absolute size-[7px] rounded-full bg-dock-fg"
          style={{ top: 15, left: SLOT / 2 + 9 }}
        />
      ) : null}
    </Pressable>
  );
}

/**
 * The floating Ink dock (design/rivet/app/ui.py `dock`): five places as icons, the active one on
 * a lighter tile with its Fill icon. The tile glides between places on the Rivet spring. Content
 * scrolls underneath and fades into the canvas before it reaches the bar.
 */
export function Dock() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const x = useSharedValue(offsetOf(0));
  const lit = useLights((s) => s.status === 'connected');
  const tile = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const bottom = dockBottom(insets.bottom);

  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 bottom-0 items-center">
      <View
        pointerEvents="none"
        className="absolute inset-x-0 bottom-0"
        style={{ height: bottom + HEIGHT + 48 }}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="dock-fade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.canvas} stopOpacity={0} />
              <Stop offset="0.55" stopColor={theme.canvas} stopOpacity={0.94} />
              <Stop offset="1" stopColor={theme.canvas} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#dock-fade)" />
        </Svg>
      </View>
      <View
        accessibilityRole="tablist"
        className="flex-row items-center rounded-full bg-dock"
        style={{
          width: WIDTH,
          height: HEIGHT,
          paddingHorizontal: PAD,
          marginBottom: bottom,
          shadowColor: '#0B0F1C',
          shadowOpacity: 0.22,
          shadowRadius: 15,
          shadowOffset: { width: 0, height: 10 },
          elevation: 12,
        }}>
        <Animated.View
          pointerEvents="none"
          className="absolute rounded-full bg-selected-tile"
          style={[{ ...TILE, top: 8, left: 0 }, tile]}
        />
        {DOCK_TABS.map((tab, index) => (
          <TabTrigger key={tab.name} name={tab.name} asChild>
            <DockItem
              icon={tab.icon}
              label={tab.label}
              badge={tab.name === 'climb' && lit}
              onActive={() => {
                x.value = reducedMotion
                  ? offsetOf(index)
                  : withSpring(offsetOf(index), SPRING_SETTLE);
              }}
            />
          </TabTrigger>
        ))}
      </View>
    </View>
  );
}
