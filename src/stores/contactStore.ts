import { create } from 'zustand';
import { PeerContact } from '../types/identity';
import { QrIdentityPayload } from '../services/crypto/qr';
import { LocalStorage } from '../services/storage/LocalStorage';

interface ContactState {
  contacts: PeerContact[];
  loadContacts: () => Promise<void>;
  /** Save (or refresh) a peer captured from a scanned identity QR. */
  addContactFromIdentity: (payload: QrIdentityPayload) => Promise<PeerContact>;
  getContact: (id: string) => PeerContact | undefined;
}

export const useContactStore = create<ContactState>((set, get) => {
  const storage = LocalStorage.getInstance();

  return {
    contacts: [],

    loadContacts: async () => {
      set({ contacts: await storage.getContacts() });
    },

    getContact: (id: string) => get().contacts.find((c) => c.id === id),

    addContactFromIdentity: async (payload: QrIdentityPayload) => {
      const now = Date.now();
      // Trust/block decisions survive a re-scan; keys and name are refreshed.
      const existing = await storage.getContact(payload.id);

      const contact: PeerContact = {
        id: payload.id,
        displayName: payload.name,
        avatarSeed: payload.avatarSeed,
        publicKey: payload.publicKey,
        signingPublicKey: payload.signingPublicKey,
        isTrusted: existing?.isTrusted ?? false,
        isBlocked: existing?.isBlocked ?? false,
        lastSeen: now,
        fingerprint: payload.id,
      };

      await storage.saveContact(contact);
      set((state) => ({
        contacts: [...state.contacts.filter((c) => c.id !== contact.id), contact],
      }));

      return contact;
    },
  };
});
