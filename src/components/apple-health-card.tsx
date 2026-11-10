import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appleHealthAvailability, requestAppleHealthAccess } from '@/lib/health/apple-health';
import { formatDate } from '@/lib/logic/format';
import { useHealthSync } from '@/lib/storage/health-sync-store';

/** Einheiten nach Apple Health übertragen: Nutzen erklären, verbinden, Status zeigen, trennen. */
export function AppleHealthCard() {
  const theme = useTheme();
  const connectedAt = useHealthSync((state) => state.connectedAt);
  const exportedCount = useHealthSync((state) => Object.keys(state.exported).length);
  const lastSyncAt = useHealthSync((state) => state.lastSyncAt);
  const lastError = useHealthSync((state) => state.lastError);
  const connect = useHealthSync((state) => state.connect);
  const disconnect = useHealthSync((state) => state.disconnect);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);
  const availability = appleHealthAvailability();

  async function onConnect() {
    setBusy(true);
    try {
      const granted = await requestAppleHealthAccess();
      setDenied(!granted);
      // Die letzten 7 Tage gleich mitnehmen, damit die Ringe der Woche stimmen
      if (granted) connect(Date.now(), 7);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <View style={styles.head}>
        <Ionicons name="heart-circle" size={24} color={theme.accent} />
        <AppText variant="heading" style={styles.flex}>
          Apple Health
        </AppText>
        {connectedAt !== null ? (
          <AppText variant="label" color="accent">
            VERBUNDEN
          </AppText>
        ) : null}
      </View>

      <AppText color="textSecondary">
        Deine Workouts, Läufe und Radtouren erscheinen in der Health-App, inklusive Strecke, und zählen dort für deine
        Aktivitätsringe. Übertragen wird nur in Richtung Health; die App liest keine Gesundheitsdaten aus.
      </AppText>

      {availability === 'not-ios' ? (
        <AppText variant="caption" color="textSecondary">
          Apple Health gibt es nur auf dem iPhone. Auf diesem Gerät ist die Verbindung nicht verfügbar.
        </AppText>
      ) : availability === 'needs-app-build' ? (
        <AppText variant="caption" color="textSecondary">
          Funktioniert in der installierten App aus dem App Store bzw. TestFlight, nicht in Expo Go.
        </AppText>
      ) : connectedAt !== null ? (
        <>
          <AppText variant="caption" color="textSecondary">
            {exportedCount} {exportedCount === 1 ? 'Einheit' : 'Einheiten'} übertragen
            {lastSyncAt ? `, zuletzt am ${formatDate(lastSyncAt)}` : ''}. Neue Einheiten folgen automatisch.
          </AppText>
          {lastError ? (
            <AppText variant="caption" color="danger" accessibilityRole="alert">
              {lastError}
            </AppText>
          ) : null}
          <Button title="Verbindung trennen" variant="ghost" onPress={disconnect} />
        </>
      ) : (
        <>
          <Button title="Mit Apple Health verbinden" onPress={() => void onConnect()} loading={busy} />
          {denied ? (
            <AppText variant="caption" color="danger" accessibilityRole="alert">
              Keine Freigabe erhalten. Du kannst sie in der Health-App unter Profil → Apps → Fitnessapp erteilen.
            </AppText>
          ) : null}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
});
