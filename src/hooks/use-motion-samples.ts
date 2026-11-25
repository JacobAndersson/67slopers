import { DeviceMotion } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';

import type { MotionSample } from '@/lib/wall-photos/types';

const INTERVAL_MS = 20;
const KEEP_MS = 4000;
const SHOW_EVERY_MS = 100;

/**
 * Listens to the phone's motion at 50 Hz while `active`, keeping the last few seconds of
 * samples on the JS clock (`performance.now()`) so a shutter press can be lined up with them.
 * `latest` re-renders at most ten times a second, for live readouts; `onTick` runs with it.
 */
export function useMotionSamples(
  active: boolean,
  /** Called with the whole buffer on every readout tick (ten times a second). */
  onTick?: (samples: readonly MotionSample[], now: number) => void
) {
  const samples = useRef<MotionSample[]>([]);
  const tick = useRef(onTick);
  useEffect(() => {
    tick.current = onTick;
  });
  const [latest, setLatest] = useState<MotionSample | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let shownAt = 0;
    let subscription: { remove: () => void } | null = null;
    DeviceMotion.isAvailableAsync().then((ok) => {
      if (cancelled) return;
      setAvailable(ok);
      if (!ok) return;
      DeviceMotion.setUpdateInterval(INTERVAL_MS);
      subscription = DeviceMotion.addListener((m) => {
        const g = m.accelerationIncludingGravity;
        if (!g) return;
        const t = performance.now();
        const sample: MotionSample = {
          t,
          sensorT: g.timestamp,
          gravity: { x: g.x, y: g.y, z: g.z },
          rotation: m.rotation
            ? { alpha: m.rotation.alpha, beta: m.rotation.beta, gamma: m.rotation.gamma }
            : null,
          rotationRate: m.rotationRate
            ? {
                alpha: m.rotationRate.alpha,
                beta: m.rotationRate.beta,
                gamma: m.rotationRate.gamma,
              }
            : null,
          orientation: m.orientation,
        };
        const buffer = samples.current;
        buffer.push(sample);
        while (buffer.length && buffer[0].t < t - KEEP_MS) buffer.shift();
        if (t - shownAt >= SHOW_EVERY_MS) {
          shownAt = t;
          setLatest(sample);
          tick.current?.(buffer, t);
        }
      });
    });
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [active]);

  return { samples, latest, available };
}
