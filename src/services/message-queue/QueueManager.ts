import { BleService } from '../ble/BleService';
import { LocalStorage } from '../storage/LocalStorage';
import { MessageEnvelope, frameMessagePacket, frameAckPacket, parseAckPayload } from './Framing';
import { ChatMessage, DeliveryStatus } from '../../types/message';

export interface QueuedItem {
  messageId: string;
  peerId: string;
  envelope: MessageEnvelope;
  attempts: number;
  lastAttemptTime: number;
  status: DeliveryStatus;
}

export class QueueManager {
  private static instance: QueueManager;
  private queue: Map<string, QueuedItem> = new Map(); // messageId -> QueuedItem
  private processedMessageIds: Set<string> = new Set();
  private ackListeners: ((messageId: string, status: DeliveryStatus) => void)[] = [];
  private retryInterval: any = null;

  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  private constructor() {
    this.setupAckListener();
    this.startRetryLoop();
  }

  private setupAckListener() {
    BleService.getInstance().onPacket((fromPeerId, packet) => {
      if (packet.type === 'MSG_ACK') {
        const ack = parseAckPayload(packet);
        if (ack) {
          this.handleDeliveryAck(ack.messageId);
        }
      }
    });
  }

  /**
   * Enqueue a message envelope for reliable transmission
   */
  async enqueue(peerId: string, envelope: MessageEnvelope): Promise<void> {
    const item: QueuedItem = {
      messageId: envelope.id,
      peerId,
      envelope,
      attempts: 0,
      lastAttemptTime: 0,
      status: 'queued',
    };

    this.queue.set(envelope.id, item);
    await LocalStorage.getInstance().saveQueuedPacket(envelope.id, item);

    // Attempt immediate transmission
    await this.attemptSend(envelope.id);
  }

  /**
   * Try sending a specific queued item
   */
  async attemptSend(messageId: string): Promise<boolean> {
    const item = this.queue.get(messageId);
    if (!item) return false;

    item.attempts += 1;
    item.lastAttemptTime = Date.now();
    item.status = 'sending';
    await LocalStorage.getInstance().updateMessageStatus(messageId, 'sending');

    const packet = frameMessagePacket(item.envelope);
    const sent = await BleService.getInstance().sendRawPacket(item.peerId, packet);

    if (sent) {
      item.status = 'sent';
      await LocalStorage.getInstance().updateMessageStatus(messageId, 'sent');
      this.notifyStatus(messageId, 'sent');
      return true;
    } else {
      if (item.attempts >= 5) {
        item.status = 'failed';
        await LocalStorage.getInstance().updateMessageStatus(messageId, 'failed');
        this.notifyStatus(messageId, 'failed');
      } else {
        item.status = 'queued';
        await LocalStorage.getInstance().updateMessageStatus(messageId, 'queued');
      }
      return false;
    }
  }

  /**
   * Called when application-level delivery ACK is received from recipient
   */
  async handleDeliveryAck(messageId: string) {
    const item = this.queue.get(messageId);
    if (item) {
      item.status = 'delivered';
      this.queue.delete(messageId);
      await LocalStorage.getInstance().removeQueuedPacket(messageId);
    }
    await LocalStorage.getInstance().updateMessageStatus(messageId, 'delivered');
    this.notifyStatus(messageId, 'delivered');
  }

  /**
   * Mark message as processed to prevent duplicates
   */
  hasBeenProcessed(messageId: string): boolean {
    if (this.processedMessageIds.has(messageId)) {
      return true;
    }
    this.processedMessageIds.add(messageId);
    return false;
  }

  /**
   * Send an ACK back to peer
   */
  async sendAck(localPeerId: string, peerId: string, messageId: string) {
    const ackPacket = frameAckPacket(localPeerId, peerId, messageId);
    await BleService.getInstance().sendRawPacket(peerId, ackPacket);
  }

  /**
   * Periodic retry loop for unacknowledged / queued messages
   */
  private startRetryLoop() {
    if (this.retryInterval) return;
    this.retryInterval = setInterval(async () => {
      const now = Date.now();
      for (const [id, item] of this.queue.entries()) {
        // Retry items if queued or sent without ACK for more than 4000ms
        if (item.status !== 'delivered' && item.status !== 'failed') {
          if (now - item.lastAttemptTime > 4000) {
            await this.attemptSend(id);
          }
        }
      }
    }, 3000);
    if (this.retryInterval && typeof this.retryInterval.unref === 'function') {
      this.retryInterval.unref();
    }
  }

  stopRetryLoop() {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
  }

  /**
   * Flush queue for a peer when they come back online
   */
  async flushQueueForPeer(peerId: string) {
    for (const [id, item] of this.queue.entries()) {
      if (item.peerId === peerId && item.status !== 'delivered') {
        await this.attemptSend(id);
      }
    }
  }

  onStatusChange(listener: (messageId: string, status: DeliveryStatus) => void) {
    this.ackListeners.push(listener);
  }

  private notifyStatus(messageId: string, status: DeliveryStatus) {
    for (const listener of this.ackListeners) {
      listener(messageId, status);
    }
  }

  getQueue(): QueuedItem[] {
    return Array.from(this.queue.values());
  }
}
