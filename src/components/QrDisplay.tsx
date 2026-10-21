import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../theme/colors';

interface QrDisplayProps {
  /** Full payload string — typically from createIdentityQrString / createGroupInviteQrString */
  value: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Renders a real, scannable QR code on a light card.
 * Dark modules on a white background keep contrast high for camera scanners.
 */
export const QrDisplay: React.FC<QrDisplayProps> = ({ value, size = 180, style }) => (
  <View style={[styles.frame, style]}>
    <QRCode
      value={value}
      size={size}
      color={Colors.background}
      backgroundColor="#FFFFFF"
      ecl="M"
      quietZone={3}
    />
  </View>
);

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
