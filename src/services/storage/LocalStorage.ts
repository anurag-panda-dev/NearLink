import { StorageInterface } from './StorageInterface';
import { UserProfile, UserIdentityKeys, PeerContact } from '../../types/identity';
import { ChatMessage, DeliveryStatus } from '../../types/message';
import { OfflineGroup } from '../../types/group';

export class LocalStorage implements StorageInterface {
  private static instance: LocalStorage;
  private profile: UserProfile | null = null;
  private keys: UserIdentityKeys | null = null;
  private messages: Map<string, ChatMessage> = new Map(); // id -> ChatMessage
  private contacts: Map<string, PeerContact> = new Map();
  private groups: Map<string, OfflineGroup> = new Map();
  private queue: Map<string, any> = new Map();

  static getInstance(): LocalStorage {
    if (!LocalStorage.instance) {
      LocalStorage.instance = new LocalStorage();
    }
    return LocalStorage.instance;
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    this.profile = { ...profile };
  }

  async getProfile(): Promise<UserProfile | null> {
    return this.profile ? { ...this.profile } : null;
  }

  async saveKeys(keys: UserIdentityKeys): Promise<void> {
    this.keys = { ...keys };
  }

  async getKeys(): Promise<UserIdentityKeys | null> {
    return this.keys ? { ...this.keys } : null;
  }

  async saveMessage(message: ChatMessage): Promise<void> {
    this.messages.set(message.id, { ...message });
  }

  async updateMessageStatus(messageId: string, status: DeliveryStatus): Promise<void> {
    const msg = this.messages.get(messageId);
    if (msg) {
      msg.status = status;
      this.messages.set(messageId, msg);
    }
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const list: ChatMessage[] = [];
    for (const msg of this.messages.values()) {
      if (msg.conversationId === conversationId) {
        list.push({ ...msg });
      }
    }
    return list.sort((a, b) => a.timestamp - b.timestamp);
  }

  async getAllRecentMessages(): Promise<ChatMessage[]> {
    return Array.from(this.messages.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  async deleteConversation(conversationId: string): Promise<void> {
    for (const [id, msg] of this.messages.entries()) {
      if (msg.conversationId === conversationId) {
        this.messages.delete(id);
      }
    }
  }

  async saveContact(contact: PeerContact): Promise<void> {
    this.contacts.set(contact.id, { ...contact });
  }

  async getContacts(): Promise<PeerContact[]> {
    return Array.from(this.contacts.values());
  }

  async getContact(id: string): Promise<PeerContact | null> {
    const c = this.contacts.get(id);
    return c ? { ...c } : null;
  }

  async saveGroup(group: OfflineGroup): Promise<void> {
    this.groups.set(group.id, { ...group });
  }

  async getGroups(): Promise<OfflineGroup[]> {
    return Array.from(this.groups.values());
  }

  async getGroup(id: string): Promise<OfflineGroup | null> {
    const g = this.groups.get(id);
    return g ? { ...g } : null;
  }

  async deleteGroup(groupId: string): Promise<void> {
    this.groups.delete(groupId);
    await this.deleteConversation(groupId);
  }

  async saveQueuedPacket(packetId: string, packetData: any): Promise<void> {
    this.queue.set(packetId, packetData);
  }

  async getQueuedPackets(): Promise<any[]> {
    return Array.from(this.queue.values());
  }

  async removeQueuedPacket(packetId: string): Promise<void> {
    this.queue.delete(packetId);
  }

  async clearAllData(): Promise<void> {
    this.profile = null;
    this.keys = null;
    this.messages.clear();
    this.contacts.clear();
    this.groups.clear();
    this.queue.clear();
  }
}
