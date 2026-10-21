export type DeliveryStatus =
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'failed';

export interface ChatMessage {
  id: string; // UUID v4 or random hex
  conversationId: string; // Peer ID or Group ID
  senderId: string;
  senderName: string;
  content: string; // Decrypted text
  timestamp: number;
  status: DeliveryStatus;
  isOutgoing: boolean;
  hopCount?: number;
  replyToId?: string;
  reactions?: Record<string, string>; // emoji -> senderId
}

export interface EncryptedPayload {
  nonce: string; // Base64
  ciphertext: string; // Base64
  senderPublicKey: string; // Base64
}

export interface AckPayload {
  messageId: string;
  originalSenderId: string;
  receiverId: string;
  timestamp: number;
}
