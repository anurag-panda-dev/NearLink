import { DeduplicationCache } from '../src/services/mesh/DeduplicationCache';
import { MeshRouter, MAX_HOP_LIMIT } from '../src/services/mesh/MeshRouter';
import { MeshPacketEnvelope } from '../src/types/mesh';
import { generateUserIdentityKeys } from '../src/services/crypto/keys';

describe('BLE Mesh Routing Engine (AC-6)', () => {
  it('suppresses duplicate mesh packet IDs', () => {
    const cache = new DeduplicationCache(100, 5000);
    const packetId = 'packet-xyz';

    expect(cache.checkAndRecord(packetId)).toBe(false); // First time: not duplicate
    expect(cache.checkAndRecord(packetId)).toBe(true);  // Second time: duplicate!
    expect(cache.size()).toBe(1);
  });

  it('originates a valid mesh packet with TTL and Ed25519 signature', async () => {
    const router = MeshRouter.getInstance();
    const keys = generateUserIdentityKeys();

    router.configure('node-alpha', 'Alpha', keys.signing.secretKey, true);

    const envelope = await router.originateMeshPacket('node-omega', JSON.stringify({ msg: 'hello' }));

    expect(envelope.messageId).toBeDefined();
    expect(envelope.senderId).toBe('node-alpha');
    expect(envelope.destinationId).toBe('node-omega');
    expect(envelope.hopLimit).toBe(MAX_HOP_LIMIT);
    expect(envelope.hopCount).toBe(0);
    expect(envelope.path).toEqual(['node-alpha']);
    expect(envelope.signature).toBeDefined();
  });

  it('drops packets when local node is already in path (loop prevention)', async () => {
    const router = MeshRouter.getInstance();
    const keys = generateUserIdentityKeys();
    router.configure('node-alpha', 'Alpha', keys.signing.secretKey, true);

    const initialDiag = router.getDiagnostics();

    const loopingEnvelope: MeshPacketEnvelope = {
      messageId: 'loop-pkg-' + Date.now(),
      senderId: 'node-origin',
      senderName: 'Origin',
      destinationId: 'node-dest',
      sequenceNumber: Date.now(),
      hopLimit: 3,
      hopCount: 2,
      expiry: Date.now() + 60000,
      payload: 'payload',
      signature: 'sig',
      path: ['node-origin', 'node-alpha', 'node-beta'], // node-alpha already visited!
    };

    await router.handleInboundMeshEnvelope('node-beta', loopingEnvelope);

    const afterDiag = router.getDiagnostics();
    // Packet should have been received but NOT forwarded due to loop
    expect(afterDiag.totalPacketsReceived).toBe(initialDiag.totalPacketsReceived + 1);
    expect(afterDiag.totalPacketsForwarded).toBe(initialDiag.totalPacketsForwarded);
  });

  it('drops packets when hopLimit expires (TTL = 1)', async () => {
    const router = MeshRouter.getInstance();
    const initialDiag = router.getDiagnostics();

    const expiredTtlEnvelope: MeshPacketEnvelope = {
      messageId: 'ttl-pkg-' + Date.now(),
      senderId: 'node-origin',
      senderName: 'Origin',
      destinationId: 'node-other',
      sequenceNumber: Date.now(),
      hopLimit: 1, // Last hop
      hopCount: 4,
      expiry: Date.now() + 60000,
      payload: 'payload',
      signature: 'sig',
      path: ['node-origin'],
    };

    await router.handleInboundMeshEnvelope('node-origin', expiredTtlEnvelope);

    const afterDiag = router.getDiagnostics();
    expect(afterDiag.totalPacketsDroppedTtl).toBe(initialDiag.totalPacketsDroppedTtl + 1);
  });

  it('respects battery-aware relay policy when battery is low', async () => {
    const router = MeshRouter.getInstance();
    router.setBatteryLow(true);

    const initialDiag = router.getDiagnostics();

    const envelope: MeshPacketEnvelope = {
      messageId: 'battery-pkg-' + Date.now(),
      senderId: 'node-origin',
      senderName: 'Origin',
      destinationId: 'node-remote',
      sequenceNumber: Date.now(),
      hopLimit: 4,
      hopCount: 1,
      expiry: Date.now() + 60000,
      payload: 'payload',
      signature: 'sig',
      path: ['node-origin'],
    };

    await router.handleInboundMeshEnvelope('node-origin', envelope);

    const afterDiag = router.getDiagnostics();
    // Should NOT forward because battery is low
    expect(afterDiag.totalPacketsForwarded).toBe(initialDiag.totalPacketsForwarded);

    // Reset battery low
    router.setBatteryLow(false);
  });
});
