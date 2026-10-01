import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';

export function SlabBrand() {
  return (
    <View className="flex-row items-center gap-2.5" accessibilityLabel="67slopers">
      <View className="rounded-md bg-chart-1 p-1">
        <Svg width={28} height={28} viewBox="0 0 100 100" aria-hidden>
          <Path
            fill={THEME.foreground}
            fillRule="evenodd"
            d="M15 74 34 22c3-8 11-12 20-10l29 7-18 56c-2 8-10 12-18 10L15 74Z M32 62l12-30 23 6-12 31Z"
          />
          <Path fill={THEME.foreground} d="m32 62 23 7-3 9-24-6Z" />
        </Svg>
      </View>
      <Text className="text-lg font-semibold">67slopers</Text>
    </View>
  );
}
