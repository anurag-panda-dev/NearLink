import { OfflineGroup, GroupMember } from '../../types/group';
import { generateGroupKey, encryptGroupMessage, decryptGroupMessage } from '../crypto/cipher';
import { LocalStorage } from '../storage/LocalStorage';
import { MeshRouter } from '../mesh/MeshRouter';
import { ChatMessage } from '../../types/message';

export class GroupManager {
  private static instance: GroupManager;
  private groups: Map<string, OfflineGroup> = new Map();
  private localUserId: string = '';
  private localUserName: string = '';

  static getInstance(): GroupManager {
    if (!GroupManager.instance) {
      GroupManager.instance = new GroupManager();
    }
    return GroupManager.instance;
  }

  private constructor() {
    this.setupMeshListener();
  }

  configure(userId: string, userName: string) {
    this.localUserId = userId;
    this.localUserName = userName;
  }

  async loadPersistedGroups() {
    const list = await LocalStorage.getInstance().getGroups();
    for (const g of list) {
      this.groups.set(g.id, g);
    }
  }

  /**
   * Create a new decentralized offline group
   */
  async createGroup(name: string, description?: string): Promise<OfflineGroup> {
    const groupId = 'group-' + Math.random().toString(36).substring(2, 10);
    const groupKey = generateGroupKey();
    const now = Date.now();

    const creatorMember: GroupMember = {
      id: this.localUserId,
      displayName: this.localUserName,
      avatarSeed: this.localUserId.substring(0, 4),
      role: 'owner',
      joinedAt: now,
      lastSeen: now,
      publicKey: '',
    };

    const group: OfflineGroup = {
      id: groupId,
      name,
      description,
      iconSeed: name.substring(0, 2).toUpperCase(),
      creatorId: this.localUserId,
      createdAt: now,
      members: [creatorMember],
      groupKey,
      epoch: 1,
      unreadCount: 0,
    };

    this.groups.set(groupId, group);
    await LocalStorage.getInstance().saveGroup(group);
    return group;
  }

  /**
   * Add a member to a group
   */
  async addMember(groupId: string, member: GroupMember): Promise<OfflineGroup | null> {
    const group = this.groups.get(groupId);
    if (!group) return null;

    if (!group.members.some((m) => m.id === member.id)) {
      group.members.push(member);
      await LocalStorage.getInstance().saveGroup(group);
    }
    return group;
  }

  /**
   * Send an encrypted group message across mesh
   */
  async sendGroupMessage(groupId: string, text: string): Promise<ChatMessage | null> {
    const group = this.groups.get(groupId);
    if (!group) return null;

    const { nonce, ciphertext } = encryptGroupMessage(text, group.groupKey);
    const messageId = 'gmsg-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now();
    const timestamp = Date.now();

    const groupPayload = JSON.stringify({
      messageId,
      groupId,
      senderId: this.localUserId,
      senderName: this.localUserName,
      nonce,
      ciphertext,
      epoch: group.epoch,
      timestamp,
    });

    // Send through Mesh Router
    await MeshRouter.getInstance().originateMeshPacket('*', groupPayload, groupId);

    const chatMsg: ChatMessage = {
      id: messageId,
      conversationId: groupId,
      senderId: this.localUserId,
      senderName: this.localUserName,
      content: text,
      timestamp,
      status: 'sent',
      isOutgoing: true,
    };

    group.lastMessageSnippet = text;
    group.lastMessageTime = timestamp;
    await LocalStorage.getInstance().saveMessage(chatMsg);
    await LocalStorage.getInstance().saveGroup(group);

    return chatMsg;
  }

  private setupMeshListener() {
    MeshRouter.getInstance().onMeshPacket(async (envelope) => {
      if (envelope.groupId) {
        const group = this.groups.get(envelope.groupId);
        if (!group) return; // Not a member of this group, packet was already forwarded by router

        try {
          const payload = JSON.parse(envelope.payload);
          if (payload.senderId === this.localUserId) {
            return; // Ignore own echoes
          }

          const plaintext = decryptGroupMessage(
            payload.ciphertext,
            payload.nonce,
            group.groupKey
          );

          if (plaintext) {
            const chatMsg: ChatMessage = {
              id: payload.messageId || envelope.messageId,
              conversationId: group.id,
              senderId: payload.senderId,
              senderName: payload.senderName || envelope.senderName,
              content: plaintext,
              timestamp: payload.timestamp || envelope.sequenceNumber,
              status: 'delivered',
              isOutgoing: false,
              hopCount: envelope.hopCount,
            };

            group.lastMessageSnippet = plaintext;
            group.lastMessageTime = chatMsg.timestamp;
            group.unreadCount = (group.unreadCount || 0) + 1;

            await LocalStorage.getInstance().saveMessage(chatMsg);
            await LocalStorage.getInstance().saveGroup(group);
          }
        } catch (err) {
          console.error('[GroupManager] Failed to decrypt group message:', err);
        }
      }
    });
  }

  getGroups(): OfflineGroup[] {
    return Array.from(this.groups.values());
  }

  getGroup(id: string): OfflineGroup | undefined {
    return this.groups.get(id);
  }

  /**
   * Rotate group key when a member leaves
   */
  async rotateKey(groupId: string): Promise<string | null> {
    const group = this.groups.get(groupId);
    if (!group) return null;

    group.groupKey = generateGroupKey();
    group.epoch += 1;
    await LocalStorage.getInstance().saveGroup(group);
    return group.groupKey;
  }
}
