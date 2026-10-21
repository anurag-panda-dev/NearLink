import { BleConnectionState, DiscoveredPeer, BlePacket } from '../../types/ble';

export type PacketCallback = (peerId: string, packet: BlePacket) => void;
export type DiscoveryCallback = (peer: DiscoveredPeer) => void;
export type StateChangeCallback = (state: BleConnectionState, peerId?: string) => void;

export interface BleManagerInterface {
  initialize(): Promise<boolean>;
  startScanning(onDiscover: DiscoveryCallback): Promise<void>;
  stopScanning(): Promise<void>;
  startAdvertising(localPeerName: string, localPublicKey: string): Promise<void>;
  stopAdvertising(): Promise<void>;
  connect(peerId: string): Promise<boolean>;
  disconnect(peerId: string): Promise<void>;
  sendPacket(peerId: string, packet: BlePacket): Promise<boolean>;
  onPacketReceived(callback: PacketCallback): void;
  onStateChanged(callback: StateChangeCallback): void;
  getConnectedPeers(): string[];
  isBluetoothEnabled(): Promise<boolean>;
}
