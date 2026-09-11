import AsyncStorage from '@react-native-async-storage/async-storage';

import { parseActiveRun, type ActiveRun } from '../timer/checkpoint';

/**
 * The checkpoint of the run in progress, in its own small storage key so the store's big blob
 * is not rewritten at every interval. Operations run strictly in order, so a clear after the
 * run finished can never be overtaken by the last save. Storage errors are swallowed: losing a
 * checkpoint must never break the timer.
 */
const KEY = 'hangboard:active-run';

let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const next = queue.then(operation, operation);
  queue = next.catch(() => undefined);
  return next;
}

export function saveActiveRun(run: ActiveRun): Promise<void> {
  return enqueue(() => AsyncStorage.setItem(KEY, JSON.stringify(run))).catch(() => undefined);
}

export function clearActiveRun(): Promise<void> {
  return enqueue(() => AsyncStorage.removeItem(KEY)).catch(() => undefined);
}

export function loadActiveRun(): Promise<ActiveRun | null> {
  return enqueue(async () => {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? parseActiveRun(JSON.parse(raw)) : null;
  }).catch(() => null);
}
