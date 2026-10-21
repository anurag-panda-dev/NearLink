export interface UserProfile {
  id: string; // Public fingerprint (hex or base64 truncated)
  displayName: string;
  avatarSeed: string; // Deterministic avatar identifier
  publicKey: string; // Base64 X25519 public key
  signingPublicKey: string; // Base64 Ed25519 signing public key
  createdAt: number;
  isDiscoverable: boolean;
  relayOptIn: boolean;
}

export interface KeyPair {
  publicKey: string;
  secretKey: string;
}

export interface UserIdentityKeys {
  encryption: KeyPair; // X25519
  signing: KeyPair;    // Ed25519
}

export interface PeerContact {
  id: string;
  displayName: string;
  avatarSeed: string;
  publicKey: string;
  signingPublicKey: string;
  isTrusted: boolean;
  isBlocked: boolean;
  lastSeen: number;
  fingerprint: string;
}
