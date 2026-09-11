import { requireOptionalNativeModule } from 'expo-modules-core';
import { Vibration } from 'react-native';

type CueVibrationNative = { vibrate(milliseconds: number): void };

/**
 * Present in builds that include this local module; null in Expo Go, where the plain
 * vibration is the best available (it follows the touch-feedback setting).
 */
const native = requireOptionalNativeModule<CueVibrationNative>('CueVibration');

/** Vibrates for `milliseconds`, tagged as an alarm on Android 13+ so it is not filed as touch feedback. */
export function vibrateCue(milliseconds: number): void {
  if (native) {
    native.vibrate(milliseconds);
    return;
  }
  Vibration.vibrate(milliseconds);
}
