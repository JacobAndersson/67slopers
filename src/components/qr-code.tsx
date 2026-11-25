import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { PitchMark } from '@/components/rivet-mark';
import { PALETTE } from '@/lib/theme';
import { logoSpan, makeQr, qrPath } from '@/lib/qr';

/**
 * A QR code on a white card (design: share-share-workout): Night modules on white in both modes,
 * because scanners need contrast, and the app icon on a white quiet zone in the middle when the
 * error correction can carry it. `size` is the width of the modules; the card adds 28 pt.
 */
export function QrCode({
  value,
  size,
  label = 'QR code of the workout',
}: {
  value: string;
  size: number;
  label?: string;
}) {
  const qr = useMemo(() => makeQr(value), [value]);
  // Whole pixels per module, so neighbouring rows meet without anti-aliased seams.
  const module = Math.max(1, Math.floor(size / qr.size));
  const side = module * qr.size;
  const span = logoSpan(qr);
  const hole = span * module;
  const icon = hole - 12;
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={label}
      className="items-center justify-center rounded-card border border-line bg-white"
      style={{ padding: Math.max(28, module * 2) + (size - side) / 2 }}>
      <View style={{ width: side, height: side }}>
        <Svg width={side} height={side} viewBox={`0 0 ${qr.size} ${qr.size}`}>
          <Path d={qrPath(qr, 0)} fill={PALETTE.night} />
          {span ? (
            <Rect
              x={(qr.size - span) / 2}
              y={(qr.size - span) / 2}
              width={span}
              height={span}
              rx={span * 0.24}
              fill="#FFFFFF"
            />
          ) : null}
        </Svg>
        {span && icon > 16 ? (
          <View
            className="absolute items-center justify-center bg-night"
            style={{
              width: icon,
              height: icon,
              left: (side - icon) / 2,
              top: (side - icon) / 2,
              borderRadius: icon * 0.24,
            }}>
            <PitchMark width={icon * 0.64} color={PALETTE.glow} />
          </View>
        ) : null}
      </View>
    </View>
  );
}
