import {
  createIdentityQrString,
  createGroupInviteQrString,
  classifyQrString,
} from '../src/services/crypto/qr';
import { UserProfile } from '../src/types/identity';
import { OfflineGroup } from '../src/types/group';

const aliceProfile: UserProfile = {
  id: 'A1:B2:C3:D4:E5:F6:07:08',
  displayName: 'Alice',
  avatarSeed: 'seed1',
  publicKey: 'pubKey123==',
  signingPublicKey: 'signKey123==',
  createdAt: 1000,
  isDiscoverable: true,
  relayOptIn: true,
};

const opsGroup: OfflineGroup = {
  id: 'group-ops7x9',
  name: 'Field Ops',
  iconSeed: 'FI',
  creatorId: 'A1:B2:C3:D4:E5:F6:07:08',
  createdAt: 1000,
  members: [],
  groupKey: 'groupKey123==',
  epoch: 2,
  unreadCount: 0,
};

describe('classifyQrString (in-app scanner dispatch)', () => {
  it('classifies a valid identity QR and keeps its payload', () => {
    const result = classifyQrString(createIdentityQrString(aliceProfile));

    expect(result.kind).toEqual('identity');
    if (result.kind !== 'identity') return;
    expect(result.payload.id).toEqual(aliceProfile.id);
    expect(result.payload.name).toEqual('Alice');
    expect(result.payload.publicKey).toEqual(aliceProfile.publicKey);
    expect(result.payload.signingPublicKey).toEqual(aliceProfile.signingPublicKey);
  });

  it('classifies a valid group invite QR and keeps its payload', () => {
    const result = classifyQrString(createGroupInviteQrString(opsGroup));

    expect(result.kind).toEqual('group_invite');
    if (result.kind !== 'group_invite') return;
    expect(result.payload.groupId).toEqual(opsGroup.id);
    expect(result.payload.groupName).toEqual('Field Ops');
    expect(result.payload.groupKey).toEqual(opsGroup.groupKey);
    expect(result.payload.epoch).toEqual(2);
  });

  it('survives surrounding whitespace from manual entry', () => {
    const result = classifyQrString(`  \n ${createIdentityQrString(aliceProfile)} \n `);
    expect(result.kind).toEqual('identity');
  });

  it('falls back to a display name when the QR omits one', () => {
    const payload = { type: 'IDENTITY', id: 'peer-9', publicKey: 'pk==', signingPublicKey: 'sk==' };
    const result = classifyQrString(`nearlink://identity?data=${encodeURIComponent(JSON.stringify(payload))}`);

    expect(result.kind).toEqual('identity');
    if (result.kind !== 'identity') return;
    expect(result.payload.name).toEqual('Unknown Peer');
  });

  it('rejects an identity QR without a public key as invalid', () => {
    const payload = { type: 'IDENTITY', id: 'peer-9', name: 'No Key' };
    const result = classifyQrString(`nearlink://identity?data=${encodeURIComponent(JSON.stringify(payload))}`);

    expect(result.kind).toEqual('invalid');
  });

  it('defaults group epoch and tolerates a missing creator', () => {
    const payload = { type: 'GROUP_INVITE', groupId: 'g-1', groupName: 'Ops', groupKey: 'k==' };
    const result = classifyQrString(`nearlink://group?data=${encodeURIComponent(JSON.stringify(payload))}`);

    expect(result.kind).toEqual('group_invite');
    if (result.kind !== 'group_invite') return;
    expect(result.payload.epoch).toEqual(1);
    expect(result.payload.creatorId).toEqual('');
  });

  it('rejects a group invite QR without a group key as invalid', () => {
    const payload = { type: 'GROUP_INVITE', groupId: 'g-1', groupName: 'Ops', epoch: 3 };
    const result = classifyQrString(`nearlink://group?data=${encodeURIComponent(JSON.stringify(payload))}`);

    expect(result.kind).toEqual('invalid');
  });

  it('flags corrupted nearlink payloads as invalid, not unknown', () => {
    expect(classifyQrString('nearlink://identity?data=%7Bnot-json').kind).toEqual('invalid');
    expect(classifyQrString('nearlink://identity').kind).toEqual('invalid');
    expect(classifyQrString('nearlink://mystery?data=x').kind).toEqual('invalid');
  });

  it('reports foreign QR codes as unknown and keeps the raw content', () => {
    const url = classifyQrString('https://example.com/ticket/42');
    expect(url.kind).toEqual('unknown');
    expect(url.raw).toEqual('https://example.com/ticket/42');

    expect(classifyQrString('HELLO WORLD').kind).toEqual('unknown');
  });

  it('handles empty input without throwing', () => {
    expect(classifyQrString('').kind).toEqual('unknown');
    expect(classifyQrString('   ').kind).toEqual('unknown');
  });
});
