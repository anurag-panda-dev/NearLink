import { BleConnectionState, DiscoveredPeer, BlePacket } from '../../types/ble';
import {
  BleManagerInterface,
  DiscoveryCallback,
  PacketCallback,
  StateChangeCallback,
} from './BleManagerInterface';

// ---------------------------------------------------------------------------
// Types only — erased at compile time. Nothing native loads at module scope so
// this file is safe to import from code paths that run in Node (jest) or on web.
// ---------------------------------------------------------------------------
import type { BleManager, Device, State } from 'react-native-ble-plx';

/** NearLink BLE service UUID (16-bit 0xFE2C, Bluetooth dynamic range). */
export const NEARLINK_SERVICE_UUID = '0000FE2C-0000-1000-8000-00805F9B34FB';

/**
 * Characteristic a NearLink peer *may* expose for packet delivery. react-native-ble-plx
 * v3 is central-role only (scan/connect/GATT client) — it cannot run a GATT server —
 * so this write only succeeds against peers built with a peripheral-capable stack.
 * When it fails, QueueManager store-and-forward takes over (by design).
 */
export const NEARLINK_PACKET_CHARACTERISTIC_UUID = '0000FE2D-0000-1000-8000-00805F9B34FB';

const ANDROID_12_SDK = 31;
/** ATT write ceiling (MTU 512 - 3). Anything larger needs framing (future work). */
const MAX_WRITE_BYTES = 480;

/**
 * True only when a native dev/production build with a working react-native-ble-plx
 * native module is running. Never true in Expo Go, on web, or in Node tests —
 * every require() failure resolves to false → BleSimulator fallback.
 */
export function isNativeBleSupported(): boolean {
  try {
    const { Platform } = require('react-native') as typeof import('react-native');
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') return false;

    const Constants = require('expo-constants').default;
    // Expo Go cannot host native modules not compiled into the store binary.
    if (Constants.executionEnvironment === 'storeClient') return false;

    // Throws when the native side was never compiled in (e.g. plain Expo Go / web run).
    require('react-native-ble-plx');
    return true;
  } catch {
    return false;
  }
}

export class BleNative implements BleManagerInterface {
  private manager: BleManager | null = null;
  private radioState: State | null = null;
  private initPromise: Promise<boolean> | null = null;
  private isScanning = false;
  private isAdvertising = false;
  private connectedDevices: Map<string, Device> = new Map();
  private packetListeners: PacketCallback[] = [];
  private discoveryListeners: DiscoveryCallback[] = [];
  private stateListeners: StateChangeCallback[] = [];

  async initialize(): Promise<boolean> {
    if (!this.initPromise) {
      this.initPromise = this.doInitialize();
    }
    return this.initPromise;
  }

  private async doInitialize(): Promise<boolean> {
    try {
      const { Platform, PermissionsAndroid } = require('react-native') as typeof import('react-native');
      const ble = require('react-native-ble-plx') as typeof import('react-native-ble-plx');

      // Android 12+ (API 31): runtime BLUETOOTH_SCAN / BLUETOOTH_CONNECT grants.
      if (Platform.OS === 'android' && Number(Platform.Version) >= ANDROID_12_SDK) {
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
        const allGranted = Object.values(results).every(
          (r) => r === PermissionsAndroid.RESULTS.GRANTED
        );
        if (!allGranted) {
          console.warn('[BleNative] Bluetooth permissions denied by the user');
          return false;
        }
      }

      this.manager = new ble.BleManager();
      const state = await this.manager.state();
      this.radioState = state;
      this.manager.onStateChange((next: State) => {
        this.radioState = next;
      });
      return state === 'PoweredOn';
    } catch (err) {
      console.warn('[BleNative] Failed to initialize native BLE:', err);
      this.manager = null;
      return false;
    }
  }

  async isBluetoothEnabled(): Promise<boolean> {
    const ok = await this.initialize();
    return ok && this.radioState === 'PoweredOn';
  }

  async startScanning(onDiscover: DiscoveryCallback): Promise<void> {
    const ok = await this.initialize();
    if (!ok || !this.manager) {
      throw new Error('Bluetooth is turned off or permissions were denied');
    }

    this.discoveryListeners = [onDiscover];
    this.isScanning = true;
    this.notifyState('scanning');

    try {
      // null filter = every advertising device in range (real radio discovery).
      // Peers advertising NEARLINK_SERVICE_UUID are NearLink instances; everything
      // else is still real hardware with real RSSI — not simulated.
      await this.manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.warn('[BleNative] scan error:', error.message);
          return;
        }
        if (!device) return;
        const peer: DiscoveredPeer = {
          id: device.id,
          name: device.name || device.localName || `Unknown ${device.id.slice(-5)}`,
          rssi: device.rssi ?? -100,
          serviceUUIDs: device.serviceUUIDs ?? [],
          isConnectable: device.isConnectable ?? true,
          lastSeen: Date.now(),
        };
        for (const listener of this.discoveryListeners) {
          listener(peer);
        }
      });
    } catch (err) {
      this.isScanning = false;
      this.notifyState('idle');
      throw err;
    }
  }

  async stopScanning(): Promise<void> {
    if (this.manager && this.isScanning) {
      try {
        await this.manager.stopDeviceScan();
      } catch (err) {
        console.warn('[BleNative] stopDeviceScan failed:', err);
      }
    }
    this.isScanning = false;
    this.notifyState('idle');
  }

  async startAdvertising(_localPeerName: string, _localPublicKey: string): Promise<void> {
    // react-native-ble-plx v3 removed the peripheral/advertising API (central role only).
    // Two NearLink phones therefore cannot discover each other through this stack yet;
    // scanning works against any real advertiser. Track via memory.md pending item:
    // "advertising needs a peripheral-capable module (e.g. custom Expo module)".
    if (!this.isAdvertising) {
      this.isAdvertising = true;
      console.warn(
        '[BleNative] Advertising is not supported by react-native-ble-plx v3 — this device will not be discoverable by other scanners.'
      );
    }
  }

  async stopAdvertising(): Promise<void> {
    this.isAdvertising = false;
  }

  async connect(peerId: string): Promise<boolean> {
    const ok = await this.initialize();
    if (!ok || !this.manager) return false;

    this.notifyState('connecting', peerId);
    try {
      const device = await this.manager.connectToDevice(peerId);
      await this.manager.discoverAllServicesAndCharacteristicsForDevice(peerId);
      // Best effort: bump MTU so packet writes are not limited to 20 bytes.
      try {
        await this.manager.requestMTUForDevice(peerId, 512);
      } catch {
        /* MTU negotiation is optional — default still works for small packets */
      }
      this.connectedDevices.set(peerId, device);
      this.notifyState('connected', peerId);
      return true;
    } catch (err) {
      console.warn('[BleNative] connect failed:', err);
      this.notifyState('failed', peerId);
      return false;
    }
  }

  async disconnect(peerId: string): Promise<void> {
    this.notifyState('disconnecting', peerId);
    try {
      await this.manager?.cancelDeviceConnection(peerId);
    } catch (err) {
      console.warn('[BleNative] disconnect failed:', err);
    }
    this.connectedDevices.delete(peerId);
    this.notifyState('disconnected', peerId);
  }

  async sendPacket(peerId: string, packet: BlePacket): Promise<boolean> {
    const device = this.connectedDevices.get(peerId);
    if (!device || !this.manager) return false;

    try {
      const bytes = utf8ToBase64(JSON.stringify(packet));
      if (bytes.length > MAX_WRITE_BYTES) {
        // Oversized packets need fragmentation framing — leave to QueueManager.
        return false;
      }
      await device.writeCharacteristicWithoutResponseForService(
        NEARLINK_SERVICE_UUID,
        NEARLINK_PACKET_CHARACTERISTIC_UUID,
        bytes
      );
      return true;
    } catch {
      // Peer does not expose the NearLink characteristic (no GATT server on the
      // other side) — report failure so the message stays queued store-and-forward.
      return false;
    }
  }

  onPacketReceived(callback: PacketCallback): void {
    this.packetListeners.push(callback);
    // Remote GATT-server notifications are not available in ble-plx v3 without a
    // peripheral-capable peer; inbound packet events arrive once that exists.
  }

  onStateChanged(callback: StateChangeCallback): void {
    this.stateListeners.push(callback);
  }

  getConnectedPeers(): string[] {
    return Array.from(this.connectedDevices.keys());
  }

  private notifyState(state: BleConnectionState, peerId?: string): void {
    for (const listener of this.stateListeners) {
      listener(state, peerId);
    }
  }
}

/** UTF-8 → base64 without relying on global Buffer/Btoa (RN has neither by default). */
function utf8ToBase64(text: string): string {
  const { Buffer } = require('buffer') as typeof import('buffer');
  return Buffer.from(text, 'utf8').toString('base64');
}
