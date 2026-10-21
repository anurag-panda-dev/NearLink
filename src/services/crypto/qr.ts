import { UserProfile } from '../../types/identity';
import { OfflineGroup } from '../../types/group';

export interface QrIdentityPayload {
  type: 'IDENTITY';
  id: string;
  name: string;
  publicKey: string;
  signingPublicKey: string;
  avatarSeed: string;
}

export interface QrGroupInvitePayload {
  type: 'GROUP_INVITE';
  groupId: string;
  groupName: string;
  groupKey: string;
  epoch: number;
  creatorId: string;
}

export type NearlinkQrPayload = QrIdentityPayload | QrGroupInvitePayload;

export function createIdentityQrString(profile: UserProfile): string {
  const payload: QrIdentityPayload = {
    type: 'IDENTITY',
    id: profile.id,
    name: profile.displayName,
    publicKey: profile.publicKey,
    signingPublicKey: profile.signingPublicKey,
    avatarSeed: profile.avatarSeed,
  };
  return `nearlink://identity?data=${encodeURIComponent(JSON.stringify(payload))}`;
}

export function createGroupInviteQrString(group: OfflineGroup): string {
  const payload: QrGroupInvitePayload = {
    type: 'GROUP_INVITE',
    groupId: group.id,
    groupName: group.name,
    groupKey: group.groupKey,
    epoch: group.epoch,
    creatorId: group.creatorId,
  };
  return `nearlink://group?data=${encodeURIComponent(JSON.stringify(payload))}`;
}

export function parseNearlinkQr(qrString: string): NearlinkQrPayload | null {
  try {
    if (!qrString.startsWith('nearlink://')) return null;
    const url = new URL(qrString.replace('nearlink://', 'https://nearlink.local/'));
    const data = url.searchParams.get('data');
    if (!data) return null;
    const parsed = JSON.parse(decodeURIComponent(data));
    if (parsed.type === 'IDENTITY' || parsed.type === 'GROUP_INVITE') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
