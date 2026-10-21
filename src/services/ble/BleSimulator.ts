import { BleConnectionState, DiscoveredPeer, BlePacket } from '../../types/ble';
import {
  BleManagerInterface,
  DiscoveryCallback,
  PacketCallback,
  StateChangeCallback,
} from './BleManagerInterface';

export class SimulatedBleRadioHub {
  private static instance: SimulatedBleRadioHub;
  private nodes: Map<string, BleSimulator> = new Map();

  static getInstance(): SimulatedBleRadioHub {
    if (!SimulatedBleRadioHub.instance) {
      SimulatedBleRadioHub.instance = new SimulatedBleRadioHub();
    }
    return SimulatedBleRadioHub.instance;
  }

  register(node: BleSimulator) {
    this.nodes.set(node.getLocalPeerId(), node);
  }

  unregister(nodeId: string) {
    this.nodes.delete(nodeId);
  }

  broadcastAdvertisement(advertiser: BleSimulator) {
    const advPeer: DiscoveredPeer = {
      id: advertiser.getLocalPeerId(),
      name: advertiser.getLocalName(),
      rssi: -55 - Math.floor(Math.random() * 20),
      serviceUUIDs: ['0000FE2C-0000-1000-8000-00805F9B34FB'],
      publicKey: advertiser.getLocalPublicKey(),
      isConnectable: true,
      lastSeen: Date.now(),
    };

    for (const [id, node] of this.nodes.entries()) {
      if (id !== advertiser.getLocalPeerId() && node.isScanningActive()) {
        node.notifyDiscovered(advPeer);
      }
    }
  }

  transmitPacket(fromId: string, toId: string, packet: BlePacket): boolean {
    const target = this.nodes.get(toId);
    if (!target) return false;
    // Check if connected or within simulated RF range
    target.receiveInboundPacket(fromId, packet);
    return true;
  }
}

export class BleSimulator implements BleManagerInterface {
  private localPeerId: string;
  private localName: string = 'NearLink-Device';
  private localPublicKey: string = '';
  private isScanning: boolean = false;
  private isAdvertising: boolean = false;
  private connectedPeers: Set<string> = new Set();
  private packetListeners: PacketCallback[] = [];
  private discoveryListeners: DiscoveryCallback[] = [];
  private stateListeners: StateChangeCallback[] = [];

  constructor(peerId?: string) {
    this.localPeerId = peerId || 'node-' + Math.random().toString(36).substring(2, 9);
    SimulatedBleRadioHub.getInstance().register(this);
  }

  getLocalPeerId(): string {
    return this.localPeerId;
  }

  setLocalPeerId(id: string) {
    SimulatedBleRadioHub.getInstance().unregister(this.localPeerId);
    this.localPeerId = id;
    SimulatedBleRadioHub.getInstance().register(this);
  }

  getLocalName(): string {
    return this.localName;
  }

  getLocalPublicKey(): string {
    return this.localPublicKey;
  }

  isScanningActive(): boolean {
    return this.isScanning;
  }

  async initialize(): Promise<boolean> {
    return true;
  }

  async isBluetoothEnabled(): Promise<boolean> {
    return true;
  }

  async startScanning(onDiscover: DiscoveryCallback): Promise<void> {
    this.isScanning = true;
    this.discoveryListeners = [onDiscover];
    this.notifyState('scanning');

    // Trigger immediate discovery round of all other active nodes
    const hub = SimulatedBleRadioHub.getInstance();
    // Also generate mock nearby nodes if isolated in demo mode
    this.generateDemoPeersIfEmpty();
  }

  private generateDemoPeersIfEmpty() {
    const mockNearby = [
      { id: 'peer-alice', name: 'Alice (Direct BLE)', rssi: -52, pub: 'AlicePubKeyFakeX25519Base64==' },
      { id: 'peer-bob', name: 'Bob (Relay Node)', rssi: -68, pub: 'BobPubKeyFakeX25519Base64==' },
      { id: 'peer-charlie', name: 'Charlie (2 hops)', rssi: -82, pub: 'CharliePubKeyFakeX25519Base64==' }
    ];

    setTimeout(() => {
      if (this.isScanning) {
        for (const p of mockNearby) {
          if (p.id !== this.localPeerId) {
            this.notifyDiscovered({
              id: p.id,
              name: p.name,
              rssi: p.rssi,
              serviceUUIDs: ['0000FE2C-0000-1000-8000-00805F9B34FB'],
              publicKey: p.pub,
              isConnectable: true,
              lastSeen: Date.now(),
            });
          }
        }
      }
    }, 500);
  }

  async stopScanning(): Promise<void> {
    this.isScanning = false;
    this.notifyState('idle');
  }

  async startAdvertising(localPeerName: string, localPublicKey: string): Promise<void> {
    this.localName = localPeerName;
    this.localPublicKey = localPublicKey;
    this.isAdvertising = true;
    SimulatedBleRadioHub.getInstance().broadcastAdvertisement(this);
  }

  async stopAdvertising(): Promise<void> {
    this.isAdvertising = false;
  }

  async connect(peerId: string): Promise<boolean> {
    this.notifyState('connecting', peerId);
    this.connectedPeers.add(peerId);
    this.notifyState('connected', peerId);
    return true;
  }

  async disconnect(peerId: string): Promise<void> {
    this.connectedPeers.delete(peerId);
    this.notifyState('disconnected', peerId);
  }

  async sendPacket(peerId: string, packet: BlePacket): Promise<boolean> {
    return SimulatedBleRadioHub.getInstance().transmitPacket(this.localPeerId, peerId, packet);
  }

  onPacketReceived(callback: PacketCallback): void {
    this.packetListeners.push(callback);
  }

  onStateChanged(callback: StateChangeCallback): void {
    this.stateListeners.push(callback);
  }

  getConnectedPeers(): string[] {
    return Array.from(this.connectedPeers);
  }

  notifyDiscovered(peer: DiscoveredPeer) {
    for (const listener of this.discoveryListeners) {
      listener(peer);
    }
  }

  receiveInboundPacket(fromPeerId: string, packet: BlePacket) {
    for (const listener of this.packetListeners) {
      listener(fromPeerId, packet);
    }
  }

  private notifyState(state: BleConnectionState, peerId?: string) {
    for (const listener of this.stateListeners) {
      listener(state, peerId);
    }
  }
}
