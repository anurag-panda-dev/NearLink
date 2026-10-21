import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';
import { KeyPair, UserIdentityKeys } from '../../types/identity';

/**
 * Generate a new X25519 (box) and Ed25519 (sign) cryptographic identity.
 */
export function generateUserIdentityKeys(): UserIdentityKeys {
  const boxKeys = nacl.box.keyPair();
  const signKeys = nacl.sign.keyPair();

  return {
    encryption: {
      publicKey: encodeBase64(boxKeys.publicKey),
      secretKey: encodeBase64(boxKeys.secretKey),
    },
    signing: {
      publicKey: encodeBase64(signKeys.publicKey),
      secretKey: encodeBase64(signKeys.secretKey),
    },
  };
}

/**
 * Derives a human-friendly hexadecimal fingerprint from a public key.
 */
export function getFingerprint(publicKeyBase64: string): string {
  const bytes = decodeBase64(publicKeyBase64);
  const hash = nacl.hash(bytes);
  return Array.from(hash.slice(0, 8))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(':')
    .toUpperCase();
}

/**
 * Derives a 6-digit safety verification code for peer verification (Signal-style).
 */
export function getSafetyNumber(localPubKey: string, peerPubKey: string): string {
  // Lexicographically sort keys so both peers compute identical safety number
  const sorted = [localPubKey, peerPubKey].sort();
  const combined = sorted[0] + '::' + sorted[1];
  const hash = nacl.hash(decodeUTF8(combined));

  // Take first 4 bytes to form a stable numeric code
  const num = ((hash[0] << 24) | (hash[1] << 16) | (hash[2] << 8) | hash[3]) >>> 0;
  return (num % 1000000).toString().padStart(6, '0');
}

/**
 * Sign data using Ed25519 secret key.
 * Returns an empty string if the key is absent, zero-length, or the wrong size
 * (64 bytes required by Ed25519) — never throws.
 */
export function signData(message: string, secretKeyBase64?: string): string {
  if (!secretKeyBase64 || secretKeyBase64.length === 0) return '';
  try {
    const msgBytes = decodeUTF8(message);
    const secBytes = decodeBase64(secretKeyBase64);
    // nacl.sign.secretKeyLength === 64; reject 0-byte or wrong-size keys
    if (!secBytes || secBytes.length === 0 || secBytes.length !== nacl.sign.secretKeyLength) {
      return '';
    }
    const sig = nacl.sign.detached(msgBytes, secBytes);
    return encodeBase64(sig);
  } catch {
    return '';
  }
}

/**
 * Verify Ed25519 signature against public key.
 */
export function verifySignature(message: string, signatureBase64: string, publicKeyBase64: string): boolean {
  try {
    const msgBytes = decodeUTF8(message);
    const sigBytes = decodeBase64(signatureBase64);
    const pubBytes = decodeBase64(publicKeyBase64);
    return nacl.sign.detached.verify(msgBytes, sigBytes, pubBytes);
  } catch {
    return false;
  }
}
