import { UART_SERVICE, UART_WRITE } from './protocol';
import type { LightsTransport } from './transport';

// The slice of Web Bluetooth this file uses; the DOM typings do not ship it.
type WebCharacteristic = { writeValueWithoutResponse: (data: Uint8Array) => Promise<void> };
type WebDevice = {
  id: string;
  name?: string;
  gatt?: {
    connect: () => Promise<{
      getPrimaryService: (uuid: string) => Promise<{
        getCharacteristic: (uuid: string) => Promise<WebCharacteristic>;
      }>;
    }>;
    disconnect: () => void;
  };
  addEventListener: (type: 'gattserverdisconnected', listener: () => void) => void;
  removeEventListener: (type: 'gattserverdisconnected', listener: () => void) => void;
};
type WebBluetooth = {
  getAvailability?: () => Promise<boolean>;
  requestDevice: (options: object) => Promise<WebDevice>;
};

const bluetooth = (): WebBluetooth | undefined =>
  typeof navigator === 'undefined'
    ? undefined
    : (navigator as unknown as { bluetooth?: WebBluetooth }).bluetooth;

const picked = new Map<string, WebDevice>();
let device: WebDevice | null = null;
let characteristic: WebCharacteristic | null = null;
let lostListener: (() => void) | null = null;

/**
 * Web Bluetooth (Chromium only). The browser shows its own chooser instead of a list, so a
 * "scan" reports the one board the climber picked there.
 */
export const transport: LightsTransport = {
  canReconnect: false,

  scan(onDevice, onProblem) {
    const api = bluetooth();
    if (!api) {
      onProblem('unsupported');
      return () => {};
    }
    let stopped = false;
    (async () => {
      if (api.getAvailability && !(await api.getAvailability())) return onProblem('off');
      try {
        const found = await api.requestDevice({
          // Name prefixes are case-sensitive here; kits use either spelling.
          filters: [{ namePrefix: 'MoonBoard' }, { namePrefix: 'Moonboard' }],
          optionalServices: [UART_SERVICE],
        });
        picked.set(found.id, found);
        if (!stopped) onDevice({ id: found.id, name: found.name ?? 'MoonBoard' });
      } catch (error) {
        // Closing the chooser is not a fault; a blocked permission is.
        const name = (error as { name?: string }).name;
        if (!stopped) onProblem(name === 'NotFoundError' ? 'failed' : 'denied');
      }
    })();
    return () => {
      stopped = true;
    };
  },

  async connect(id, onLost) {
    const found = picked.get(id);
    if (!found?.gatt) throw new Error('failed');
    const server = await found.gatt.connect();
    const service = await server.getPrimaryService(UART_SERVICE);
    characteristic = await service.getCharacteristic(UART_WRITE);
    device = found;
    lostListener = () => {
      if (device !== found) return;
      device = null;
      characteristic = null;
      onLost();
    };
    found.addEventListener('gattserverdisconnected', lostListener);
  },

  async write(chunk) {
    if (!characteristic) throw new Error('not connected');
    await characteristic.writeValueWithoutResponse(new TextEncoder().encode(chunk));
  },

  async disconnect() {
    const current = device;
    if (current && lostListener)
      current.removeEventListener('gattserverdisconnected', lostListener);
    device = null;
    characteristic = null;
    current?.gatt?.disconnect();
  },
};
