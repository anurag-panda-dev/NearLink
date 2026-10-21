import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeScreen } from '../src/components/SafeScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../src/theme/colors';
import { classifyQrString, QrScanResult } from '../src/services/crypto/qr';
import { useContactStore } from '../src/stores/contactStore';
import { useGroupStore } from '../src/stores/groupStore';
import {
  ArrowLeft,
  ScanLine,
  Keyboard,
  UserPlus,
  Users,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react-native';

/**
 * Universal QR scanner route.
 *
 * Handles any QR code: NearLink identity QRs (add peer), NearLink group invite
 * QRs (join group), damaged NearLink QRs and foreign QR codes. Scanning and
 * decoding happen entirely on-device.
 */
export default function ScanQrScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const addContactFromIdentity = useContactStore((s) => s.addContactFromIdentity);
  const joinGroupFromInvite = useGroupStore((s) => s.joinGroupFromInvite);

  // Guards against the scanner firing several times for the same code
  const lockRef = useRef(false);
  const [pending, setPending] = useState<QrScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawPreview, setRawPreview] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [manualValue, setManualValue] = useState('');

  const hintTitle =
    type === 'identity' ? 'Scan Identity QR' : type === 'group' ? 'Scan Group Invite QR' : 'Scan Any QR';
  const hintDesc =
    type === 'identity'
      ? "Add a peer's cryptographic identity to start an encrypted chat."
      : type === 'group'
      ? 'Join a mesh group using its invite QR code.'
      : 'Identity QRs add a peer, group QRs join a mesh room.';

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission?.granted, permission?.canAskAgain, requestPermission]);

  const handleScanned = useCallback((raw: string) => {
    const result = classifyQrString(raw);

    if (result.kind === 'identity' || result.kind === 'group_invite') {
      lockRef.current = true;
      setError(null);
      setPending(result);
      return;
    }

    setError(
      result.kind === 'invalid'
        ? 'This NearLink QR code looks damaged. Ask your peer to reopen and reshare it.'
        : 'Not a NearLink QR code.'
    );
    setRawPreview(result.raw);
  }, []);

  const onBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (lockRef.current) return;
      handleScanned(data);
    },
    [handleScanned]
  );

  const handleAddPeer = async () => {
    if (pending?.kind !== 'identity') return;
    const contact = await addContactFromIdentity(pending.payload);
    setPending(null);
    router.replace(`/chat/${contact.id}`);
  };

  const handleJoinGroup = async () => {
    if (pending?.kind !== 'group_invite') return;
    const group = await joinGroupFromInvite(pending.payload);
    setPending(null);
    router.replace(`/group/${group.id}`);
  };

  const handleScanAgain = () => {
    setPending(null);
    setError(null);
    lockRef.current = false;
  };

  const handleManualSubmit = () => {
    const value = manualValue.trim();
    if (!value) return;
    setShowManual(false);
    setManualValue('');
    handleScanned(value);
  };

  const renderCameraArea = () => {
    if (!permission) {
      return <Text style={styles.statusText}>Preparing camera…</Text>;
    }

    if (!permission.granted) {
      return (
        <View style={styles.permCard}>
          <ShieldCheck size={30} color={Colors.primary} />
          <Text style={styles.permTitle}>Camera access needed</Text>
          <Text style={styles.permDesc}>
            NearLink scans QR codes entirely on-device. No camera image is ever stored or sent
            anywhere — it is an offline app.
          </Text>
          {permission.canAskAgain ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => requestPermission()}>
              <Text style={styles.primaryBtnText}>Enable Camera</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                if (Platform.OS !== 'web') Linking.openSettings();
              }}
            >
              <Text style={styles.primaryBtnText}>Open Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onBarcodeScanned}
      />
    );
  };

  return (
    <SafeScreen>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCol}>
          <Text style={styles.headerTitle}>{hintTitle}</Text>
          <Text style={styles.headerSub}>{hintDesc}</Text>
        </View>
      </View>

      {/* Camera / permission area */}
      <View style={styles.cameraWrap}>
        {renderCameraArea()}

        {permission?.granted && (
          <View pointerEvents="none" style={styles.scanOverlay}>
            <View style={styles.scanFrame}>
              <ScanLine size={26} color={Colors.primary} />
            </View>
            <Text style={styles.scanHint}>Point at a NearLink QR code</Text>
          </View>
        )}
      </View>

      {/* Feedback for non-NearLink / damaged codes */}
      {error && !pending && (
        <View style={styles.errorBanner}>
          <AlertTriangle size={16} color={Colors.warning} />
          <View style={styles.errorCol}>
            <Text style={styles.errorText}>{error}</Text>
            {rawPreview ? (
              <Text style={styles.rawPreview} numberOfLines={2}>
                {rawPreview}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.errorDismiss}>OK</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Manual entry — also covers devices without a camera / BarcodeDetector */}
      <View style={styles.footer}>
        {showManual && (
          <View style={styles.manualPanel}>
            <TextInput
              style={styles.manualInput}
              placeholder="nearlink://identity?data=… or nearlink://group?data=…"
              placeholderTextColor={Colors.textMuted}
              value={manualValue}
              onChangeText={setManualValue}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
            />
            <TouchableOpacity
              style={[styles.primaryBtn, !manualValue.trim() && styles.btnDisabled]}
              onPress={handleManualSubmit}
              disabled={!manualValue.trim()}
            >
              <Text style={styles.primaryBtnText}>Decode & Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.manualToggle} onPress={() => setShowManual((v) => !v)}>
          <Keyboard size={15} color={Colors.textSecondary} />
          <Text style={styles.manualToggleText}>Enter code manually</Text>
        </TouchableOpacity>
      </View>

      {/* Confirmation modal */}
      <Modal visible={pending !== null} animationType="fade" transparent onRequestClose={handleScanAgain}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {pending?.kind === 'identity' && (
              <>
                <View style={[styles.kindBadge, styles.badgeIdentity]}>
                  <UserPlus size={16} color={Colors.primary} />
                  <Text style={styles.kindBadgeTextIdentity}>Identity QR</Text>
                </View>

                <View style={styles.confirmAvatar}>
                  <Text style={styles.confirmAvatarText}>
                    {pending.payload.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.confirmName}>{pending.payload.name}</Text>
                <Text style={styles.confirmLabel}>Peer ID</Text>
                <Text style={styles.confirmValue}>{pending.payload.id}</Text>
                <Text style={styles.confirmNote}>
                  Their public key will be stored on this device. Compare the safety number in
                  person to rule out any impersonation.
                </Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={handleScanAgain}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmBtn} onPress={handleAddPeer}>
                    <UserPlus size={15} color={Colors.background} />
                    <Text style={styles.confirmBtnText}>Add & Message</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {pending?.kind === 'group_invite' && (
              <>
                <View style={[styles.kindBadge, styles.badgeGroup]}>
                  <Users size={16} color={Colors.purple} />
                  <Text style={styles.kindBadgeTextGroup}>Group Invite QR</Text>
                </View>

                <Text style={styles.confirmName}>{pending.payload.groupName}</Text>
                <Text style={styles.confirmLabel}>Group ID</Text>
                <Text style={styles.confirmValue}>{pending.payload.groupId}</Text>
                <Text style={styles.confirmLabel}>Key Epoch</Text>
                <Text style={styles.confirmValue}>{pending.payload.epoch}</Text>
                <Text style={styles.confirmNote}>
                  Joining downloads the shared group encryption key from this invite. Anyone holding
                  this QR can join — share it only with people you trust.
                </Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={handleScanAgain}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.confirmBtn, styles.confirmBtnGroup]} onPress={handleJoinGroup}>
                    <Users size={15} color={Colors.background} />
                    <Text style={styles.confirmBtnText}>Join Group</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  headerCol: {
    flex: 1,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  cameraWrap: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 236,
    height: 236,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanHint: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  statusText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  permCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: 20,
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  permTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  permDesc: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  errorCol: {
    flex: 1,
  },
  errorText: {
    color: Colors.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  rawPreview: {
    color: Colors.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 3,
  },
  errorDismiss: {
    color: Colors.warning,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  footer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  manualToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  manualToggleText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  manualPanel: {
    marginBottom: 10,
  },
  manualInput: {
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 13,
    fontFamily: 'monospace',
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 10,
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
  kindBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 14,
  },
  badgeIdentity: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.35)',
  },
  badgeGroup: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  kindBadgeTextIdentity: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  kindBadgeTextGroup: {
    color: Colors.purple,
    fontSize: 11,
    fontWeight: '700',
  },
  confirmAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmAvatarText: {
    color: Colors.primary,
    fontSize: 26,
    fontWeight: 'bold',
  },
  confirmName: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  confirmLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 2,
  },
  confirmValue: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  confirmNote: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceHighlight,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1.4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  confirmBtnGroup: {
    backgroundColor: Colors.purple,
  },
  confirmBtnText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
});
