import { create } from 'zustand';
import { UserProfile, UserIdentityKeys } from '../types/identity';
import { generateUserIdentityKeys, getFingerprint } from '../services/crypto/keys';
import { LocalStorage } from '../services/storage/LocalStorage';
import { BleService } from '../services/ble/BleService';
import { MeshRouter } from '../services/mesh/MeshRouter';
import { GroupManager } from '../services/group/GroupManager';

interface IdentityState {
  profile: UserProfile | null;
  keys: UserIdentityKeys | null;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  createProfile: (displayName: string, avatarSeed?: string) => Promise<UserProfile>;
  updateDisplayName: (displayName: string) => Promise<void>;
  toggleDiscoverability: () => Promise<void>;
  toggleRelayOptIn: () => Promise<void>;
  resetAccount: () => Promise<void>;
}

export const useIdentityStore = create<IdentityState>((set, get) => ({
  profile: null,
  keys: null,
  isInitialized: false,

  initialize: async () => {
    const storage = LocalStorage.getInstance();
    const storedProfile = await storage.getProfile();
    const storedKeys = await storage.getKeys();

    if (storedProfile && storedKeys) {
      set({ profile: storedProfile, keys: storedKeys, isInitialized: true });
      BleService.getInstance().setIdentity(storedProfile, storedKeys.signing.secretKey);
      MeshRouter.getInstance().configure(
        storedProfile.id,
        storedProfile.displayName,
        storedKeys.signing.secretKey,
        storedProfile.relayOptIn
      );
      GroupManager.getInstance().configure(storedProfile.id, storedProfile.displayName);
      await GroupManager.getInstance().loadPersistedGroups();
    } else {
      set({ isInitialized: true });
    }
  },

  createProfile: async (displayName: string, avatarSeed?: string) => {
    const keys = generateUserIdentityKeys();
    const fingerprint = getFingerprint(keys.encryption.publicKey);
    const seed = avatarSeed || Math.random().toString(36).substring(2, 6);

    const profile: UserProfile = {
      id: fingerprint,
      displayName: displayName.trim() || 'Anonymous Peer',
      avatarSeed: seed,
      publicKey: keys.encryption.publicKey,
      signingPublicKey: keys.signing.publicKey,
      createdAt: Date.now(),
      isDiscoverable: true,
      relayOptIn: true,
    };

    const storage = LocalStorage.getInstance();
    await storage.saveKeys(keys);
    await storage.saveProfile(profile);

    set({ profile, keys });

    BleService.getInstance().setIdentity(profile, keys.signing.secretKey);
    MeshRouter.getInstance().configure(
      profile.id,
      profile.displayName,
      keys.signing.secretKey,
      profile.relayOptIn
    );
    GroupManager.getInstance().configure(profile.id, profile.displayName);

    return profile;
  },

  updateDisplayName: async (displayName: string) => {
    const { profile } = get();
    if (!profile) return;
    const updated = { ...profile, displayName };
    await LocalStorage.getInstance().saveProfile(updated);
    set({ profile: updated });
  },

  toggleDiscoverability: async () => {
    const { profile } = get();
    if (!profile) return;
    const updated = { ...profile, isDiscoverable: !profile.isDiscoverable };
    await LocalStorage.getInstance().saveProfile(updated);
    set({ profile: updated });
  },

  toggleRelayOptIn: async () => {
    const { profile } = get();
    if (!profile) return;
    const updated = { ...profile, relayOptIn: !profile.relayOptIn };
    await LocalStorage.getInstance().saveProfile(updated);
    MeshRouter.getInstance().setRelayOptIn(updated.relayOptIn);
    set({ profile: updated });
  },

  resetAccount: async () => {
    await LocalStorage.getInstance().clearAllData();
    set({ profile: null, keys: null });
  },
}));
