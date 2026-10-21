import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../src/theme/colors';
import { Header } from '../src/components/Header';
import { useChatStore, ConversationSummary } from '../src/stores/chatStore';
import {
  MessageSquare,
  Search,
  Check,
  CheckCheck,
  Clock,
  Radio,
  Users,
  Plus,
} from 'lucide-react-native';

export default function ChatsListScreen() {
  const router = useRouter();
  const { conversations, loadConversations, setActiveConversation } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  const conversationList = Array.from(conversations.values()).filter((c) =>
    c.peerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessageSnippet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenConversation = async (c: ConversationSummary) => {
    await setActiveConversation(c.peerId);
    router.push(`/chat/${c.peerId}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="NearLink" subtitle="Direct Messages" />

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Conversation List */}
      <FlatList
        data={conversationList}
        keyExtractor={(item) => item.peerId}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const timeStr = new Date(item.lastMessageTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          const initial = item.peerName.charAt(0).toUpperCase();

          return (
            <TouchableOpacity
              style={styles.convCard}
              onPress={() => handleOpenConversation(item)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
                {item.isOnline && <View style={styles.onlineBadge} />}
              </View>

              <View style={styles.cardContent}>
                <View style={styles.nameRow}>
                  <Text style={styles.peerName} numberOfLines={1}>
                    {item.peerName}
                  </Text>
                  <Text style={styles.timeText}>{timeStr}</Text>
                </View>

                <View style={styles.snippetRow}>
                  <Text style={styles.snippetText} numberOfLines={1}>
                    {item.lastMessageSnippet}
                  </Text>
                  {item.deliveryStatus === 'delivered' ? (
                    <CheckCheck size={14} color={Colors.success} />
                  ) : item.deliveryStatus === 'sent' ? (
                    <Check size={14} color={Colors.textSecondary} />
                  ) : item.deliveryStatus === 'queued' ? (
                    <Clock size={12} color={Colors.warning} />
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <MessageSquare size={36} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Conversations Yet</Text>
            <Text style={styles.emptyDesc}>
              Pair with nearby peers over Bluetooth to start an end-to-end encrypted offline conversation.
            </Text>
            <TouchableOpacity
              style={styles.scanNowBtn}
              onPress={() => router.push('/nearby')}
            >
              <Radio size={16} color={Colors.background} />
              <Text style={styles.scanNowBtnText}>Discover Nearby Peers</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/nearby')}
      >
        <Plus size={24} color={Colors.background} />
      </TouchableOpacity>

      {/* Bottom Nav Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/nearby')}
        >
          <Radio size={20} color={Colors.textSecondary} />
          <Text style={styles.navText}>Nearby</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, styles.navItemActive]}
          onPress={() => router.push('/chats')}
        >
          <MessageSquare size={20} color={Colors.primary} />
          <Text style={[styles.navText, styles.navTextActive]}>Direct Chats</Text>
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
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  convCard: {
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.borderActive,
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  cardContent: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  peerName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  timeText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  snippetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  snippetText: {
    color: Colors.textSecondary,
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDesc: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  scanNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  scanNowBtnText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 74,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
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
