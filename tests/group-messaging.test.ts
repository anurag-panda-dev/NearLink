import { GroupManager } from '../src/services/group/GroupManager';
import { GroupMember } from '../src/types/group';

describe('Decentralized Group Messaging (AC-5)', () => {
  it('creates an offline group with owner and 256-bit symmetric key', async () => {
    const manager = GroupManager.getInstance();
    manager.configure('user-alice', 'Alice');

    const group = await manager.createGroup('Camp Mesh', 'Offline outdoor coordination');

    expect(group.id).toBeDefined();
    expect(group.name).toBe('Camp Mesh');
    expect(group.creatorId).toBe('user-alice');
    expect(group.epoch).toBe(1);
    expect(group.groupKey).toBeDefined();
    expect(group.members.length).toBe(1);
    expect(group.members[0].role).toBe('owner');
  });

  it('adds members to the group roster', async () => {
    const manager = GroupManager.getInstance();
    const group = await manager.createGroup('Rescue Squad');

    const bob: GroupMember = {
      id: 'user-bob',
      displayName: 'Bob',
      avatarSeed: 'bob1',
      role: 'member',
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      publicKey: 'BobPub',
    };

    const updated = await manager.addMember(group.id, bob);
    expect(updated).not.toBeNull();
    expect(updated!.members.length).toBe(2);
    expect(updated!.members.some((m) => m.id === 'user-bob')).toBe(true);
  });

  it('sends an encrypted group message and updates conversation history', async () => {
    const manager = GroupManager.getInstance();
    manager.configure('user-alice', 'Alice');
    const group = await manager.createGroup('Ops Team');

    const chatMsg = await manager.sendGroupMessage(group.id, 'Squad rendezvous at sector 4');
    expect(chatMsg).not.toBeNull();
    expect(chatMsg!.conversationId).toBe(group.id);
    expect(chatMsg!.content).toBe('Squad rendezvous at sector 4');
    expect(chatMsg!.senderId).toBe('user-alice');

    const savedGroup = manager.getGroup(group.id);
    expect(savedGroup?.lastMessageSnippet).toBe('Squad rendezvous at sector 4');
  });

  it('rotates group encryption key and increments epoch', async () => {
    const manager = GroupManager.getInstance();
    const group = await manager.createGroup('Secret Room');
    const oldKey = group.groupKey;
    const oldEpoch = group.epoch;

    const newKey = await manager.rotateKey(group.id);
    expect(newKey).not.toBeNull();
    expect(newKey).not.toEqual(oldKey);

    const updatedGroup = manager.getGroup(group.id);
    expect(updatedGroup?.epoch).toBe(oldEpoch + 1);
  });

  afterAll(() => {
    require('../src/services/message-queue/QueueManager').QueueManager.getInstance().stopRetryLoop();
  });
});
