import { useEffect, useRef } from 'react';

import type { Settings } from '../store/types';
import { createCuePlayer } from './cue-player';
import { boundaryIn, cueFor } from './cues';
import * as engine from './engine';

const now = () => performance.now();

/**
 * Plays a cue exactly when the current interval ends. A timeout is scheduled from the engine's
 * own clock whenever the running interval changes (start, tick into the next interval, skip,
 * back, resume) and cleared on pause, so the cue lands on the true boundary rather than on the
 * next 100 ms display tick. Settings are read at fire time, so a toggle applies immediately.
 */
export function useCues(state: engine.EngineState, settings: Settings) {
  const player = useRef<ReturnType<typeof createCuePlayer> | null>(null);
  const latestSettings = useRef(settings);
  useEffect(() => {
    latestSettings.current = settings;
  }, [settings]);

  useEffect(() => {
    player.current = createCuePlayer();
    return () => {
      player.current?.release();
      player.current = null;
    };
  }, []);

  const { status, index, phaseStartedAt, pausedTotal } = state;
  useEffect(() => {
    const delay = boundaryIn(state, now());
    if (delay === null) return;
    const cue = cueFor(engine.next(state));
    const id = setTimeout(() => {
      player.current?.play(cue, latestSettings.current);
      if (__DEV__) {
        const late = boundaryIn(state, now());
        console.log(`cue ${cue} at interval ${index}, ${late === null ? '?' : -late} ms`);
      }
    }, delay);
    return () => clearTimeout(id);
    // The engine state is derived from exactly these fields for scheduling purposes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, index, phaseStartedAt, pausedTotal]);
}
