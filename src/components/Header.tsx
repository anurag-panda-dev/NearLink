import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import { useBleStore } from '../stores/bleStore';
import { Radio, Share2, Settings as SettingsIcon, Users } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title = 'NearLink', subtitle }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isScanning, connectedPeers } = useBleStore();

  return (
    <View style={styles.container}>
      <View style={styles.titleColumn}>
        <View style={styles.logoRow}>
          <Text style={styles.brandTitle}>{title}</Text>
          <View style={styles.statusPill}>
            <View
              style={[
                styles.statusDot,
                isScanning
                  ? styles.dotScanning
                  : connectedPeers.length > 0
                  ? styles.dotConnected
                  : styles.dotIdle,
              ]}
            />
            <Text style={styles.statusText}>
              {isScanning
                ? 'Scanning'
                : connectedPeers.length > 0
                ? `${connectedPeers.length} Active Link`
                : 'Offline BLE'}
            </Text>
          </View>
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, pathname === '/groups' && styles.actionBtnActive]}
          onPress={() => router.push('/groups')}
        >
          <Users size={18} color={pathname === '/groups' ? Colors.primary : Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, pathname === '/mesh' && styles.actionBtnActive]}
          onPress={() => router.push('/mesh')}
        >
          <Share2 size={18} color={pathname === '/mesh' ? Colors.purple : Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, pathname === '/settings' && styles.actionBtnActive]}
          onPress={() => router.push('/settings')}
        >
          <SettingsIcon size={18} color={pathname === '/settings' ? Colors.primary : Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titleColumn: {
    flex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotScanning: {
    backgroundColor: Colors.primary,
  },
  dotConnected: {
    backgroundColor: Colors.success,
  },
  dotIdle: {
    backgroundColor: Colors.textMuted,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
});
