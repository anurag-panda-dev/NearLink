import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';
import { EncryptedPayload } from '../../types/message';

/**
 * Encrypts a message for a specific peer using X25519 public-key authenticated encryption.
 */
export function encryptForPeer(
  plaintext: string,
  recipientPublicKeyBase64: string,
  senderSecretKeyBase64: string
): EncryptedPayload {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const msgBytes = decodeUTF8(plaintext);
  const recipBytes = decodeBase64(recipientPublicKeyBase64);
  const senderSecBytes = decodeBase64(senderSecretKeyBase64);

  // Derive sender public key from secret key
  const senderPubKey = nacl.box.keyPair.fromSecretKey(senderSecBytes).publicKey;

  const ciphertext = nacl.box(msgBytes, nonce, recipBytes, senderSecBytes);

  return {
    nonce: encodeBase64(nonce),
    ciphertext: encodeBase64(ciphertext),
    senderPublicKey: encodeBase64(senderPubKey),
  };
}

/**
 * Decrypts a message from a peer using the recipient's secret key and sender's public key.
 */
export function decryptFromPeer(
  payload: EncryptedPayload,
  recipientSecretKeyBase64: string
): string | null {
  try {
    const nonce = decodeBase64(payload.nonce);
    const ciphertext = decodeBase64(payload.ciphertext);
    const senderPubKey = decodeBase64(payload.senderPublicKey);
    const recipSec = decodeBase64(recipientSecretKeyBase64);

    const decrypted = nacl.box.open(ciphertext, nonce, senderPubKey, recipSec);
    if (!decrypted) return null;
    return encodeUTF8(decrypted);
  } catch (err) {
    return null;
  }
}

/**
 * Generates a random 256-bit symmetric key for group encryption.
 */
export function generateGroupKey(): string {
  const key = nacl.randomBytes(nacl.secretbox.keyLength);
  return encodeBase64(key);
}

/**
 * Encrypts a group message using a shared symmetric group key.
 */
export function encryptGroupMessage(
  plaintext: string,
  groupKeyBase64: string
): { nonce: string; ciphertext: string } {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const msgBytes = decodeUTF8(plaintext);
  const keyBytes = decodeBase64(groupKeyBase64);

  const ciphertext = nacl.secretbox(msgBytes, nonce, keyBytes);

  return {
    nonce: encodeBase64(nonce),
    ciphertext: encodeBase64(ciphertext),
  };
}

/**
 * Decrypts a group message using the shared symmetric group key.
 */
export function decryptGroupMessage(
  ciphertextBase64: string,
  nonceBase64: string,
  groupKeyBase64: string
): string | null {
  try {
    const ciphertext = decodeBase64(ciphertextBase64);
    const nonce = decodeBase64(nonceBase64);
    const key = decodeBase64(groupKeyBase64);

    const decrypted = nacl.secretbox.open(ciphertext, nonce, key);
    if (!decrypted) return null;
    return encodeUTF8(decrypted);
  } catch {
    return null;
  }
}
