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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { MessageBubble } from '../../src/components/MessageBubble';
import { ConnectionBadge } from '../../src/components/ConnectionBadge';
import { useChatStore } from '../../src/stores/chatStore';
import { useBleStore } from '../../src/stores/bleStore';
import { useIdentityStore } from '../../src/stores/identityStore';
import { getSafetyNumber } from '../../src/services/crypto/keys';
import { BleService } from '../../src/services/ble/BleService';
import {
  ArrowLeft,
  Send,
  ShieldCheck,
  Radio,
  Smile,
  Shield,
  Info,
} from 'lucide-react-native';

export default function DirectChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const peerId = Array.isArray(id) ? id[0] : id || '';

  const { activeMessages, sendMessage, addReaction, setActiveConversation } = useChatStore();
  const { connectedPeers, discoveredPeers } = useBleStore();
  const { profile, keys } = useIdentityStore();

  const [inputText, setInputText] = useState('');
  const [showEmojiBar, setShowEmojiBar] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const isConnected = connectedPeers.includes(peerId);
  const peerInfo = discoveredPeers.find((p) => p.id === peerId);
  const peerName = peerInfo?.name || `Peer ${peerId.substring(0, 6)}`;

  useEffect(() => {
    if (peerId) {
      setActiveConversation(peerId);
    }
  }, [peerId]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    await sendMessage(peerId, peerName, text);
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const handleShowSafetyNumber = () => {
    if (!keys || !profile) return;
    const peerPub = BleService.getInstance().getPeerPublicKey(peerId) || peerInfo?.publicKey || 'DemoKey';
    const code = getSafetyNumber(keys.encryption.publicKey, peerPub);

    Alert.alert(
      'Encrypted Identity Verification',
      `Safety Number with ${peerName}:\n\n${code}\n\nCompare this 6-digit code with your peer to verify that no intermediate relay node is intercepting or tampering with your messages.`
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.titleCol}>
          <View style={styles.titleRow}>
            <Text style={styles.peerNameText} numberOfLines={1}>
              {peerName}
            </Text>
            <TouchableOpacity onPress={handleShowSafetyNumber}>
              <ShieldCheck size={16} color={Colors.success} />
            </TouchableOpacity>
          </View>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.statusDot,
                isConnected ? styles.dotConnected : styles.dotOffline,
              ]}
            />
            <Text style={styles.statusText}>
              {isConnected ? 'BLE Connected' : 'Store & Forward Mesh'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.safetyBtn} onPress={handleShowSafetyNumber}>
          <Info size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={activeMessages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            onLongPress={() => setShowEmojiBar(showEmojiBar === item.id ? null : item.id)}
            onSelectReaction={(emoji) => {
              addReaction(item.id, emoji);
              setShowEmojiBar(null);
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.shieldIcon}>
              <Shield size={32} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>End-to-End Encrypted Session</Text>
            <Text style={styles.emptyDesc}>
              Messages sent in this session are encrypted with X25519 & ChaCha20-Poly1305. If disconnected, messages stay securely queued on your device until in radio proximity.
            </Text>
          </View>
        }
      />

      {/* Quick Reaction Bar */}
      {showEmojiBar && (
        <View style={styles.emojiBar}>
          {['👍', '❤️', '🔥', '🚀', '🔒', '👀'].map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.emojiBtn}
              onPress={() => {
                addReaction(showEmojiBar, emoji);
                setShowEmojiBar(null);
              }}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input Composer */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.composerContainer}>
          <TextInput
            style={styles.composerInput}
            placeholder="Type encrypted message..."
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  peerNameText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotConnected: {
    backgroundColor: Colors.success,
  },
  dotOffline: {
    backgroundColor: Colors.warning,
  },
  statusText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  safetyBtn: {
    padding: 6,
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
  shieldIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderActive,
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
  emojiBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  emojiBtn: {
    padding: 6,
  },
  emojiText: {
    fontSize: 20,
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
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
