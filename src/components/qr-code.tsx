import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { makeQr, qrPath, QUIET_ZONE } from '@/lib/qr';
import { THEME } from '@/lib/theme';

/**
 * A QR code as one SVG path, quiet zone included. Theme ink on the background colour: scanners
 * need contrast, not pure black and white.
 */
export function QrCode({ value, size }: { value: string; size: number }) {
  const qr = useMemo(() => makeQr(value), [value]);
  const modules = qr.size + QUIET_ZONE * 2;
  // Whole pixels per module, so neighbouring rows meet without anti-aliased seams.
  const side = Math.max(modules, Math.floor(size / modules) * modules);
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="QR code of the workout"
      style={{ width: side, height: side }}>
      <Svg width={side} height={side} viewBox={`0 0 ${modules} ${modules}`}>
        <Rect width={modules} height={modules} fill={THEME.background} />
        <Path d={qrPath(qr)} fill={THEME.foreground} />
      </Svg>
    </View>
  );
}
