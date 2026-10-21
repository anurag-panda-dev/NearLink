import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface ConnectionBadgeProps {
  rssi?: number;
  isConnected?: boolean;
  isRelay?: boolean;
}

export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({
  rssi = -70,
  isConnected = false,
  isRelay = false,
}) => {
  // Convert RSSI into signal bars (1 to 4)
  let bars = 1;
  let signalLabel = 'Weak';
  let color = Colors.danger;

  if (rssi > -60) {
    bars = 4;
    signalLabel = 'Excellent';
    color = Colors.success;
  } else if (rssi > -70) {
    bars = 3;
    signalLabel = 'Good';
    color = Colors.primary;
  } else if (rssi > -80) {
    bars = 2;
    signalLabel = 'Fair';
    color = Colors.warning;
  }

  return (
    <View style={styles.container}>
      <View style={styles.barsContainer}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { height: 3 + i * 2.5 },
              i <= bars ? { backgroundColor: color } : styles.barInactive,
            ]}
          />
        ))}
      </View>
      <Text style={[styles.rssiText, { color }]}>{rssi} dBm</Text>
      {isRelay && (
        <View style={styles.relayTag}>
          <Text style={styles.relayTagText}>RELAY</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 14,
    gap: 2,
  },
  bar: {
    width: 3,
    borderRadius: 1,
  },
  barInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  rssiText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  relayTag: {
    backgroundColor: Colors.purpleGlow,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  relayTagText: {
    color: Colors.purple,
    fontSize: 9,
    fontWeight: 'bold',
  },
});
