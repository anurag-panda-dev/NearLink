import { BleManagerInterface } from './BleManagerInterface';
import { BleSimulator } from './BleSimulator';
import { BlePacket, DiscoveredPeer, BleConnectionState } from '../../types/ble';
import { UserProfile } from '../../types/identity';
import { signData, verifySignature } from '../crypto/keys';

export class BleService {
  private static instance: BleService;
  private manager: BleManagerInterface;
  private localProfile: UserProfile | null = null;
  private localSecretKey: string = '';
  private discoveredPeers: Map<string, DiscoveredPeer> = new Map();
  private peerPublicKeys: Map<string, string> = new Map();
  private packetHandlers: ((fromPeerId: string, packet: BlePacket) => void)[] = [];

  private constructor() {
    // Default to BleSimulator for deterministic testing & cross-platform execution
    this.manager = new BleSimulator();
    this.setupListeners();
  }

  static getInstance(): BleService {
    if (!BleService.instance) {
      BleService.instance = new BleService();
    }
    return BleService.instance;
  }

  setManager(customManager: BleManagerInterface) {
    this.manager = customManager;
    this.setupListeners();
  }

  getManager(): BleManagerInterface {
    return this.manager;
  }

  setIdentity(profile: UserProfile, signingSecretKey: string) {
    this.localProfile = profile;
    this.localSecretKey = signingSecretKey;
    if (this.manager instanceof BleSimulator) {
      this.manager.setLocalPeerId(profile.id);
    }
  }

  private setupListeners() {
    this.manager.onPacketReceived((peerId, packet) => {
      this.handleInboundPacket(peerId, packet);
    });
  }

  async startDiscovery(onPeerFound?: (peer: DiscoveredPeer) => void) {
    await this.manager.startScanning((peer) => {
      this.discoveredPeers.set(peer.id, peer);
      if (peer.publicKey) {
        this.peerPublicKeys.set(peer.id, peer.publicKey);
      }
      onPeerFound?.(peer);
    });

    if (this.localProfile?.isDiscoverable) {
      await this.manager.startAdvertising(
        this.localProfile.displayName,
        this.localProfile.publicKey
      );
    }
  }

  async stopDiscovery() {
    await this.manager.stopScanning();
    await this.manager.stopAdvertising();
  }

  async connectToPeer(peerId: string): Promise<boolean> {
    const success = await this.manager.connect(peerId);
    if (success && this.localProfile) {
      // Send Handshake packet
      const handshakePayload = JSON.stringify({
        displayName: this.localProfile.displayName,
        publicKey: this.localProfile.publicKey,
        signingPublicKey: this.localProfile.signingPublicKey,
        version: 1,
      });

      const signature = signData(handshakePayload, this.localSecretKey);

      const packet: BlePacket = {
        version: 1,
        type: 'HANDSHAKE',
        sourceId: this.localProfile.id,
        destinationId: peerId,
        payload: handshakePayload,
        signature,
        timestamp: Date.now(),
      };

      await this.manager.sendPacket(peerId, packet);
    }
    return success;
  }

  async sendRawPacket(peerId: string, packet: BlePacket): Promise<boolean> {
    return this.manager.sendPacket(peerId, packet);
  }

  onPacket(handler: (fromPeerId: string, packet: BlePacket) => void) {
    this.packetHandlers.push(handler);
  }

  getDiscoveredPeers(): DiscoveredPeer[] {
    return Array.from(this.discoveredPeers.values());
  }

  getPeerPublicKey(peerId: string): string | undefined {
    return this.peerPublicKeys.get(peerId);
  }

  private handleInboundPacket(fromPeerId: string, packet: BlePacket) {
    if (packet.type === 'HANDSHAKE') {
      try {
        const data = JSON.parse(packet.payload);
        // Verify signature if provided
        if (packet.signature && data.signingPublicKey) {
          const valid = verifySignature(packet.payload, packet.signature, data.signingPublicKey);
          if (!valid) {
            console.warn(`[BleService] Dropped handshake from ${fromPeerId}: invalid signature`);
            return;
          }
        }
        if (data.publicKey) {
          this.peerPublicKeys.set(fromPeerId, data.publicKey);
        }

        // Reply with HANDSHAKE_ACK
        if (this.localProfile) {
          const ackPayload = JSON.stringify({
            displayName: this.localProfile.displayName,
            publicKey: this.localProfile.publicKey,
            signingPublicKey: this.localProfile.signingPublicKey,
          });
          const ackPacket: BlePacket = {
            version: 1,
            type: 'HANDSHAKE_ACK',
            sourceId: this.localProfile.id,
            destinationId: fromPeerId,
            payload: ackPayload,
            timestamp: Date.now(),
          };
          this.manager.sendPacket(fromPeerId, ackPacket);
        }
      } catch (err) {
        console.error('[BleService] Handshake parse error:', err);
      }
    } else if (packet.type === 'HANDSHAKE_ACK') {
      try {
        const data = JSON.parse(packet.payload);
        if (data.publicKey) {
          this.peerPublicKeys.set(fromPeerId, data.publicKey);
        }
      } catch (err) {
        console.error('[BleService] Handshake ACK parse error:', err);
      }
    }

    // Forward to all application handlers (QueueManager, MeshRouter, ChatStore)
    for (const handler of this.packetHandlers) {
      handler(fromPeerId, packet);
    }
  }
}
