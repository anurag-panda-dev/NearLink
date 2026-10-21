import { create } from 'zustand';
import { ChatMessage, DeliveryStatus } from '../types/message';
import { LocalStorage } from '../services/storage/LocalStorage';
import { QueueManager } from '../services/message-queue/QueueManager';
import { BleService } from '../services/ble/BleService';
import { encryptForPeer, decryptFromPeer } from '../services/crypto/cipher';
import { MessageEnvelope, parseMessageEnvelope } from '../services/message-queue/Framing';
import { useIdentityStore } from './identityStore';

export interface ConversationSummary {
  peerId: string;
  peerName: string;
  lastMessageSnippet: string;
  lastMessageTime: number;
  unreadCount: number;
  deliveryStatus?: DeliveryStatus;
  isOnline: boolean;
}

interface ChatState {
  conversations: Map<string, ConversationSummary>;
  activeMessages: ChatMessage[];
  activeConversationId: string | null;

  setActiveConversation: (peerId: string) => Promise<void>;
  sendMessage: (peerId: string, peerName: string, text: string, replyToId?: string) => Promise<boolean>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  deleteConversation: (peerId: string) => Promise<void>;
  loadConversations: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => {
  const queue = QueueManager.getInstance();
  const ble = BleService.getInstance();
  const storage = LocalStorage.getInstance();

  // Listen to queue status changes (queued -> sending -> sent -> delivered)
  queue.onStatusChange((messageId, status) => {
    set((state) => {
      const updatedMessages = state.activeMessages.map((m) =>
        m.id === messageId ? { ...m, status } : m
      );
      return { activeMessages: updatedMessages };
    });
  });

  // Listen to inbound BLE messages
  ble.onPacket(async (fromPeerId, packet) => {
    if (packet.type === 'MESSAGE') {
      const envelope = parseMessageEnvelope(packet);
      if (!envelope || envelope.isGroup) return;

      // Duplicate prevention
      if (queue.hasBeenProcessed(envelope.id)) {
        return;
      }

      const keys = useIdentityStore.getState().keys;
      const profile = useIdentityStore.getState().profile;
      if (!keys || !profile) return;

      // Decrypt message payload
      const plaintext = decryptFromPeer(
        envelope.encrypted as any,
        keys.encryption.secretKey
      );

      if (plaintext) {
        // Send immediate Application ACK back to sender
        await queue.sendAck(profile.id, fromPeerId, envelope.id);

        const chatMsg: ChatMessage = {
          id: envelope.id,
          conversationId: fromPeerId,
          senderId: fromPeerId,
          senderName: envelope.senderName || 'Peer',
          content: plaintext,
          timestamp: envelope.timestamp,
          status: 'delivered',
          isOutgoing: false,
          replyToId: envelope.replyToId,
        };

        await storage.saveMessage(chatMsg);

        // Update state
        const { activeConversationId, activeMessages } = get();
        if (activeConversationId === fromPeerId) {
          set({ activeMessages: [...activeMessages, chatMsg] });
        }
        await get().loadConversations();
      }
    }
  });

  return {
    conversations: new Map(),
    activeMessages: [],
    activeConversationId: null,

    setActiveConversation: async (peerId: string) => {
      const msgs = await storage.getMessages(peerId);
      set({ activeConversationId: peerId, activeMessages: msgs });
      await get().loadConversations();
    },

    sendMessage: async (peerId: string, peerName: string, text: string, replyToId?: string) => {
      const identity = useIdentityStore.getState();
      if (!identity.profile || !identity.keys) return false;

      // Get peer public key
      let peerPublicKey = ble.getPeerPublicKey(peerId);
      if (!peerPublicKey) {
        // Check discovered peers
        const discovered = ble.getDiscoveredPeers().find((p) => p.id === peerId);
        peerPublicKey = discovered?.publicKey;
      }

      // If peer key not yet available, generate demo compatible public key so simulation always encrypts
      if (!peerPublicKey) {
        peerPublicKey = identity.keys.encryption.publicKey;
      }

      const encrypted = encryptForPeer(
        text,
        peerPublicKey,
        identity.keys.encryption.secretKey
      );

      const messageId = 'msg-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
      const timestamp = Date.now();

      const envelope: MessageEnvelope = {
        id: messageId,
        senderId: identity.profile.id,
        senderName: identity.profile.displayName,
        recipientId: peerId,
        isGroup: false,
        timestamp,
        encrypted,
        replyToId,
      };

      const chatMsg: ChatMessage = {
        id: messageId,
        conversationId: peerId,
        senderId: identity.profile.id,
        senderName: identity.profile.displayName,
        content: text,
        timestamp,
        status: 'queued',
        isOutgoing: true,
        replyToId,
      };

      // Save locally
      await storage.saveMessage(chatMsg);

      // Add to active view immediately
      const current = get().activeMessages;
      set({ activeMessages: [...current, chatMsg] });

      // Enqueue in offline retry queue
      await queue.enqueue(peerId, envelope);

      await get().loadConversations();
      return true;
    },

    addReaction: async (messageId: string, emoji: string) => {
      const profile = useIdentityStore.getState().profile;
      if (!profile) return;

      const msgs = get().activeMessages.map((m) => {
        if (m.id === messageId) {
          const reactions = { ...(m.reactions || {}), [emoji]: profile.id };
          return { ...m, reactions };
        }
        return m;
      });

      set({ activeMessages: msgs });
    },

    deleteConversation: async (peerId: string) => {
      await storage.deleteConversation(peerId);
      set((state) => {
        const copy = new Map(state.conversations);
        copy.delete(peerId);
        return {
          conversations: copy,
          activeMessages: state.activeConversationId === peerId ? [] : state.activeMessages,
          activeConversationId: state.activeConversationId === peerId ? null : state.activeConversationId,
        };
      });
    },

    loadConversations: async () => {
      const recent = await storage.getAllRecentMessages();
      const connected = ble.getManager().getConnectedPeers();
      const convMap = new Map<string, ConversationSummary>();

      for (const msg of recent) {
        // If not already added (since recent messages are sorted newest first)
        if (!convMap.has(msg.conversationId)) {
          const isPeerSender = !msg.isOutgoing;
          const peerName = isPeerSender ? msg.senderName : `Peer ${msg.conversationId.substring(0, 6)}`;
          convMap.set(msg.conversationId, {
            peerId: msg.conversationId,
            peerName,
            lastMessageSnippet: msg.content,
            lastMessageTime: msg.timestamp,
            unreadCount: 0,
            deliveryStatus: msg.isOutgoing ? msg.status : undefined,
            isOnline: connected.includes(msg.conversationId),
          });
        }
      }

      set({ conversations: convMap });
    },
  };
});
