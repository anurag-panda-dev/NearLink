import { UserProfile, UserIdentityKeys, PeerContact } from '../../types/identity';
import { ChatMessage } from '../../types/message';
import { OfflineGroup } from '../../types/group';

export interface StorageInterface {
  // Profile & Keys
  saveProfile(profile: UserProfile): Promise<void>;
  getProfile(): Promise<UserProfile | null>;
  saveKeys(keys: UserIdentityKeys): Promise<void>;
  getKeys(): Promise<UserIdentityKeys | null>;

  // Messages
  saveMessage(message: ChatMessage): Promise<void>;
  updateMessageStatus(messageId: string, status: ChatMessage['status']): Promise<void>;
  getMessages(conversationId: string): Promise<ChatMessage[]>;
  getAllRecentMessages(): Promise<ChatMessage[]>;
  deleteConversation(conversationId: string): Promise<void>;

  // Contacts
  saveContact(contact: PeerContact): Promise<void>;
  getContacts(): Promise<PeerContact[]>;
  getContact(id: string): Promise<PeerContact | null>;

  // Groups
  saveGroup(group: OfflineGroup): Promise<void>;
  getGroups(): Promise<OfflineGroup[]>;
  getGroup(id: string): Promise<OfflineGroup | null>;
  deleteGroup(groupId: string): Promise<void>;

  // Offline queue
  saveQueuedPacket(packetId: string, packetData: any): Promise<void>;
  getQueuedPackets(): Promise<any[]>;
  removeQueuedPacket(packetId: string): Promise<void>;

  // Clear all
  clearAllData(): Promise<void>;
}
