/** A LED kit seen while searching. */
export type LightsDevice = { id: string; name: string; rssi?: number };

/** Why the lights cannot be reached. */
export type LightsProblem = 'off' | 'denied' | 'unsupported' | 'failed';

/**
 * The Bluetooth side of the lights, per platform (`ble.ts`, `ble.web.ts`). Everything the
 * app decides lives above this, in `lights.ts`.
 */
export type LightsTransport = {
  /** Reports boards as they are seen. Returns the function that stops the search. */
  scan: (
    onDevice: (device: LightsDevice) => void,
    onProblem: (p: LightsProblem) => void
  ) => () => void;
  /** Connects, and calls `onLost` if the link later drops by itself. */
  connect: (id: string, onLost: () => void) => Promise<void>;
  /** One write of at most twenty ASCII characters. */
  write: (chunk: string) => Promise<void>;
  disconnect: () => Promise<void>;
  /** False where a remembered board cannot be reconnected without the user picking it. */
  canReconnect: boolean;
};
