import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { vibrateCue } from '../../../modules/cue-vibration/src/CueVibrationModule';

import type { Settings } from '../store/types';
import type { Cue } from './cues';

const DOUBLE_BEEP_GAP_MS = 120;
/** Length of the Android vibration; a short, firm buzz. */
const TAP_MS = 120;

export type CuePlayer = {
  play: (cue: Cue, settings: Settings) => void;
  release: () => void;
};

/**
 * Plays timer cues. Created when a timer mounts and released when it unmounts, so nothing
 * audio-related runs on the launch path. Sound is one short beep (twice at the end of the
 * workout); vibration is one heavy tap. Every native call is guarded, so a platform without
 * haptics (web) or a failed audio session never breaks the timer.
 */
export function createCuePlayer(): CuePlayer {
  let player: AudioPlayer | null = null;
  let released = false;

  const ensurePlayer = () => {
    if (player || released) return player;
    try {
      player = createAudioPlayer(require('../../../assets/sounds/beep.wav'));
      setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers',
        shouldPlayInBackground: false,
      }).catch(() => {});
    } catch {
      player = null;
    }
    return player;
  };

  const beep = () => {
    const p = ensurePlayer();
    if (!p) return;
    try {
      p.seekTo(0);
      p.play();
    } catch {
      // A player that failed to load stays silent.
    }
  };

  // Android files both expo-haptics and React Native's plain vibration under the "touch
  // feedback" setting, which phones with touch vibration off silently drop. The local
  // cue-vibration module tags the buzz as an alarm instead. iOS keeps the Taptic impact.
  const tap = () => {
    if (Platform.OS === 'android') {
      try {
        vibrateCue(TAP_MS);
      } catch {
        // No vibrator.
      }
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  };

  return {
    play: (cue, settings) => {
      if (settings.sound) {
        beep();
        if (cue === 'done') setTimeout(beep, DOUBLE_BEEP_GAP_MS);
      }
      if (settings.vibration) {
        tap();
        if (cue === 'done') setTimeout(tap, DOUBLE_BEEP_GAP_MS);
      }
    },
    release: () => {
      released = true;
      try {
        player?.remove();
      } catch {
        // Already gone.
      }
      player = null;
    },
  };
}
