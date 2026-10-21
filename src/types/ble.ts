export type BleConnectionState =
  | 'idle'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'disconnected'
  | 'failed';

export interface DiscoveredPeer {
  id: string; // BLE Peripheral UUID or Mac
  name: string;
  rssi: number;
  serviceUUIDs: string[];
  publicKey?: string;
  fingerprint?: string;
  isConnectable: boolean;
  lastSeen: number;
}

export interface BlePacket {
  version: number;
  type: 'HANDSHAKE' | 'HANDSHAKE_ACK' | 'MESSAGE' | 'MSG_ACK' | 'MESH_FORWARD' | 'PING';
  sourceId: string;
  destinationId: string;
  payload: string; // Base64 or JSON encoded
  signature?: string;
  timestamp: number;
}
