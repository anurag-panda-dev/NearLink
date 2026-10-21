import { BleSimulator, SimulatedBleRadioHub } from '../src/services/ble/BleSimulator';
import { BlePacket } from '../src/types/ble';

describe('BLE Simulator & Radio Hub (AC-2)', () => {
  it('allows two simulated nodes to discover each other', async () => {
    const nodeA = new BleSimulator('node-alice');
    const nodeB = new BleSimulator('node-bob');

    let discoveredByA: any = null;
    await nodeA.startScanning((peer) => {
      discoveredByA = peer;
    });

    // Node B advertises
    await nodeB.startAdvertising('BobDevice', 'BobPublicKeyBase64==');

    expect(discoveredByA).not.toBeNull();
    expect(discoveredByA.id).toBe('node-bob');
    expect(discoveredByA.name).toBe('BobDevice');
    expect(discoveredByA.publicKey).toBe('BobPublicKeyBase64==');

    await nodeA.stopScanning();
    await nodeB.stopAdvertising();
  });

  it('establishes GATT connections and transmits packets', async () => {
    const nodeA = new BleSimulator('node-alice-2');
    const nodeB = new BleSimulator('node-bob-2');

    let receivedPacket: BlePacket | null = null;
    nodeB.onPacketReceived((fromPeer, packet) => {
      receivedPacket = packet;
    });

    const connected = await nodeA.connect('node-bob-2');
    expect(connected).toBe(true);
    expect(nodeA.getConnectedPeers()).toContain('node-bob-2');

    const testPacket: BlePacket = {
      version: 1,
      type: 'PING',
      sourceId: 'node-alice-2',
      destinationId: 'node-bob-2',
      payload: JSON.stringify({ ping: true }),
      timestamp: Date.now(),
    };

    const sent = await nodeA.sendPacket('node-bob-2', testPacket);
    expect(sent).toBe(true);
    expect(receivedPacket).not.toBeNull();
    expect(receivedPacket!.sourceId).toBe('node-alice-2');
    expect(receivedPacket!.type).toBe('PING');

    await nodeA.disconnect('node-bob-2');
    expect(nodeA.getConnectedPeers()).not.toContain('node-bob-2');
  });
});
