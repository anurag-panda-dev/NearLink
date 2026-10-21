import {
  frameMessagePacket,
  parseMessageEnvelope,
  frameAckPacket,
  parseAckPayload,
  MessageEnvelope,
} from '../src/services/message-queue/Framing';
import { QueueManager } from '../src/services/message-queue/QueueManager';

describe('Message Queue & Framing (AC-4)', () => {
  it('correctly frames and parses message envelopes', () => {
    const envelope: MessageEnvelope = {
      id: 'msg-999',
      senderId: 'alice-id',
      senderName: 'Alice',
      recipientId: 'bob-id',
      isGroup: false,
      timestamp: 1600000000000,
      encrypted: {
        nonce: 'nonce123',
        ciphertext: 'cipher456',
        senderPublicKey: 'key789',
      },
    };

    const packet = frameMessagePacket(envelope);
    expect(packet.type).toBe('MESSAGE');
    expect(packet.sourceId).toBe('alice-id');

    const parsed = parseMessageEnvelope(packet);
    expect(parsed).toEqual(envelope);
  });

  it('correctly frames and parses application delivery ACKs', () => {
    const ackPacket = frameAckPacket('bob-id', 'alice-id', 'msg-999');
    expect(ackPacket.type).toBe('MSG_ACK');

    const ackPayload = parseAckPayload(ackPacket);
    expect(ackPayload).not.toBeNull();
    expect(ackPayload!.messageId).toBe('msg-999');
    expect(ackPayload!.receiverId).toBe('bob-id');
    expect(ackPayload!.originalSenderId).toBe('alice-id');
  });

  it('detects and suppresses duplicate message IDs', () => {
    const queue = QueueManager.getInstance();
    const messageId = 'dup-test-' + Date.now();

    const firstCheck = queue.hasBeenProcessed(messageId);
    expect(firstCheck).toBe(false);

    const secondCheck = queue.hasBeenProcessed(messageId);
    expect(secondCheck).toBe(true);
  });

  it('handles delivery ACK and updates status', async () => {
    const queue = QueueManager.getInstance();
    const msgId = 'test-ack-' + Date.now();

    let observedStatus: string = '';
    queue.onStatusChange((id, status) => {
      if (id === msgId) {
        observedStatus = status;
      }
    });

    await queue.handleDeliveryAck(msgId);
    expect(observedStatus).toBe('delivered');
  });

  afterAll(() => {
    QueueManager.getInstance().stopRetryLoop();
  });
});
