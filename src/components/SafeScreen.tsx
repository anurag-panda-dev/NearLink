import React from 'react';
import { StyleSheet, type ViewProps } from 'react-native';
import { SafeAreaView, type Edges } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

interface SafeScreenProps extends ViewProps {
  /** Safe-area edges to inset. Defaults to every edge (top, right, bottom, left). */
  edges?: Edges;
  /** How insets are applied — `padding` (default) or `margin`. */
  mode?: 'padding' | 'margin';
  children?: React.ReactNode;
}

/**
 * Shared screen container used by every route in `app/`.
 *
 * Applies device safe-area insets (status bar / notch, home indicator, rounded
 * corners) together with the app background color, so safe-area handling lives
 * in one place instead of being restyled per screen.
 */
export const SafeScreen: React.FC<SafeScreenProps> = ({ children, style, ...rest }) => (
  <SafeAreaView {...rest} style={[styles.safe, style]}>
    {children}
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
