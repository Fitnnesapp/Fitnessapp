import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useHealthSync } from '@/lib/storage/health-sync-store';

type Line = { icon: ComponentProps<typeof Ionicons>['name']; text: string };

/**
 * Was mit den Daten passiert, in vier Sätzen. Vertrauen senkt das wahrgenommene Risiko und ist
 * damit Teil des Nutzens (siehe docs/design-psychologie.md).
 */
export function PrivacyCard() {
  const theme = useTheme();
  const healthConnected = useHealthSync((state) => state.connectedAt !== null);

  const lines: Line[] = [
    { icon: 'phone-portrait-outline', text: 'Alle Trainings, Strecken und Angaben liegen nur auf diesem Gerät. Es gibt kein Konto und keinen Server.' },
    { icon: 'cloud-download-outline', text: 'Aus dem Internet lädt die App nur die öffentliche Event-Liste und App-Updates. Dabei wird nichts über dich gesendet.' },
    {
      icon: 'heart-outline',
      text: healthConnected
        ? 'Apple Health ist verbunden: Deine Einheiten gehen in die Health-App auf diesem iPhone, gelesen wird nichts.'
        : 'Apple Health ist nicht verbunden. Wenn du es verbindest, gehen Einheiten nur in die Health-App, gelesen wird nichts.',
    },
    { icon: 'trash-outline', text: 'Mit „Alle Daten löschen“ ist alles weg. Vorher kannst du eine Sicherung als Datei mitnehmen.' },
  ];

  return (
    <Card>
      <AppText variant="heading">Deine Daten</AppText>
      {lines.map((line) => (
        <View key={line.icon} style={styles.row}>
          <Ionicons name={line.icon} size={18} color={theme.accent} style={styles.icon} />
          <AppText variant="caption" color="textSecondary" style={styles.flex}>
            {line.text}
          </AppText>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  icon: { marginTop: 1 },
  flex: { flex: 1 },
});
