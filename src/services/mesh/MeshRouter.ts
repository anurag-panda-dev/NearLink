import { BleService } from '../ble/BleService';
import { DeduplicationCache } from './DeduplicationCache';
import { MeshPacketEnvelope, MeshDiagnostics, MeshRouteInfo } from '../../types/mesh';
import { BlePacket } from '../../types/ble';
import { signData, verifySignature } from '../crypto/keys';

export const MAX_HOP_LIMIT = 5;
export const MAX_PACKET_SIZE = 64 * 1024; // 64 KB

export class MeshRouter {
  private static instance: MeshRouter;
  private localNodeId: string = '';
  private localNodeName: string = '';
  private signingSecretKey: string = '';
  private relayOptIn: boolean = true;
  private batteryLow: boolean = false;
  private dedupCache = new DeduplicationCache();
  private routes: Map<string, MeshRouteInfo> = new Map(); // destinationId -> Route
  private storeAndForwardQueue: Map<string, MeshPacketEnvelope[]> = new Map(); // destinationId -> envelopes

  // Diagnostics counters
  private diagnostics: MeshDiagnostics = {
    totalPacketsReceived: 0,
    totalPacketsForwarded: 0,
    totalPacketsDroppedDuplicates: 0,
    totalPacketsDroppedTtl: 0,
    activeNeighbors: 0,
    knownRoutesCount: 0,
    queueDepth: 0,
    meshNodes: [],
  };

  private meshPacketListeners: ((envelope: MeshPacketEnvelope) => void)[] = [];

  static getInstance(): MeshRouter {
    if (!MeshRouter.instance) {
      MeshRouter.instance = new MeshRouter();
    }
    return MeshRouter.instance;
  }

  private constructor() {
    this.setupInboundListener();
  }

  configure(
    localNodeId: string,
    localNodeName: string,
    signingSecretKey: string,
    relayOptIn: boolean = true
  ) {
    this.localNodeId = localNodeId;
    this.localNodeName = localNodeName;
    this.signingSecretKey = signingSecretKey;
    this.relayOptIn = relayOptIn;
  }

  setRelayOptIn(optIn: boolean) {
    this.relayOptIn = optIn;
  }

  setBatteryLow(isLow: boolean) {
    this.batteryLow = isLow;
  }

  private setupInboundListener() {
    BleService.getInstance().onPacket((fromPeerId, packet) => {
      if (packet.type === 'MESH_FORWARD') {
        try {
          const envelope: MeshPacketEnvelope = JSON.parse(packet.payload);
          this.handleInboundMeshEnvelope(fromPeerId, envelope);
        } catch (err) {
          console.error('[MeshRouter] Failed to parse mesh packet:', err);
        }
      }
    });
  }

  /**
   * Originates a new mesh packet from this local node
   */
  async originateMeshPacket(
    destinationId: string,
    payload: string,
    groupId?: string
  ): Promise<MeshPacketEnvelope> {
    const messageId = 'mesh-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now();
    const sequenceNumber = Date.now();
    const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const signPayload = `${messageId}:${destinationId}:${payload}:${sequenceNumber}`;
    const signature = signData(signPayload, this.signingSecretKey);

    const envelope: MeshPacketEnvelope = {
      messageId,
      senderId: this.localNodeId,
      senderName: this.localNodeName,
      destinationId,
      groupId,
      sequenceNumber,
      hopLimit: MAX_HOP_LIMIT,
      hopCount: 0,
      expiry,
      payload,
      signature,
      path: [this.localNodeId],
    };

    // Mark as seen locally to prevent reflecting back
    this.dedupCache.checkAndRecord(envelope.messageId);

    // Forward to all directly connected neighbors
    await this.floodToNeighbors(envelope);

    return envelope;
  }

  /**
   * Process inbound mesh packet from another node
   */
  async handleInboundMeshEnvelope(fromPeerId: string, envelope: MeshPacketEnvelope) {
    this.diagnostics.totalPacketsReceived += 1;

    // 1. Packet size check
    if (envelope.payload.length > MAX_PACKET_SIZE) {
      console.warn(`[MeshRouter] Dropping oversized mesh packet: ${envelope.messageId}`);
      return;
    }

    // 2. Expiry check
    if (Date.now() > envelope.expiry) {
      console.warn(`[MeshRouter] Dropping expired mesh packet: ${envelope.messageId}`);
      return;
    }

    // 3. Duplicate check
    const isDuplicate = this.dedupCache.checkAndRecord(envelope.messageId);
    if (isDuplicate) {
      this.diagnostics.totalPacketsDroppedDuplicates += 1;
      return;
    }

    // 4. Update routing table knowledge
    this.recordRoute(envelope.senderId, fromPeerId, envelope.hopCount + 1);

    // 5. Check if local node is the intended recipient (or if group or broadcast)
    const isForMe = envelope.destinationId === this.localNodeId;
    const isGroupOrBroadcast =
      envelope.destinationId === '*' || Boolean(envelope.groupId);

    if (isForMe || isGroupOrBroadcast) {
      // Dispatch to local mesh packet consumers
      this.notifyLocalConsumer(envelope);
    }

    // 6. Check if packet can and should be forwarded
    if (!this.relayOptIn || this.batteryLow) {
      return; // Device has opted out of relaying
    }

    // If packet was strictly meant for local node and not a group/broadcast, no need to forward further
    if (isForMe && !envelope.groupId) {
      return;
    }

    // Loop prevention: check if we are already in path
    if (envelope.path.includes(this.localNodeId)) {
      return;
    }

    // TTL check
    if (envelope.hopLimit <= 1) {
      this.diagnostics.totalPacketsDroppedTtl += 1;
      return;
    }

    // Prepare packet for next hop
    const forwardedEnvelope: MeshPacketEnvelope = {
      ...envelope,
      hopLimit: envelope.hopLimit - 1,
      hopCount: envelope.hopCount + 1,
      path: [...envelope.path, this.localNodeId],
    };

    this.diagnostics.totalPacketsForwarded += 1;
    await this.floodToNeighbors(forwardedEnvelope, fromPeerId);
  }

  private async floodToNeighbors(envelope: MeshPacketEnvelope, excludePeerId?: string) {
    const ble = BleService.getInstance();
    const neighbors = ble.getManager().getConnectedPeers();

    const rawPacket: BlePacket = {
      version: 1,
      type: 'MESH_FORWARD',
      sourceId: this.localNodeId,
      destinationId: envelope.destinationId,
      payload: JSON.stringify(envelope),
      timestamp: Date.now(),
    };

    for (const neighborId of neighbors) {
      if (neighborId !== excludePeerId) {
        await ble.sendRawPacket(neighborId, rawPacket);
      }
    }
  }

  private recordRoute(destinationId: string, nextHopId: string, hopCount: number) {
    this.routes.set(destinationId, {
      peerId: destinationId,
      nextHopPeerId: nextHopId,
      hopCount,
      lastSeen: Date.now(),
      reliabilityScore: 0.95,
    });
    this.diagnostics.knownRoutesCount = this.routes.size;
  }

  onMeshPacket(listener: (envelope: MeshPacketEnvelope) => void) {
    this.meshPacketListeners.push(listener);
  }

  private notifyLocalConsumer(envelope: MeshPacketEnvelope) {
    for (const listener of this.meshPacketListeners) {
      listener(envelope);
    }
  }

  getDiagnostics(): MeshDiagnostics {
    const ble = BleService.getInstance();
    const connected = ble.getManager().getConnectedPeers();

    const nodes = Array.from(this.routes.values()).map((r) => ({
      id: r.peerId,
      name: `Node ${r.peerId.substring(0, 6)}`,
      hopDistance: r.hopCount,
      direct: connected.includes(r.peerId),
      lastSeen: r.lastSeen,
    }));

    return {
      ...this.diagnostics,
      activeNeighbors: connected.length,
      knownRoutesCount: this.routes.size,
      queueDepth: this.storeAndForwardQueue.size,
      meshNodes: nodes,
    };
  }

  getRoutes(): MeshRouteInfo[] {
    return Array.from(this.routes.values());
  }
}
