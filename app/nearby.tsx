import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../src/theme/colors';
import { Header } from '../src/components/Header';
import { PeerCard } from '../src/components/PeerCard';
import { useBleStore } from '../src/stores/bleStore';
import { useChatStore } from '../src/stores/chatStore';
import { Radio, RefreshCw, MessageSquare, Users, ShieldAlert } from 'lucide-react-native';

export default function NearbyScreen() {
  const router = useRouter();
  const {
    isScanning,
    discoveredPeers,
    connectedPeers,
    startScan,
    stopScan,
    connect,
  } = useBleStore();
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  useEffect(() => {
    startScan();
    return () => {
      stopScan();
    };
  }, []);

  const handleOpenChat = async (peerId: string, peerName: string) => {
    await setActiveConversation(peerId);
    router.push(`/chat/${peerId}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="NearLink" subtitle="Nearby Discovery" />

      {/* Control Banner */}
      <View style={styles.controlBanner}>
        <View style={styles.bannerInfo}>
          <View style={styles.radarIcon}>
            <Radio size={20} color={isScanning ? Colors.primary : Colors.textMuted} />
          </View>
          <View>
            <Text style={styles.bannerTitle}>
              {isScanning ? 'Scanning BLE Frequencies' : 'Bluetooth Radio Idle'}
            </Text>
            <Text style={styles.bannerDesc}>
              {discoveredPeers.length} {discoveredPeers.length === 1 ? 'device' : 'devices'} in radio proximity
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.scanBtn, isScanning && styles.scanBtnActive]}
          onPress={() => (isScanning ? stopScan() : startScan())}
        >
          {isScanning ? (
            <ActivityIndicator size="small" color={Colors.background} />
          ) : (
            <RefreshCw size={14} color={Colors.primary} />
          )}
          <Text style={[styles.scanBtnText, isScanning && styles.scanBtnTextActive]}>
            {isScanning ? 'Stop' : 'Scan'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Peer List */}
      <FlatList
        data={discoveredPeers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <PeerCard
            peer={item}
            isConnected={connectedPeers.includes(item.id)}
            onConnect={connect}
            onOpenChat={handleOpenChat}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Radio size={36} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Searching for Nearby Peers...</Text>
            <Text style={styles.emptyDesc}>
              Ensure Bluetooth is turned on. Other NearLink devices advertising nearby will appear here automatically.
            </Text>
          </View>
        }
      />

      {/* Bottom Nav Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, styles.navItemActive]}
          onPress={() => router.push('/nearby')}
        >
          <Radio size={20} color={Colors.primary} />
          <Text style={[styles.navText, styles.navTextActive]}>Nearby</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/chats')}
        >
          <MessageSquare size={20} color={Colors.textSecondary} />
          <Text style={styles.navText}>Direct Chats</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/groups')}
        >
          <Users size={20} color={Colors.textSecondary} />
          <Text style={styles.navText}>Groups</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  controlBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  radarIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bannerTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  bannerDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanBtnActive: {
    backgroundColor: Colors.primary,
  },
  scanBtnText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  scanBtnTextActive: {
    color: Colors.background,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDesc: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 12,
  },
  navItemActive: {
    transform: [{ scale: 1.05 }],
  },
  navText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  navTextActive: {
    color: Colors.primary,
  },
});
