import {
  generateUserIdentityKeys,
  getFingerprint,
  getSafetyNumber,
  signData,
  verifySignature,
} from '../src/services/crypto/keys';
import {
  encryptForPeer,
  decryptFromPeer,
  generateGroupKey,
  encryptGroupMessage,
  decryptGroupMessage,
} from '../src/services/crypto/cipher';
import {
  createIdentityQrString,
  createGroupInviteQrString,
  parseNearlinkQr,
} from '../src/services/crypto/qr';

describe('Cryptographic Services (AC-1, AC-3, AC-5)', () => {
  it('generates distinct valid Ed25519 and X25519 keypairs', () => {
    const keys1 = generateUserIdentityKeys();
    const keys2 = generateUserIdentityKeys();

    expect(keys1.encryption.publicKey).toBeDefined();
    expect(keys1.encryption.secretKey).toBeDefined();
    expect(keys1.signing.publicKey).toBeDefined();
    expect(keys1.signing.secretKey).toBeDefined();

    expect(keys1.encryption.publicKey).not.toEqual(keys2.encryption.publicKey);
    expect(keys1.signing.publicKey).not.toEqual(keys2.signing.publicKey);
  });

  it('computes stable hexadecimal fingerprints', () => {
    const keys = generateUserIdentityKeys();
    const fp1 = getFingerprint(keys.encryption.publicKey);
    const fp2 = getFingerprint(keys.encryption.publicKey);

    expect(fp1).toEqual(fp2);
    expect(fp1).toMatch(/^[0-9A-F]{2}(:[0-9A-F]{2}){7}$/);
  });

  it('computes symmetrical safety numbers for peer verification', () => {
    const aliceKeys = generateUserIdentityKeys();
    const bobKeys = generateUserIdentityKeys();

    const codeAlice = getSafetyNumber(aliceKeys.encryption.publicKey, bobKeys.encryption.publicKey);
    const codeBob = getSafetyNumber(bobKeys.encryption.publicKey, aliceKeys.encryption.publicKey);

    expect(codeAlice).toEqual(codeBob);
    expect(codeAlice).toMatch(/^\d{6}$/);
  });

  it('signs and verifies data with Ed25519', () => {
    const keys = generateUserIdentityKeys();
    const payload = 'NearLink-Offline-Payload-1234';

    const sig = signData(payload, keys.signing.secretKey);
    const isValid = verifySignature(payload, sig, keys.signing.publicKey);
    expect(isValid).toBe(true);

    const isTampered = verifySignature('Tampered-Payload', sig, keys.signing.publicKey);
    expect(isTampered).toBe(false);
  });

  it('performs end-to-end authenticated encryption between Alice and Bob', () => {
    const alice = generateUserIdentityKeys();
    const bob = generateUserIdentityKeys();

    const message = 'Secret rendezvous coordinates: 37.7749, -122.4194';

    // Alice encrypts for Bob
    const encrypted = encryptForPeer(
      message,
      bob.encryption.publicKey,
      alice.encryption.secretKey
    );

    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.ciphertext).not.toEqual(message);

    // Bob decrypts from Alice
    const decrypted = decryptFromPeer(encrypted, bob.encryption.secretKey);
    expect(decrypted).toEqual(message);

    // Eve cannot decrypt
    const eve = generateUserIdentityKeys();
    const eveDecrypted = decryptFromPeer(encrypted, eve.encryption.secretKey);
    expect(eveDecrypted).toBeNull();
  });

  it('performs symmetric group encryption with 256-bit keys', () => {
    const groupKey = generateGroupKey();
    const message = 'Team broadcast: Mesh node operational';

    const { nonce, ciphertext } = encryptGroupMessage(message, groupKey);
    expect(ciphertext).not.toEqual(message);

    const decrypted = decryptGroupMessage(ciphertext, nonce, groupKey);
    expect(decrypted).toEqual(message);

    const wrongKey = generateGroupKey();
    const failedDecryption = decryptGroupMessage(ciphertext, nonce, wrongKey);
    expect(failedDecryption).toBeNull();
  });

  it('encodes and parses nearlink QR payloads', () => {
    const profile = {
      id: 'A1:B2:C3:D4:E5:F6:07:08',
      displayName: 'Alice',
      avatarSeed: 'seed1',
      publicKey: 'pubKey123==',
      signingPublicKey: 'signKey123==',
      createdAt: 1000,
      isDiscoverable: true,
      relayOptIn: true,
    };

    const qrStr = createIdentityQrString(profile);
    expect(qrStr.startsWith('nearlink://identity')).toBe(true);

    const parsed = parseNearlinkQr(qrStr);
    expect(parsed).not.toBeNull();
    if (parsed && parsed.type === 'IDENTITY') {
      expect(parsed.id).toEqual(profile.id);
      expect(parsed.name).toEqual('Alice');
      expect(parsed.publicKey).toEqual('pubKey123==');
    }
  });
});
