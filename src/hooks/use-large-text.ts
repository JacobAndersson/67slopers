import { useWindowDimensions } from 'react-native';

/** Above this system font scale, rows of controls stack and secondary detail moves under titles. */
export const LARGE_TEXT_SCALE = 1.3;

/** The phone is set to large text: lay out for it (design: found-a11y-home, found-a11y-steps). */
export function useLargeText(): boolean {
  return useWindowDimensions().fontScale > LARGE_TEXT_SCALE;
}
