import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type LinkTileProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  text: string;
  onPress: () => void;
};

/** Kleine Kachel mit Symbol, Titel und Hinweis, die zu einem Unterbereich führt. */
export function LinkTile({ icon, title, text, onPress }: LinkTileProps) {
  const theme = useTheme();
  return (
    <Card onPress={onPress} style={styles.tile}>
      <Ionicons name={icon} size={22} color={theme.accent} />
      <AppText variant="heading">{title}</AppText>
      <AppText variant="caption" color="textSecondary">
        {text}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, padding: Spacing.three, gap: Spacing.one },
});
