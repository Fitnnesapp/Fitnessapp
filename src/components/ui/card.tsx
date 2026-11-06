import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Vorlesetext für Screenreader, wenn die Karte tippbar ist */
  accessibilityLabel?: string;
};

export function Card({ children, onPress, style, accessibilityLabel }: CardProps) {
  const theme = useTheme();
  const base = [
    styles.card,
    { backgroundColor: theme.surface, borderColor: theme.border },
    // Im Hellmodus trennt ein weicher Schatten die Karte vom Hintergrund, im Dunkelmodus der Rahmen
    theme.scheme === 'light' ? styles.lifted : null,
    style,
  ];

  if (!onPress) {
    return <View style={base}>{children}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.four,
    borderRadius: Radius.large,
    borderWidth: 1,
    gap: Spacing.two,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  lifted: { boxShadow: '0 6px 20px rgba(11, 13, 16, 0.07)' },
});
