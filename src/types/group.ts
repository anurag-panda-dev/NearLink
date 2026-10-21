export interface GroupMember {
  id: string; // Peer ID
  displayName: string;
  avatarSeed: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: number;
  lastSeen: number;
  publicKey: string;
}

export interface OfflineGroup {
  id: string; // Group ID (UUID)
  name: string;
  description?: string;
  iconSeed: string;
  creatorId: string;
  createdAt: number;
  members: GroupMember[];
  groupKey: string; // Base64 symmetric 256-bit encryption key (shared among members)
  epoch: number; // Increment upon membership changes / key rotation
  lastMessageSnippet?: string;
  lastMessageTime?: number;
  unreadCount: number;
}
