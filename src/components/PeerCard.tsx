import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { DiscoveredPeer } from '../types/ble';
import { ConnectionBadge } from './ConnectionBadge';
import { Radio, MessageSquare, CheckCircle } from 'lucide-react-native';

interface PeerCardProps {
  peer: DiscoveredPeer;
  isConnected: boolean;
  onConnect: (peerId: string) => void;
  onOpenChat: (peerId: string, peerName: string) => void;
}

export const PeerCard: React.FC<PeerCardProps> = ({
  peer,
  isConnected,
  onConnect,
  onOpenChat,
}) => {
  const initial = peer.name ? peer.name.charAt(0).toUpperCase() : '?';

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {peer.name || 'Unnamed Peer'}
          </Text>
          {isConnected && (
            <View style={styles.connectedPill}>
              <CheckCircle size={11} color={Colors.success} />
              <Text style={styles.connectedPillText}>Paired</Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.idText}>ID: {peer.id.substring(0, 12)}</Text>
          <ConnectionBadge rssi={peer.rssi} isConnected={isConnected} />
        </View>
      </View>

      <View style={styles.actionCol}>
        {isConnected ? (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => onOpenChat(peer.id, peer.name)}
          >
            <MessageSquare size={16} color={Colors.background} />
            <Text style={styles.chatButtonText}>Chat</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.connectButton}
            onPress={() => onConnect(peer.id)}
          >
            <Radio size={14} color={Colors.primary} />
            <Text style={styles.connectButtonText}>Pair</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderActive,
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  connectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.successGlow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  connectedPillText: {
    color: Colors.success,
    fontSize: 10,
    fontWeight: 'bold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  idText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  actionCol: {
    justifyContent: 'center',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectButtonText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  chatButtonText: {
    color: Colors.background,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
