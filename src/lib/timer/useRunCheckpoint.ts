import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { clearActiveRun, loadActiveRun, saveActiveRun } from '../store/active-run';
import { checkpointFrom, type ActiveRun, type RunInfo } from './checkpoint';
import type { EngineState } from './engine';

const now = () => performance.now();

/**
 * Keeps a checkpoint of the running workout in storage: at every interval change, on pause and
 * resume, and whenever the app leaves the foreground, where the OS may end it. The first time
 * the run is under way, an older unfinished run still in storage goes to `onAbandoned`, so it
 * can be kept in history before this run's checkpoint replaces it. A finished run clears it.
 */
export function useRunCheckpoint(
  state: EngineState,
  info: RunInfo,
  finished: boolean,
  onAbandoned: (run: ActiveRun) => void
) {
  const latest = useRef({ state, info, onAbandoned });
  useEffect(() => {
    latest.current = { state, info, onAbandoned };
  });
  const checkedOlder = useRef(false);

  const save = () => {
    const run = checkpointFrom(latest.current.state, now(), latest.current.info);
    if (run) void saveActiveRun(run);
  };

  const { status, index, phaseStartedAt, pausedTotal } = state;
  useEffect(() => {
    if (status !== 'running' && status !== 'paused') return;
    if (checkedOlder.current) {
      save();
      return;
    }
    checkedOlder.current = true;
    void loadActiveRun().then((older) => {
      if (older && older.startedAt !== latest.current.info.startedAt) {
        latest.current.onAbandoned(older);
      }
      save();
    });
    // Saved exactly when the run's position changes; everything else is read from `latest`.
  }, [status, index, phaseStartedAt, pausedTotal]);

  useEffect(() => {
    if (finished) void clearActiveRun();
  }, [finished]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') save();
    });
    return () => subscription.remove();
  }, []);
}
