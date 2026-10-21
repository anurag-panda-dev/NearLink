import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeScreen } from '../../src/components/SafeScreen';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { useGroupStore } from '../../src/stores/groupStore';
import { ArrowLeft, Users, Shield, KeyRound, CheckCircle2 } from 'lucide-react-native';

export default function CreateGroupScreen() {
  const router = useRouter();
  const createGroup = useGroupStore((s) => s.createGroup);

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    setIsSubmitting(true);
    try {
      const group = await createGroup(groupName.trim(), description.trim() || undefined);
      router.replace(`/group/${group.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeScreen>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Offline Group</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.iconSection}>
            <View style={styles.iconCircle}>
              <Users size={36} color={Colors.purple} />
            </View>
            <Text style={styles.sectionTitle}>Decentralized Mesh Room</Text>
            <Text style={styles.sectionSubtitle}>
              Groups allow encrypted multi-user messaging across connected and relayed Bluetooth nodes.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Group Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Field Team Alpha, Campus Grid"
              placeholderTextColor={Colors.textMuted}
              value={groupName}
              onChangeText={setGroupName}
              maxLength={32}
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Offline coordinating group for field activities"
              placeholderTextColor={Colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={140}
            />

            <View style={styles.infoBox}>
              <KeyRound size={16} color={Colors.purple} />
              <Text style={styles.infoText}>
                A 256-bit symmetric encryption key will be generated locally. Only authenticated members can decrypt messages.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.createButton,
                !groupName.trim() && styles.createButtonDisabled,
              ]}
              onPress={handleCreate}
              disabled={!groupName.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.background} />
              ) : (
                <Text style={styles.createButtonText}>Create Group & Key</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  kav: {
    flex: 1,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.purple,
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 15,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.purpleGlow,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginBottom: 20,
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  createButton: {
    backgroundColor: Colors.purple,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: Colors.background,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
