import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { COUNT_MS, countUp } from '@/lib/count-up';

/**
 * A figure that counts up from 0 once, when it mounts, then shows its value as it changes. Render
 * it inside a Text. Nunito's figures are tabular, so the digits hold still while they count.
 * Reduced motion shows the value straight away.
 */
export function CountUp({
  value,
  format = String,
  delayMs = 0,
}: {
  value: number;
  format?: (value: number) => string;
  delayMs?: number;
}) {
  const reduced = useReducedMotion();
  // The count in flight; null once it has landed.
  const [count, setCount] = useState<number | null>(reduced ? null : 0);
  const target = useRef(value);
  useEffect(() => {
    target.current = value;
  }, [value]);

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const start = performance.now() + delayMs;
    const tick = (now: number) => {
      const elapsed = now - start;
      if (elapsed >= COUNT_MS) return setCount(null);
      setCount(countUp(target.current, elapsed));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced, delayMs]);

  return format(count ?? value);
}
