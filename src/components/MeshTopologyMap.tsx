import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { MeshDiagnostics } from '../types/mesh';
import { Radio, ShieldCheck, Activity, Share2 } from 'lucide-react-native';

interface MeshTopologyMapProps {
  diagnostics: MeshDiagnostics;
  localName: string;
}

export const MeshTopologyMap: React.FC<MeshTopologyMapProps> = ({
  diagnostics,
  localName,
}) => {
  const nodes = diagnostics.meshNodes;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Share2 size={18} color={Colors.purple} />
          <Text style={styles.title}>BLE Mesh Network Topology</Text>
        </View>
        <View style={styles.activePill}>
          <Activity size={12} color={Colors.primary} />
          <Text style={styles.activePillText}>
            {diagnostics.activeNeighbors} Direct · {diagnostics.knownRoutesCount} Mesh Routes
          </Text>
        </View>
      </View>

      {/* Visual Canvas Representation */}
      <View style={styles.canvas}>
        {/* Background Grid Lines */}
        <View style={styles.radarRing1} />
        <View style={styles.radarRing2} />

        {/* Local Node (Center) */}
        <View style={styles.centerNode}>
          <View style={styles.centerNodePulse} />
          <Radio size={16} color={Colors.primary} />
          <Text style={styles.nodeLabel} numberOfLines={1}>
            {localName} (You)
          </Text>
        </View>

        {/* Simulated Outer Nodes */}
        {nodes.length === 0 ? (
          <View style={styles.emptyNote}>
            <Text style={styles.emptyText}>
              Scan nearby to discover peer nodes and form a multi-hop mesh.
            </Text>
          </View>
        ) : (
          <View style={styles.nodesContainer}>
            {nodes.slice(0, 5).map((node, idx) => {
              const isDirect = node.direct;
              const angle = (idx * (360 / Math.max(nodes.length, 3))) * (Math.PI / 180);
              const radius = isDirect ? 85 : 120;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <View
                  key={node.id}
                  style={[
                    styles.meshNode,
                    {
                      transform: [{ translateX: x }, { translateY: y }],
                      borderColor: isDirect ? Colors.success : Colors.purple,
                      backgroundColor: isDirect
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(139, 92, 246, 0.15)',
                    },
                  ]}
                >
                  <Text style={styles.meshNodeInitial}>
                    {node.name.charAt(0)}
                  </Text>
                  <View style={styles.nodeBadge}>
                    <Text style={styles.nodeBadgeText}>
                      {node.hopDistance} {node.hopDistance === 1 ? 'hop' : 'hops'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Metrics Row */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{diagnostics.totalPacketsReceived}</Text>
          <Text style={styles.statLabel}>Rx Packets</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: Colors.purple }]}>
            {diagnostics.totalPacketsForwarded}
          </Text>
          <Text style={styles.statLabel}>Relayed</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: Colors.warning }]}>
            {diagnostics.totalPacketsDroppedDuplicates}
          </Text>
          <Text style={styles.statLabel}>Deduped</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: Colors.success }]}>
            {diagnostics.queueDepth}
          </Text>
          <Text style={styles.statLabel}>Queue</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activePillText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  canvas: {
    height: 220,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  radarRing1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.1)',
  },
  radarRing2: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  centerNode: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  centerNodePulse: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryGlow,
  },
  nodeLabel: {
    position: 'absolute',
    bottom: -18,
    color: Colors.textPrimary,
    fontSize: 10,
    fontWeight: '600',
    width: 90,
    textAlign: 'center',
  },
  nodesContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  meshNode: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  meshNodeInitial: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  nodeBadge: {
    position: 'absolute',
    bottom: -14,
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  nodeBadgeText: {
    color: Colors.textSecondary,
    fontSize: 8,
    fontWeight: '600',
  },
  emptyNote: {
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
});
