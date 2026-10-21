import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeScreen } from '../src/components/SafeScreen';
import { useRouter } from 'expo-router';
import { Colors } from '../src/theme/colors';
import { Header } from '../src/components/Header';
import { useGroupStore } from '../src/stores/groupStore';
import { OfflineGroup } from '../src/types/group';
import { Users, Plus, Shield, Radio, MessageSquare, ScanLine } from 'lucide-react-native';

export default function GroupsListScreen() {
  const router = useRouter();
  const { groups, loadGroups, setActiveGroup } = useGroupStore();

  useEffect(() => {
    loadGroups();
  }, []);

  const handleOpenGroup = async (group: OfflineGroup) => {
    await setActiveGroup(group.id);
    router.push(`/group/${group.id}`);
  };

  return (
    <SafeScreen>
      <Header title="NearLink" subtitle="Mesh Groups" />

      {/* Hero Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerTextCol}>
          <Text style={styles.bannerTitle}>Decentralized Group Mesh</Text>
          <Text style={styles.bannerDesc}>
            Broadcast encrypted messages to all group members across multi-hop BLE relays.
          </Text>
        </View>
        <View style={styles.bannerBtnCol}>
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => router.push('/scan?type=group')}
          >
            <ScanLine size={16} color={Colors.purple} />
            <Text style={styles.joinBtnText}>Join</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push('/group/create')}
          >
            <Plus size={16} color={Colors.background} />
            <Text style={styles.createBtnText}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Groups List */}
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.groupCard}
            onPress={() => handleOpenGroup(item)}
          >
            <View style={styles.groupIconBox}>
              <Text style={styles.groupIconText}>{item.iconSeed}</Text>
            </View>

            <View style={styles.groupContent}>
              <View style={styles.groupHeaderRow}>
                <Text style={styles.groupName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.membersPill}>
                  <Users size={11} color={Colors.purple} />
                  <Text style={styles.membersCount}>
                    {item.members.length} {item.members.length === 1 ? 'peer' : 'peers'}
                  </Text>
                </View>
              </View>

              <Text style={styles.snippetText} numberOfLines={1}>
                {item.lastMessageSnippet || 'No messages yet'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Users size={36} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Mesh Groups Created</Text>
            <Text style={styles.emptyDesc}>
              Create an offline group to communicate with multiple nearby or relayed peers simultaneously.
            </Text>
            <TouchableOpacity
              style={styles.emptyJoinBtn}
              onPress={() => router.push('/scan?type=group')}
            >
              <ScanLine size={16} color={Colors.purple} />
              <Text style={styles.emptyJoinBtnText}>Join via Invite QR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.emptyCreateBtn}
              onPress={() => router.push('/group/create')}
            >
              <Plus size={16} color={Colors.background} />
              <Text style={styles.emptyCreateBtnText}>Create Offline Group</Text>
            </TouchableOpacity>
          </View>
        }
      />

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
          style={styles.navItem}
          onPress={() => router.push('/chats')}
        >
          <MessageSquare size={20} color={Colors.textSecondary} />
          <Text style={styles.navText}>Direct Chats</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, styles.navItemActive]}
          onPress={() => router.push('/groups')}
        >
          <Users size={20} color={Colors.purple} />
          <Text style={[styles.navText, { color: Colors.purple }]}>Groups</Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  bannerTextCol: {
    flex: 1,
    marginRight: 12,
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
    lineHeight: 16,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.purple,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createBtnText: {
    color: Colors.background,
    fontSize: 13,
    fontWeight: 'bold',
  },
  bannerBtnCol: {
    gap: 8,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.purple,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  joinBtnText: {
    color: Colors.purple,
    fontSize: 13,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  groupIconText: {
    color: Colors.purple,
    fontSize: 18,
    fontWeight: 'bold',
  },
  groupContent: {
    flex: 1,
    marginLeft: 14,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  membersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.purpleGlow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  membersCount: {
    color: Colors.purple,
    fontSize: 10,
    fontWeight: '600',
  },
  snippetText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
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
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyJoinBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: Colors.purple,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  emptyJoinBtnText: {
    color: Colors.purple,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.purple,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyCreateBtnText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '700',
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
});
