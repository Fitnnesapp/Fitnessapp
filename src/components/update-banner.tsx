import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { applyAppUpdate, useUpdateStore } from '@/lib/updates';

/** Dezenter Hinweis, wenn eine neue Version geladen ist. Ohne Neustart startet sie beim nächsten Öffnen. */
export function UpdateBanner() {
  const theme = useTheme();
  const ready = useUpdateStore((state) => state.phase === 'ready');
  if (!ready) return null;
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Ionicons name="sparkles" size={20} color={theme.accent} />
        <AppText variant="heading" style={styles.flex}>
          Neue Version geladen
        </AppText>
      </View>
      <AppText color="textSecondary">Sie startet beim nächsten Öffnen. Oder jetzt mit einem Tipp.</AppText>
      <Button title="Jetzt neu starten" variant="secondary" onPress={() => void applyAppUpdate()} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
});
