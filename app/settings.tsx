import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../src/theme/colors';
import { useIdentityStore } from '../src/stores/identityStore';
import { createIdentityQrString } from '../src/services/crypto/qr';
import {
  ArrowLeft,
  User,
  Shield,
  Eye,
  Share2,
  Trash2,
  QrCode,
  Key,
  Check,
  X,
  Info,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    profile,
    updateDisplayName,
    toggleDiscoverability,
    toggleRelayOptIn,
    resetAccount,
  } = useIdentityStore();

  const [name, setName] = useState(profile?.displayName || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const handleSaveName = async () => {
    if (name.trim()) {
      await updateDisplayName(name.trim());
      setIsEditingName(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Clear All Local Data?',
      'This will irreversibly delete your local cryptographic keys, all conversation histories, contacts, and group rooms from this device. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe Everything',
          style: 'destructive',
          onPress: async () => {
            await resetAccount();
            router.replace('/');
          },
        },
      ]
    );
  };

  if (!profile) return null;

  const qrData = createIdentityQrString(profile);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings & Identity</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.nameBlock}>
              {isEditingName ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.nameInput}
                    value={name}
                    onChangeText={setName}
                    autoFocus
                  />
                  <TouchableOpacity style={styles.saveNameBtn} onPress={handleSaveName}>
                    <Check size={16} color={Colors.background} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.displayNameClick}
                  onPress={() => setIsEditingName(true)}
                >
                  <Text style={styles.displayName}>{profile.displayName}</Text>
                  <Text style={styles.editPrompt}>Tap to edit</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.fingerprintText}>ID: {profile.id}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.qrShareBtn}
            onPress={() => setShowQrModal(true)}
          >
            <QrCode size={18} color={Colors.primary} />
            <Text style={styles.qrShareBtnText}>Share Identity QR Code</Text>
          </TouchableOpacity>
        </View>

        {/* Visibility & Mesh Relaying */}
        <Text style={styles.sectionTitle}>Radio & Mesh Preferences</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextCol}>
              <View style={styles.settingIconTitle}>
                <Eye size={16} color={Colors.primary} />
                <Text style={styles.settingLabel}>Discoverable Mode</Text>
              </View>
              <Text style={styles.settingDesc}>
                Broadcast BLE advertisement to allow nearby peers to find and pair with you.
              </Text>
            </View>
            <Switch
              value={profile.isDiscoverable}
              onValueChange={toggleDiscoverability}
              trackColor={{ false: Colors.surfaceHighlight, true: Colors.primary }}
              thumbColor={profile.isDiscoverable ? Colors.background : Colors.textSecondary}
            />
          </View>

          <View style={[styles.settingRow, styles.borderTop]}>
            <View style={styles.settingTextCol}>
              <View style={styles.settingIconTitle}>
                <Share2 size={16} color={Colors.purple} />
                <Text style={styles.settingLabel}>Relay Opt-In</Text>
              </View>
              <Text style={styles.settingDesc}>
                Help route encrypted multi-hop mesh packets for peers outside direct radio range.
              </Text>
            </View>
            <Switch
              value={profile.relayOptIn}
              onValueChange={toggleRelayOptIn}
              trackColor={{ false: Colors.surfaceHighlight, true: Colors.purple }}
              thumbColor={profile.relayOptIn ? Colors.background : Colors.textSecondary}
            />
          </View>
        </View>

        {/* Cryptography Diagnostics */}
        <Text style={styles.sectionTitle}>Cryptographic Architecture</Text>
        <View style={styles.card}>
          <View style={styles.cryptoRow}>
            <Key size={16} color={Colors.success} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.cryptoTitle}>Public Encryption Key (X25519)</Text>
              <Text style={styles.cryptoVal} numberOfLines={1}>
                {profile.publicKey}
              </Text>
            </View>
          </View>

          <View style={[styles.cryptoRow, styles.borderTop]}>
            <Shield size={16} color={Colors.primary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.cryptoTitle}>Signing Public Key (Ed25519)</Text>
              <Text style={styles.cryptoVal} numberOfLines={1}>
                {profile.signingPublicKey}
              </Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <Text style={styles.sectionTitle}>Privacy & Storage</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.wipeBtn} onPress={handleReset}>
            <Trash2 size={16} color={Colors.danger} />
            <Text style={styles.wipeBtnText}>Delete Local Account & All Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* QR Modal */}
      <Modal
        visible={showQrModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowQrModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Identity QR</Text>
              <TouchableOpacity onPress={() => setShowQrModal(false)}>
                <X size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.qrBox}>
              <QrCode size={120} color={Colors.primary} />
              <Text style={styles.qrUser}>{profile.displayName}</Text>
              <Text style={styles.qrFingerprint}>{profile.id}</Text>
            </View>

            <Text style={styles.qrHelp}>
              Scan this QR code with another NearLink device to verify cryptographic identity fingerprints.
            </Text>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  nameBlock: {
    flex: 1,
    marginLeft: 14,
  },
  displayName: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  editPrompt: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  displayNameClick: {
    marginBottom: 4,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  nameInput: {
    flex: 1,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: Colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  saveNameBtn: {
    backgroundColor: Colors.primary,
    padding: 8,
    borderRadius: 8,
  },
  fingerprintText: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  qrShareBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  qrShareBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
    marginTop: 6,
  },
  settingTextCol: {
    flex: 1,
    marginRight: 16,
  },
  settingIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  settingLabel: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  settingDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  cryptoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  cryptoTitle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  cryptoVal: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  wipeBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: Colors.danger,
    paddingVertical: 12,
    borderRadius: 10,
  },
  wipeBtnText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  qrBox: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderActive,
    width: '100%',
    marginBottom: 14,
  },
  qrUser: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  qrFingerprint: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  qrHelp: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});
