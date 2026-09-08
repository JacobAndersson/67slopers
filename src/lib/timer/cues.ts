import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type CuePlayer = {
  countdown: () => void;
  boundary: () => void;
  done: () => void;
  release: () => void;
};

type Flags = () => { sound: boolean; vibration: boolean };

/**
 * Bundled tones plus haptics. Created when the timer screen mounts, never at app
 * launch. Audio ducks other apps instead of stopping them and plays through the iOS
 * silent switch, since a timer you cannot hear is useless under the board.
 */
export function createCuePlayer(getFlags: Flags): CuePlayer {
  let short: AudioPlayer | null = null;
  let long: AudioPlayer | null = null;
  let finish: AudioPlayer | null = null;

  setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' }).catch(() => {});
  try {
    short = createAudioPlayer(require('@/assets/sounds/beep-short.wav'));
    long = createAudioPlayer(require('@/assets/sounds/beep-long.wav'));
    finish = createAudioPlayer(require('@/assets/sounds/done.wav'));
  } catch {
    // Audio is optional; the visual timer keeps working without it.
  }

  const play = (player: AudioPlayer | null) => {
    if (!player || !getFlags().sound) return;
    player.seekTo(0).catch(() => {});
    player.play();
  };
  const haptic = (fn: () => Promise<void>) => {
    if (Platform.OS === 'web' || !getFlags().vibration) return;
    fn().catch(() => {});
  };

  return {
    countdown: () => {
      play(short);
      haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    },
    boundary: () => {
      play(long);
      haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    },
    done: () => {
      play(finish);
      haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    },
    release: () => {
      for (const p of [short, long, finish]) p?.remove();
    },
  };
}
