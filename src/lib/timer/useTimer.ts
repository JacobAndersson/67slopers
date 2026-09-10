import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import type { WorkoutTimings } from '../store/types';
import * as engine from './engine';
import { expandWorkout } from './intervals';

const TICK_MS = 100;
const now = () => performance.now();

/**
 * Drives the pure engine from a 100 ms display tick. All timing comes from the monotonic
 * clock, so the tick rate only affects how often the screen refreshes.
 */
export function useTimer(timings: WorkoutTimings) {
  const intervals = useMemo(() => expandWorkout(timings), [timings]);
  const [state, setState] = useState(() => engine.createEngine(intervals, now()));
  const [clock, setClock] = useState(now);

  useEffect(() => {
    if (state.status !== 'running') return;
    const advance = () => {
      const t = now();
      setState((s) => engine.tick(s, t));
      setClock(t);
    };
    const id = setInterval(advance, TICK_MS);
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') advance();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [state.status]);

  const act = useCallback((fn: (s: engine.EngineState, t: number) => engine.EngineState) => {
    const t = now();
    setState((s) => fn(s, t));
    setClock(t);
  }, []);

  return {
    status: state.status,
    interval: engine.current(state),
    nextInterval: engine.next(state),
    nextHang: engine.nextHang(state),
    remainingSeconds: engine.remainingSeconds(state, clock),
    progress: engine.progress(state, clock),
    completedSets: engine.completedSets(state),
    totalSets: intervals[0]?.setCount ?? 0,
    /** Wall-clock seconds since start, pauses included. Freezes once the timer stops. */
    elapsedSeconds: state.status === 'idle' ? 0 : (clock - state.startedAt) / 1000,
    start: () => act(engine.start),
    pause: () => act(engine.pause),
    resume: () => act(engine.resume),
    skip: () => act(engine.skip),
    back: () => act(engine.back),
    end: () => setState(engine.end),
  };
}
