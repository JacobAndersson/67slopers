import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import type { WorkoutTimings } from '../store/types';
import * as engine from './engine';
import { expandWorkout, type Interval } from './intervals';

export type CueKind = 'countdown' | 'boundary' | 'done';

type Options = {
  onCue?: (kind: CueKind, interval: Interval) => void;
};

const TICK_MS = 100;
const now = () => performance.now();

/**
 * Drives the pure engine from a 100 ms display tick. All timing comes from the monotonic
 * clock, so the tick rate only affects how often the screen refreshes. Cues are detected
 * on the tick as well: a phase change fires `boundary` (or `done`), and the last three
 * whole seconds of an interval fire `countdown` once each.
 */
export function useTimer(timings: WorkoutTimings, { onCue }: Options = {}) {
  const intervals = useMemo(() => expandWorkout(timings), [timings]);
  const [state, setState] = useState(() => engine.createEngine(intervals, now()));
  const [clock, setClock] = useState(now);
  const cueRef = useRef(onCue);
  useEffect(() => {
    cueRef.current = onCue;
  });
  const lastIndex = useRef(state.index);
  const lastCountdown = useRef<number | null>(null);

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

  useEffect(() => {
    if (state.index === lastIndex.current) return;
    lastIndex.current = state.index;
    lastCountdown.current = null;
    cueRef.current?.(state.status === 'done' ? 'done' : 'boundary', engine.current(state));
  }, [state]);

  useEffect(() => {
    if (state.status !== 'running') return;
    const interval = engine.current(state);
    const secondsLeft = Math.ceil(engine.remainingSeconds(state, clock));
    if (
      secondsLeft >= 1 &&
      secondsLeft <= 3 &&
      secondsLeft < interval.seconds &&
      secondsLeft !== lastCountdown.current
    ) {
      lastCountdown.current = secondsLeft;
      cueRef.current?.('countdown', interval);
    }
  }, [state, clock]);

  const act = useCallback((fn: (s: engine.EngineState, t: number) => engine.EngineState) => {
    const t = now();
    setState((s) => fn(s, t));
    setClock(t);
  }, []);

  return {
    status: state.status,
    interval: engine.current(state),
    nextInterval: engine.next(state),
    remainingSeconds: engine.remainingSeconds(state, clock),
    progress: engine.progress(state, clock),
    completedSets: engine.completedSets(state),
    totalSets: intervals[0]?.setCount ?? 0,
    /** Wall-clock seconds since start, pauses included. Freezes once the timer stops. */
    elapsedSeconds: (clock - state.startedAt) / 1000,
    pause: () => act(engine.pause),
    resume: () => act(engine.resume),
    skip: () => act(engine.skip),
    back: () => act(engine.back),
    end: () => setState(engine.end),
  };
}
