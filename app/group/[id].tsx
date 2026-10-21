import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { SafeScreen } from '../../src/components/SafeScreen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { MessageBubble } from '../../src/components/MessageBubble';
import { QrDisplay } from '../../src/components/QrDisplay';
import { useGroupStore } from '../../src/stores/groupStore';
import { useIdentityStore } from '../../src/stores/identityStore';
import { GroupManager } from '../../src/services/group/GroupManager';
import { createGroupInviteQrString } from '../../src/services/crypto/qr';
import {
  ArrowLeft,
  Send,
  Users,
  Shield,
  KeyRound,
  X,
  Share2,
} from 'lucide-react-native';

export default function GroupChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = Array.isArray(id) ? id[0] : id || '';

  const { activeGroup, activeGroupMessages, setActiveGroup, sendGroupMessage } = useGroupStore();
  const profile = useIdentityStore((s) => s.profile);

  const [inputText, setInputText] = useState('');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (groupId) {
      setActiveGroup(groupId);
    }
  }, [groupId]);

  const handleSend = async () => {
    if (!inputText.trim() || !activeGroup) return;
    const text = inputText.trim();
    setInputText('');
    await sendGroupMessage(activeGroup.id, text);
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const handleRotateKey = async () => {
    if (!activeGroup) return;
    Alert.alert(
      'Rotate Group Key',
      'Rotating the group encryption key creates a new cryptographic epoch. Stale keys will no longer be able to decrypt future mesh packets. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rotate Key',
          style: 'destructive',
          onPress: async () => {
            await GroupManager.getInstance().rotateKey(activeGroup.id);
            await setActiveGroup(activeGroup.id);
            Alert.alert('Key Rotated', 'Group encryption key updated to Epoch ' + (activeGroup.epoch + 1));
          },
        },
      ]
    );
  };

  if (!activeGroup) {
    return (
      <SafeScreen>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.groupNameText}>Loading Group...</Text>
        </View>
      </SafeScreen>
    );
  }

  const qrString = createGroupInviteQrString(activeGroup);

  return (
    <SafeScreen>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.titleCol}>
          <Text style={styles.groupNameText} numberOfLines={1}>
            {activeGroup.name}
          </Text>
          <View style={styles.metaRow}>
            <Share2 size={11} color={Colors.purple} />
            <Text style={styles.metaText}>
              Mesh Room · Epoch {activeGroup.epoch}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.membersBtn}
          onPress={() => setShowMembersModal(true)}
        >
          <Users size={18} color={Colors.purple} />
          <Text style={styles.membersBtnText}>{activeGroup.members.length}</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={activeGroupMessages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <MessageBubble message={item} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.groupIconCircle}>
              <Users size={32} color={Colors.purple} />
            </View>
            <Text style={styles.emptyTitle}>Group Mesh Initialized</Text>
            <Text style={styles.emptyDesc}>
              Messages sent here are symmetrically encrypted with the group key and flooded across nearby and multi-hop Bluetooth relay nodes.
            </Text>
          </View>
        }
      />

      {/* Composer */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.composerContainer}>
          <TextInput
            style={styles.composerInput}
            placeholder="Broadcast group message..."
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              !inputText.trim() && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Send size={18} color={Colors.background} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Members & Security Modal */}
      <Modal
        visible={showMembersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Group Details & Security</Text>
              <TouchableOpacity onPress={() => setShowMembersModal(false)}>
                <X size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.qrSection}>
              <View style={styles.qrPlaceholder}>
                <QrDisplay value={qrString} size={170} />
                <Text style={styles.qrText}>Offline Group Invite QR</Text>
                <Text style={styles.qrPayload} numberOfLines={2}>
                  {qrString}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionHeader}>Members ({activeGroup.members.length})</Text>
            <FlatList
              data={activeGroup.members}
              keyExtractor={(m) => m.id}
              style={{ maxHeight: 180 }}
              renderItem={({ item }) => (
                <View style={styles.memberRow}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {item.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.memberName}>{item.displayName}</Text>
                    <Text style={styles.memberRole}>
                      {item.role === 'owner' ? 'Owner / Key Authority' : 'Member'}
                    </Text>
                  </View>
                </View>
              )}
            />

            <TouchableOpacity
              style={styles.rotateKeyBtn}
              onPress={handleRotateKey}
            >
              <KeyRound size={16} color={Colors.warning} />
              <Text style={styles.rotateKeyBtnText}>Rotate Encryption Key</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  titleCol: {
    flex: 1,
  },
  groupNameText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  membersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.purpleGlow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  membersBtnText: {
    color: Colors.purple,
    fontSize: 12,
    fontWeight: '700',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  groupIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  composerInput: {
    flex: 1,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrPlaceholder: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    width: '100%',
  },
  qrText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  qrPayload: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  sectionHeader: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    color: Colors.purple,
    fontSize: 13,
    fontWeight: 'bold',
  },
  memberName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  memberRole: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  rotateKeyBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: Colors.warning,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  rotateKeyBtnText: {
    color: Colors.warning,
    fontSize: 13,
    fontWeight: '700',
  },
});
