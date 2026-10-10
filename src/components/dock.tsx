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

import { DeadHangIcon, MoonBoardIcon } from '@/components/training-icons';
import { Icon } from '@/components/ui/icon';
import { useLights } from '@/lib/moonboard/lights';
import { SPRING_SETTLE } from '@/lib/motion';
import { THEME } from '@/lib/theme';

const ITEM = 48;
const GAP = 4;
const PAD = 6;
const SEPARATOR = 17;

export const DOCK_TABS = [
  { name: 'home', href: '/', label: 'Home', icon: HouseIcon },
  { name: 'hang', href: '/hang', label: 'Hang', icon: DeadHangIcon },
  { name: 'climb', href: '/climb', label: 'Climb', icon: MoonBoardIcon },
  { name: 'log', href: '/log', label: 'Log', icon: CalendarBlankIcon },
  { name: 'settings', href: '/settings', label: 'Settings', icon: GearSixIcon },
] as const;

/** Settings sits apart, after the separator. */
const offsetOf = (index: number) =>
  PAD + index * (ITEM + GAP) + (index === DOCK_TABS.length - 1 ? SEPARATOR + GAP : 0);

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
      style={{ width: ITEM, height: ITEM }}>
      <Icon
        as={icon}
        size={24}
        weight={isFocused ? 'fill' : 'regular'}
        className={isFocused ? 'text-foreground' : 'text-muted-foreground'}
      />
      {badge ? (
        <View className="absolute right-2 top-2 size-2.5 rounded-full border-2 border-card bg-hold-start" />
      ) : null}
    </Pressable>
  );
}

/**
 * The floating dock: five places, icons only, a tile that glides to the active one. Content
 * scrolls underneath and fades into the background before it reaches the bar.
 */
export function Dock() {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const x = useSharedValue(offsetOf(0));
  const lit = useLights((s) => s.status === 'connected');
  const tile = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const bottom = Math.max(insets.bottom, 12) + 8;

  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 bottom-0 items-center">
      <View
        pointerEvents="none"
        className="absolute inset-x-0 bottom-0"
        style={{ height: bottom + 104 }}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="dock-fade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={THEME.background} stopOpacity={0} />
              <Stop offset="0.62" stopColor={THEME.background} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#dock-fade)" />
        </Svg>
      </View>
      <View
        accessibilityRole="tablist"
        className="flex-row items-center rounded-[22px] border border-border bg-card shadow-lg shadow-black/20"
        style={{ marginBottom: bottom, padding: PAD, gap: GAP }}>
        <Animated.View
          pointerEvents="none"
          className="absolute rounded-[14px] bg-secondary"
          style={[{ width: ITEM, height: ITEM, top: PAD, left: 0 }, tile]}
        />
        {DOCK_TABS.map((tab, index) => (
          <View key={tab.name} className="flex-row items-center" style={{ gap: GAP }}>
            {index === DOCK_TABS.length - 1 ? (
              <View className="items-center" style={{ width: SEPARATOR }}>
                <View className="h-6 w-px bg-border" />
              </View>
            ) : null}
            <TabTrigger name={tab.name} asChild>
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
          </View>
        ))}
      </View>
    </View>
  );
}
