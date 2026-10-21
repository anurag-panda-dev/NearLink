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

/**
 * Result of scanning *any* QR code with the in-app scanner.
 *
 * - `identity`     — a valid NearLink identity QR (peer can be added)
 * - `group_invite` — a valid NearLink group invite QR (group can be joined)
 * - `invalid`      — a `nearlink://` QR that failed to decode / is missing required fields
 * - `unknown`      — any other QR in the wild (URL, plain text, ...)
 */
export type QrScanResult =
  | { kind: 'identity'; raw: string; payload: QrIdentityPayload }
  | { kind: 'group_invite'; raw: string; payload: QrGroupInvitePayload }
  | { kind: 'invalid'; raw: string }
  | { kind: 'unknown'; raw: string };

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/**
 * Classify an arbitrary scanned string. Never throws — damaged payloads are
 * reported as `invalid` so the scanner UI can ask the sender to regenerate.
 */
export function classifyQrString(raw: string): QrScanResult {
  const value = (raw ?? '').trim();
  if (!value) return { kind: 'unknown', raw: value };

  const parsed = parseNearlinkQr(value);
  if (!parsed) {
    // A nearlink:// URL that failed to parse is a damaged NearLink QR,
    // anything else is simply a foreign QR code.
    return value.startsWith('nearlink://')
      ? { kind: 'invalid', raw: value }
      : { kind: 'unknown', raw: value };
  }

  if (parsed.type === 'IDENTITY') {
    const payload: QrIdentityPayload = {
      type: 'IDENTITY',
      id: asString(parsed.id),
      name: asString(parsed.name) || 'Unknown Peer',
      publicKey: asString(parsed.publicKey),
      signingPublicKey: asString(parsed.signingPublicKey),
      avatarSeed: asString(parsed.avatarSeed) || asString(parsed.id).substring(0, 4),
    };
    if (!payload.id || !payload.publicKey) return { kind: 'invalid', raw: value };
    return { kind: 'identity', raw: value, payload };
  }

  const payload: QrGroupInvitePayload = {
    type: 'GROUP_INVITE',
    groupId: asString(parsed.groupId),
    groupName: asString(parsed.groupName) || 'Unnamed Group',
    groupKey: asString(parsed.groupKey),
    epoch: typeof parsed.epoch === 'number' && parsed.epoch >= 1 ? parsed.epoch : 1,
    creatorId: asString(parsed.creatorId),
  };
  if (!payload.groupId || !payload.groupKey) return { kind: 'invalid', raw: value };
  return { kind: 'group_invite', raw: value, payload };
}
