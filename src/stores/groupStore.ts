import { create } from 'zustand';
import { OfflineGroup, GroupMember } from '../types/group';
import { ChatMessage } from '../types/message';
import { GroupManager } from '../services/group/GroupManager';
import { LocalStorage } from '../services/storage/LocalStorage';

interface GroupState {
  groups: OfflineGroup[];
  activeGroup: OfflineGroup | null;
  activeGroupMessages: ChatMessage[];

  loadGroups: () => Promise<void>;
  createGroup: (name: string, description?: string) => Promise<OfflineGroup>;
  setActiveGroup: (groupId: string) => Promise<void>;
  sendGroupMessage: (groupId: string, text: string) => Promise<ChatMessage | null>;
  addMemberToGroup: (groupId: string, member: GroupMember) => Promise<void>;
}

export const useGroupStore = create<GroupState>((set, get) => {
  const manager = GroupManager.getInstance();
  const storage = LocalStorage.getInstance();

  return {
    groups: [],
    activeGroup: null,
    activeGroupMessages: [],

    loadGroups: async () => {
      await manager.loadPersistedGroups();
      set({ groups: manager.getGroups() });
    },

    createGroup: async (name: string, description?: string) => {
      const group = await manager.createGroup(name, description);
      set({ groups: manager.getGroups() });
      return group;
    },

    setActiveGroup: async (groupId: string) => {
      const group = manager.getGroup(groupId);
      const messages = await storage.getMessages(groupId);
      set({ activeGroup: group || null, activeGroupMessages: messages });
    },

    sendGroupMessage: async (groupId: string, text: string) => {
      const msg = await manager.sendGroupMessage(groupId, text);
      if (msg) {
        const current = get().activeGroupMessages;
        set({
          activeGroupMessages: [...current, msg],
          groups: manager.getGroups(),
        });
      }
      return msg;
    },

    addMemberToGroup: async (groupId: string, member: GroupMember) => {
      await manager.addMember(groupId, member);
      set({
        groups: manager.getGroups(),
        activeGroup: manager.getGroup(groupId) || null,
      });
    },
  };
});
