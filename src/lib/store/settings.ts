import { DEFAULT_SETTINGS, type Settings } from './types';

/** Old or partial blobs must not erase new defaults, or overwrite an explicit false. */
export function normalizeSettings(value: unknown): Settings {
  const record = (value ?? {}) as Partial<Settings>;
  return {
    sound: typeof record.sound === 'boolean' ? record.sound : DEFAULT_SETTINGS.sound,
    vibration:
      typeof record.vibration === 'boolean' ? record.vibration : DEFAULT_SETTINGS.vibration,
    genZMode: typeof record.genZMode === 'boolean' ? record.genZMode : false,
  };
}
