import { create } from 'zustand';
import { DiscoveredPeer, BleConnectionState } from '../types/ble';
import { BleService } from '../services/ble/BleService';
import { QueueManager } from '../services/message-queue/QueueManager';

interface BleState {
  state: BleConnectionState;
  isScanning: boolean;
  discoveredPeers: DiscoveredPeer[];
  connectedPeers: string[];
  selectedPeer: DiscoveredPeer | null;

  startScan: () => Promise<void>;
  stopScan: () => Promise<void>;
  connect: (peerId: string) => Promise<boolean>;
  disconnect: (peerId: string) => Promise<void>;
  selectPeer: (peer: DiscoveredPeer | null) => void;
  refreshPeers: () => void;
}

export const useBleStore = create<BleState>((set, get) => {
  const ble = BleService.getInstance();

  // Listen to manager state changes
  ble.getManager().onStateChanged((state, peerId) => {
    set({
      state,
      connectedPeers: ble.getManager().getConnectedPeers(),
    });
  });

  return {
    state: 'idle',
    isScanning: false,
    discoveredPeers: [],
    connectedPeers: [],
    selectedPeer: null,

    startScan: async () => {
      set({ isScanning: true, state: 'scanning' });
      await ble.startDiscovery((peer) => {
        const peers = ble.getDiscoveredPeers();
        set({ discoveredPeers: [...peers] });
      });
    },

    stopScan: async () => {
      await ble.stopDiscovery();
      set({ isScanning: false, state: 'idle' });
    },

    connect: async (peerId: string) => {
      set({ state: 'connecting' });
      const success = await ble.connectToPeer(peerId);
      if (success) {
        set({
          state: 'connected',
          connectedPeers: ble.getManager().getConnectedPeers(),
        });
        // Flush any queued offline messages for this newly connected peer
        await QueueManager.getInstance().flushQueueForPeer(peerId);
      } else {
        set({ state: 'failed' });
      }
      return success;
    },

    disconnect: async (peerId: string) => {
      await ble.getManager().disconnect(peerId);
      set({ connectedPeers: ble.getManager().getConnectedPeers() });
    },

    selectPeer: (peer: DiscoveredPeer | null) => {
      set({ selectedPeer: peer });
    },

    refreshPeers: () => {
      set({
        discoveredPeers: [...ble.getDiscoveredPeers()],
        connectedPeers: ble.getManager().getConnectedPeers(),
      });
    },
  };
});
