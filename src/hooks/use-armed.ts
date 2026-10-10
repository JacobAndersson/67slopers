import { useEffect, useState } from 'react';

/**
 * Confirm-on-second-tap for small destructive actions. `fire(key, action)` arms on the first
 * tap and runs the action on the second; the arming lapses by itself after a few seconds.
 * `armed` is the key that is waiting, so a list can show which row it is.
 */
export function useArmed<K extends string = 'only'>(ms = 4000) {
  const [armed, setArmed] = useState<K | null>(null);
  useEffect(() => {
    if (armed === null) return;
    const timer = setTimeout(() => setArmed(null), ms);
    return () => clearTimeout(timer);
  }, [armed, ms]);
  const fire = (key: K, action: () => void) => {
    if (armed !== key) return setArmed(key);
    setArmed(null);
    action();
  };
  return { armed, fire };
}
