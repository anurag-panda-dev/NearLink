export interface MeshPacketEnvelope {
  messageId: string; // Unique deduplication ID
  senderId: string;
  senderName: string;
  destinationId: string; // Peer ID or Group ID, or '*' for broadcast
  groupId?: string; // If group message
  sequenceNumber: number;
  hopLimit: number; // TTL (Time-to-Live): decremented each hop
  hopCount: number; // Incremented each hop (starts at 0)
  expiry: number; // Unix timestamp after which packet is dropped
  payload: string; // Encrypted JSON string
  signature: string; // Ed25519 signature over (messageId + destinationId + payload + sequenceNumber)
  path: string[]; // Node IDs that forwarded this packet
}

export interface MeshRouteInfo {
  peerId: string;
  nextHopPeerId: string;
  hopCount: number;
  lastSeen: number;
  rssi?: number;
  reliabilityScore: number; // 0.0 - 1.0
}

export interface MeshDiagnostics {
  totalPacketsReceived: number;
  totalPacketsForwarded: number;
  totalPacketsDroppedDuplicates: number;
  totalPacketsDroppedTtl: number;
  activeNeighbors: number;
  knownRoutesCount: number;
  queueDepth: number;
  meshNodes: {
    id: string;
    name: string;
    hopDistance: number;
    direct: boolean;
    lastSeen: number;
  }[];
}
