import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { requestTrackingPermission } from '@/lib/location/tracker';
import { useRunStore } from '@/lib/storage/run-store';

export default function RunningScreen() {
  const router = useRouter();
  const active = useRunStore((state) => state.active);
  const startRun = useRunStore((state) => state.startRun);

  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    try {
      // Die Berechtigung wird erst jetzt angefragt, wo der Zweck klar ist
      const result = await requestTrackingPermission();
      if (result === 'denied') {
        setDenied(true);
        return;
      }
      setDenied(false);
      startRun();
      router.push('/training/run');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <AppText variant="display">Running</AppText>

      {active ? (
        <Card>
          <AppText variant="label" color="accent">
            LAUF LÄUFT
          </AppText>
          <AppText color="textSecondary">Du hast einen angefangenen Lauf. Die Aufzeichnung geht dort weiter.</AppText>
          <Button title="Zum Lauf" onPress={() => router.push('/training/run')} />
        </Card>
      ) : (
        <>
          <Card>
            <AppText variant="heading">Wozu brauchen wir deinen Standort?</AppText>
            <AppText color="textSecondary">
              Nur während eines Laufs zeichnet die App deine Strecke per GPS auf, um Distanz, Tempo und Höhenmeter zu
              berechnen. Die Daten bleiben auf deinem Handy.
            </AppText>
            <AppText color="textSecondary">
              Damit die Aufzeichnung auch bei gesperrtem Bildschirm weiterläuft, wähle bei der Abfrage „Immer erlauben“
              (iOS) bzw. „Immer zulassen“ (Android). Mit „Nur bei Nutzung“ läuft sie nur, solange die App offen ist.
            </AppText>
          </Card>

          {denied ? (
            <Card>
              <AppText color="danger" accessibilityRole="alert">
                Ohne Standortfreigabe kann kein Lauf aufgezeichnet werden.
              </AppText>
              {Platform.OS !== 'web' ? (
                <Button title="Einstellungen öffnen" variant="secondary" onPress={() => Linking.openSettings()} />
              ) : null}
            </Card>
          ) : null}

          <Button title="Lauf starten" loading={busy} onPress={start} />
        </>
      )}
    </Screen>
  );
}
