import { PermissionsAndroid, Platform } from 'react-native';
import type { BleManager, Device } from 'react-native-ble-plx';

import { UART_SERVICE, UART_WRITE, isBoardName } from './protocol';
import type { LightsProblem, LightsTransport } from './transport';

let manager: BleManager | null = null;
let device: Device | null = null;
let withResponse = false;

/** Created on first use: nothing Bluetooth loads until the climber asks for the lights. */
function getManager(): BleManager | null {
  if (manager) return manager;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ble = require('react-native-ble-plx') as typeof import('react-native-ble-plx');
    manager = new ble.BleManager();
  } catch {
    manager = null; // Expo Go and other builds without the native module
  }
  return manager;
}

async function allowed(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const { PERMISSIONS, RESULTS } = PermissionsAndroid;
  const wanted =
    Number(Platform.Version) >= 31
      ? [PERMISSIONS.BLUETOOTH_SCAN, PERMISSIONS.BLUETOOTH_CONNECT]
      : [PERMISSIONS.ACCESS_FINE_LOCATION];
  const result = await PermissionsAndroid.requestMultiple(wanted);
  return wanted.every((permission) => result[permission] === RESULTS.GRANTED);
}

/** Waits for the adapter to say what state it is in; it starts as Unknown. */
async function problem(m: BleManager): Promise<LightsProblem | null> {
  if (!(await allowed())) return 'denied';
  let state = await m.state();
  for (let i = 0; i < 20 && (state === 'Unknown' || state === 'Resetting'); i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    state = await m.state();
  }
  if (state === 'PoweredOn') return null;
  if (state === 'PoweredOff') return 'off';
  if (state === 'Unauthorized') return 'denied';
  return 'unsupported';
}

export const transport: LightsTransport = {
  canReconnect: true,

  scan(onDevice, onProblem) {
    const m = getManager();
    if (!m) {
      onProblem('unsupported');
      return () => {};
    }
    let stopped = false;
    problem(m).then((p) => {
      if (stopped) return;
      if (p) return onProblem(p);
      m.startDeviceScan(null, { allowDuplicates: false }, (error, found) => {
        if (error) return onProblem('failed');
        const name = found?.name ?? found?.localName;
        if (found && isBoardName(name)) {
          onDevice({ id: found.id, name: name!, rssi: found.rssi ?? undefined });
        }
      });
    });
    return () => {
      stopped = true;
      m.stopDeviceScan();
    };
  },

  async connect(id, onLost) {
    const m = getManager();
    if (!m) throw new Error('unsupported');
    const p = await problem(m);
    if (p) throw new Error(p);
    m.stopDeviceScan();
    const connected = await m.connectToDevice(id, { timeout: 8000 });
    await connected.discoverAllServicesAndCharacteristics();
    const characteristics = await connected.characteristicsForService(UART_SERVICE);
    const rx = characteristics.find((c) => c.uuid.toLowerCase() === UART_WRITE);
    if (!rx) {
      await connected.cancelConnection().catch(() => {});
      throw new Error('failed');
    }
    withResponse = rx.isWritableWithResponse && !rx.isWritableWithoutResponse;
    device = connected;
    const subscription = connected.onDisconnected(() => {
      subscription.remove();
      if (device?.id === connected.id) {
        device = null;
        onLost();
      }
    });
  },

  async write(chunk) {
    if (!device) throw new Error('not connected');
    const data = btoa(chunk);
    if (withResponse)
      await device.writeCharacteristicWithResponseForService(UART_SERVICE, UART_WRITE, data);
    else await device.writeCharacteristicWithoutResponseForService(UART_SERVICE, UART_WRITE, data);
  },

  async disconnect() {
    const current = device;
    device = null; // cleared first, so the disconnect is not taken for a lost link
    await current?.cancelConnection().catch(() => {});
  },
};
