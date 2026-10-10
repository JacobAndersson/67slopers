"""A stand-in for the MoonBoard LED box on the Android emulator's virtual Bluetooth.

    pip install bumble grpcio protobuf      # in a virtualenv; development only
    python scripts/fake-moonboard.py board.log

Advertises as "MoonBoard A" with the Nordic UART service and appends everything the app does
to the log: CONNECTED, each WRITE as it arrives (so the 20-byte chunks are visible), and
DROPPED. Create a file called `drop` beside the log to make it hang up, which is how to see
the app's "Lights dropped" banner and its reconnect. The emulator must be running with
Bluetooth switched on (`adb shell svc bluetooth enable`). It checks the app's side of the
protocol only: a real board is still needed for `docs/device-checklist.md`.
"""
import asyncio
import sys
import time

from bumble.core import AdvertisingData
from bumble.device import Device
from bumble.gatt import Characteristic, CharacteristicValue, Service
from bumble.hci import Address
from bumble.transport import open_transport

SERVICE = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E'
RX = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E'
TX = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'
LOG = sys.argv[1]


def note(text):
    with open(LOG, 'a') as f:
        f.write(f'{time.time():.3f} {text}\n')


async def main():
    async with await open_transport('android-netsim') as transport:
        device = Device.with_hci('MoonBoard A', Address('F0:F1:F2:F3:F4:F5'), transport.source, transport.sink)

        def on_write(connection, value):
            note('WRITE ' + bytes(value).decode('ascii', 'replace'))

        rx = Characteristic(
            RX,
            Characteristic.Properties.WRITE | Characteristic.Properties.WRITE_WITHOUT_RESPONSE,
            Characteristic.WRITEABLE,
            CharacteristicValue(write=on_write),
        )
        tx = Characteristic(TX, Characteristic.Properties.NOTIFY, Characteristic.READABLE, bytes())
        device.add_service(Service(SERVICE, [rx, tx]))
        device.advertising_data = bytes(AdvertisingData([
            (AdvertisingData.COMPLETE_LOCAL_NAME, b'MoonBoard A'),
            (AdvertisingData.FLAGS, bytes([0x06])),
        ]))
        links = []

        def on_connection(connection):
            links.append(connection)
            note('CONNECTED')

        device.on('connection', on_connection)
        device.on('disconnection', lambda *a: note('DISCONNECTED'))
        await device.power_on()
        await device.start_advertising(auto_restart=True)
        note('ADVERTISING')
        import os
        drop = os.path.join(os.path.dirname(LOG), 'drop')
        while True:
            await asyncio.sleep(0.5)
            if os.path.exists(drop):
                os.remove(drop)
                for link in links:
                    try:
                        await link.disconnect()
                    except Exception as error:
                        note(f'drop failed {error}')
                links.clear()
                note('DROPPED')


asyncio.run(main())
