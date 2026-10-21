import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../src/theme/colors';
import { useIdentityStore } from '../src/stores/identityStore';
import { Shield, Radio, Share2, Zap, Lock, ArrowRight, CheckCircle2 } from 'lucide-react-native';

export default function OnboardingScreen() {
  const router = useRouter();
  const { profile, isInitialized, createProfile } = useIdentityStore();
  const [displayName, setDisplayName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isInitialized && profile) {
      router.replace('/chats');
    }
  }, [isInitialized, profile, router]);

  const handleStart = async () => {
    if (!displayName.trim()) return;
    setIsGenerating(true);
    try {
      await createProfile(displayName.trim());
      router.replace('/nearby');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Header */}
          <View style={styles.heroSection}>
            <View style={styles.logoBadge}>
              <Radio size={36} color={Colors.primary} />
            </View>
            <Text style={styles.heroTitle}>NearLink</Text>
            <Text style={styles.heroSubtitle}>
              Offline Peer-to-Peer & Mesh Messenger
            </Text>
            <Text style={styles.promiseText}>
              Zero servers. Zero internet. Zero accounts. Direct device-to-device communication over Bluetooth Low Energy.
            </Text>
          </View>

          {/* Pillars */}
          <View style={styles.featuresCard}>
            <View style={styles.featureRow}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.primaryGlow }]}>
                <Lock size={18} color={Colors.primary} />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>End-to-End Encrypted</Text>
                <Text style={styles.featureDesc}>
                  Every message is encrypted with X25519 & ChaCha20-Poly1305. Only your recipient can read it.
                </Text>
              </View>
            </View>

            <View style={styles.featureRow}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.purpleGlow }]}>
                <Share2 size={18} color={Colors.purple} />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>Multi-Hop BLE Mesh</Text>
                <Text style={styles.featureDesc}>
                  Extend range across multiple devices with decentralized packet relaying and duplicate suppression.
                </Text>
              </View>
            </View>

            <View style={styles.featureRow}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.successGlow }]}>
                <Shield size={18} color={Colors.success} />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>Total Data Privacy</Text>
                <Text style={styles.featureDesc}>
                  No phone number, email, or cloud profile required. Identity keys are stored purely on this device.
                </Text>
              </View>
            </View>
          </View>

          {/* Identity Form */}
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>Choose your Display Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Alex, CyberPioneer, Node-42"
              placeholderTextColor={Colors.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              maxLength={24}
            />

            <View style={styles.securityNote}>
              <CheckCircle2 size={14} color={Colors.primary} />
              <Text style={styles.securityNoteText}>
                We will generate local Ed25519 signing and X25519 encryption key pairs.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                !displayName.trim() && styles.submitButtonDisabled,
              ]}
              onPress={handleStart}
              disabled={!displayName.trim() || isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator color={Colors.background} />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Generate Keys & Start</Text>
                  <ArrowRight size={18} color={Colors.background} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  heroTitle: {
    color: Colors.textPrimary,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  promiseText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
    paddingHorizontal: 15,
  },
  featuresCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  featureDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderActive,
  },
  formLabel: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.textPrimary,
    fontSize: 16,
    marginBottom: 12,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  securityNoteText: {
    color: Colors.textMuted,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
