import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  FlatList,
} from 'react-native';
import { SafeScreen } from '../src/components/SafeScreen';
import { useRouter } from 'expo-router';
import { Colors } from '../src/theme/colors';
import { Header } from '../src/components/Header';
import { MeshTopologyMap } from '../src/components/MeshTopologyMap';
import { useMeshStore } from '../src/stores/meshStore';
import { useIdentityStore } from '../src/stores/identityStore';
import { MeshRouter } from '../src/services/mesh/MeshRouter';
import {
  ArrowLeft,
  Share2,
  BatteryCharging,
  Zap,
  Route,
  Activity,
  RefreshCw,
} from 'lucide-react-native';

export default function MeshScreen() {
  const router = useRouter();
  const { diagnostics, routes, refreshDiagnostics, setBatterySaver } = useMeshStore();
  const profile = useIdentityStore((s) => s.profile);
  const [batterySaverEnabled, setBatterySaverEnabled] = useState(false);
  const [simulatingHop, setSimulatingHop] = useState(false);

  useEffect(() => {
    refreshDiagnostics();
    const interval = setInterval(() => {
      refreshDiagnostics();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleBattery = (val: boolean) => {
    setBatterySaverEnabled(val);
    setBatterySaver(val);
  };

  const handleSimulateMeshRelay = async () => {
    setSimulatingHop(true);
    // Send a test broadcast packet across mesh router
    await MeshRouter.getInstance().originateMeshPacket('*', JSON.stringify({ type: 'PING', msg: 'Mesh ping' }));
    refreshDiagnostics();
    setTimeout(() => {
      setSimulatingHop(false);
    }, 600);
  };

  return (
    <SafeScreen>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mesh Network & Diagnostics</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={refreshDiagnostics}>
          <RefreshCw size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Interactive Visual Graph */}
        <MeshTopologyMap
          diagnostics={diagnostics}
          localName={profile?.displayName || 'Local Node'}
        />

        {/* Battery & Relay Policy Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <BatteryCharging size={18} color={Colors.warning} />
            <Text style={styles.cardTitle}>Battery-Aware Relay Policy</Text>
          </View>
          <Text style={styles.cardDesc}>
            When enabled, packet forwarding is automatically restricted during low battery to conserve device power.
          </Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Battery Saver (Throttle Relays)</Text>
            <Switch
              value={batterySaverEnabled}
              onValueChange={handleToggleBattery}
              trackColor={{ false: Colors.surfaceHighlight, true: Colors.warning }}
              thumbColor={batterySaverEnabled ? Colors.background : Colors.textSecondary}
            />
          </View>
        </View>

        {/* Test Flood Packet */}
        <TouchableOpacity
          style={styles.simBtn}
          onPress={handleSimulateMeshRelay}
          disabled={simulatingHop}
        >
          <Zap size={16} color={Colors.background} />
          <Text style={styles.simBtnText}>
            {simulatingHop ? 'Broadcasting Ping...' : 'Transmit Test Mesh Packet'}
          </Text>
        </TouchableOpacity>

        {/* Routing Table */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Route size={18} color={Colors.primary} />
            <Text style={styles.cardTitle}>
              Dynamic Routing Table ({routes.length})
            </Text>
          </View>

          {routes.length === 0 ? (
            <View style={styles.emptyRoute}>
              <Text style={styles.emptyRouteText}>
                No multi-hop routes discovered yet. Routes populate dynamically as packets are routed through relay nodes.
              </Text>
            </View>
          ) : (
            routes.map((r, i) => (
              <View key={i} style={styles.routeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.destText}>Dest: {r.peerId.substring(0, 16)}</Text>
                  <Text style={styles.nextHopText}>Next Hop: {r.nextHopPeerId.substring(0, 16)}</Text>
                </View>
                <View style={styles.hopPill}>
                  <Text style={styles.hopPillText}>{r.hopCount} {r.hopCount === 1 ? 'hop' : 'hops'}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  refreshBtn: {
    padding: 6,
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
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  cardDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  switchLabel: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  simBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  simBtnText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyRoute: {
    paddingVertical: 12,
  },
  emptyRouteText: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  destText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  nextHopText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  hopPill: {
    backgroundColor: Colors.purpleGlow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  hopPillText: {
    color: Colors.purple,
    fontSize: 11,
    fontWeight: '700',
  },
});
