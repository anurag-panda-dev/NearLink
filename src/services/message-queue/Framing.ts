import { BlePacket } from '../../types/ble';
import { EncryptedPayload, AckPayload } from '../../types/message';

export const BLE_DEFAULT_MTU = 512;

export interface MessageEnvelope {
  id: string; // Message ID
  senderId: string;
  senderName: string;
  recipientId: string; // Peer ID or Group ID
  isGroup: boolean;
  groupId?: string;
  timestamp: number;
  encrypted: EncryptedPayload | { nonce: string; ciphertext: string };
  replyToId?: string;
}

export function frameMessagePacket(envelope: MessageEnvelope): BlePacket {
  return {
    version: 1,
    type: 'MESSAGE',
    sourceId: envelope.senderId,
    destinationId: envelope.recipientId,
    payload: JSON.stringify(envelope),
    timestamp: envelope.timestamp,
  };
}

export function frameAckPacket(
  senderId: string,
  recipientId: string,
  messageId: string
): BlePacket {
  const ack: AckPayload = {
    messageId,
    originalSenderId: recipientId,
    receiverId: senderId,
    timestamp: Date.now(),
  };

  return {
    version: 1,
    type: 'MSG_ACK',
    sourceId: senderId,
    destinationId: recipientId,
    payload: JSON.stringify(ack),
    timestamp: Date.now(),
  };
}

export function parseMessageEnvelope(packet: BlePacket): MessageEnvelope | null {
  try {
    return JSON.parse(packet.payload) as MessageEnvelope;
  } catch {
    return null;
  }
}

export function parseAckPayload(packet: BlePacket): AckPayload | null {
  try {
    return JSON.parse(packet.payload) as AckPayload;
  } catch {
    return null;
  }
}
