import { create } from 'zustand';

import { useClimb } from '../store/climb';
import { getLayout } from './boards';
import { transport } from './ble';
import { CLEAR, encodeCorners, encodeProblem } from './protocol';
import { createSender } from './send';
import type { LightsDevice, LightsProblem } from './transport';
import type { ProblemHolds } from './types';

export type LightsStatus =
  | 'idle'
  | 'searching'
  | 'connecting'
  | 'connected'
  /** The link dropped by itself; the app is trying to get it back. */
  | 'reconnecting'
  /** Searched for a while and saw no board. */
  | 'none'
  | LightsProblem;

/** How long a search runs before it gives up. */
export const SEARCH_MS = 15000;
const RETRY_MS = 3000;
const RETRIES = 10;

type LightsState = {
  status: LightsStatus;
  /** Boards seen in this search, strongest signal first. */
  devices: LightsDevice[];
  device: LightsDevice | null;
  /** What the app last put on the wall: a problem id, 'corners', or nothing. */
  lit: string | null;
};

/** Live state of the lights. Not persisted: a fresh launch starts disconnected. */
export const useLights = create<LightsState>(() => ({
  status: 'idle',
  devices: [],
  device: null,
  lit: null,
}));

// A refused write means the board is gone, whether or not the radio has noticed yet.
const send = createSender(
  (chunk) => transport.write(chunk),
  undefined,
  () => {
    if (useLights.getState().status === 'connected') lost();
  }
);
let stopScan: (() => void) | null = null;
let searchTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

function endSearch() {
  stopScan?.();
  stopScan = null;
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = null;
}

function stopRetrying() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
}

function encodeOptions() {
  const { setup, lights } = useClimb.getState();
  return {
    rows: setup ? getLayout(setup.layout).rows : 18,
    above: lights.above,
    mirror: lights.mirror,
    reverse: lights.reverse,
  };
}

/** Looks for boards. Ends by itself after a while, or as soon as one is connected. */
export function search() {
  turn += 1;
  endSearch();
  stopRetrying();
  useLights.setState({ status: 'searching', devices: [] });
  stopScan = transport.scan(
    (found) =>
      useLights.setState((s) => ({
        devices: [...s.devices.filter((d) => d.id !== found.id), found].sort(
          (a, b) => (b.rssi ?? -999) - (a.rssi ?? -999)
        ),
      })),
    (problem) => {
      endSearch();
      useLights.setState({ status: problem });
    }
  );
  searchTimer = setTimeout(() => {
    if (useLights.getState().status !== 'searching') return;
    const seen = useLights.getState().devices.length > 0;
    endSearch();
    if (!seen) useLights.setState({ status: 'none' });
  }, SEARCH_MS);
}

export function cancelSearch() {
  endSearch();
  if (useLights.getState().status === 'searching') useLights.setState({ status: 'idle' });
}

/**
 * Every search, connect and disconnect starts a new turn. An attempt that finishes after the
 * turn has moved on (the climber disconnected while it was dialling) leaves the state alone.
 */
let turn = 0;

/** Opens the link. Resolves 'open', the reason it failed, or 'stale' when overtaken. */
async function open(target: LightsDevice): Promise<'open' | 'stale' | LightsProblem> {
  const mine = ++turn;
  try {
    await transport.connect(target.id, lost);
    if (mine !== turn) return 'stale';
    useLights.setState({ status: 'connected', device: target, lit: null });
    return 'open';
  } catch (error) {
    if (mine !== turn) return 'stale';
    const reason = (error as Error).message as LightsProblem;
    return (['off', 'denied', 'unsupported'] as LightsProblem[]).includes(reason)
      ? reason
      : 'failed';
  }
}

/** The link dropped by itself: try to get it back for a while, where the platform allows. */
function lost() {
  const { device } = useLights.getState();
  if (!device || !transport.canReconnect) {
    useLights.setState({ status: 'idle', device: null, lit: null });
    return;
  }
  useLights.setState({ status: 'reconnecting', lit: null });
  let attempts = 0;
  const attempt = async () => {
    attempts += 1;
    const result = await open(device);
    if (result === 'open' || result === 'stale') return;
    if (attempts >= RETRIES) useLights.setState({ status: 'idle', device: null });
    else retryTimer = setTimeout(attempt, RETRY_MS);
  };
  retryTimer = setTimeout(attempt, RETRY_MS);
}

/** Connects to a board and remembers it. Resolves true when the link is up. */
export async function connect(target: LightsDevice): Promise<boolean> {
  endSearch();
  stopRetrying();
  useLights.setState({ status: 'connecting', device: target });
  const result = await open(target);
  if (result === 'open') {
    useClimb.getState().setLights({ deviceId: target.id, deviceName: target.name });
  } else if (result !== 'stale') {
    useLights.setState({ status: result, device: null });
  }
  return result === 'open';
}

/** On opening Climb: quietly get the remembered board back, if the climber wants that. */
export async function autoConnect() {
  const { lights } = useClimb.getState();
  const { status } = useLights.getState();
  if (!lights.autoConnect || !lights.deviceId || status !== 'idle' || !transport.canReconnect) {
    return;
  }
  const target = { id: lights.deviceId, name: lights.deviceName ?? 'MoonBoard' };
  useLights.setState({ status: 'connecting', device: target });
  const result = await open(target);
  // Not near the wall: say nothing.
  if (result !== 'open' && result !== 'stale') useLights.setState({ status: 'idle', device: null });
}

export async function disconnect() {
  turn += 1;
  endSearch();
  stopRetrying();
  if (useLights.getState().status === 'connected') await send(CLEAR);
  await transport.disconnect();
  useLights.setState({ status: 'idle', device: null, lit: null });
}

/** Forgets the board as well, so it is not reconnected next time. */
export async function forget() {
  await disconnect();
  useClimb.getState().setLights({ deviceId: undefined, deviceName: undefined });
}

async function put(message: string, lit: string | null): Promise<boolean> {
  if (useLights.getState().status !== 'connected') return false;
  const ok = await send(message);
  if (ok) useLights.setState({ lit });
  return ok;
}

/** Puts a problem on the wall. `key` names it, usually the problem id. */
export function light(holds: ProblemHolds, key: string): Promise<boolean> {
  return put(encodeProblem(holds, encodeOptions()), key);
}

export function lightsOff(): Promise<boolean> {
  return put(CLEAR, null);
}

export function lightCorners(): Promise<boolean> {
  return put(encodeCorners(encodeOptions()), 'corners');
}
