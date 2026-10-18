import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { confirmAction } from '@/lib/confirm';
import { kgToDisplay, displayToKg, parseNumber, weightUnitLabel } from '@/lib/logic/units';
import { useHomeSessions } from '@/lib/storage/home-store';
import { requestReminderPermission, remindersSupported } from '@/lib/notifications';
import { useGamification } from '@/lib/storage/gamification-store';
import { useRunStore } from '@/lib/storage/run-store';
import { useSettings, type UnitsPreference } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';

const UNITS: { value: UnitsPreference; label: string }[] = [
  { value: 'metric', label: 'Metrisch (kg, km)' },
  { value: 'imperial', label: 'Imperial (lb, mi)' },
];

export default function ProfileScreen() {
  const { displayName, units, bodyWeightKg, setDisplayName, setUnits, setBodyWeightKg, reset: resetSettings } = useSettings();
  const resetHome = useHomeSessions((state) => state.reset);
  const resetRuns = useRunStore((state) => state.reset);
  const resetGamification = useGamification((state) => state.reset);
  const streakReminder = useSettings((state) => state.streakReminder);
  const setStreakReminder = useSettings((state) => state.setStreakReminder);
  const [reminderDenied, setReminderDenied] = useState(false);

  async function toggleReminder() {
    if (streakReminder) {
      setStreakReminder(false);
      return;
    }
    // Die Erlaubnis wird erst beim Einschalten angefragt
    const granted = await requestReminderPermission();
    setReminderDenied(!granted);
    setStreakReminder(granted);
  }

  // Eingabe bleibt Text, damit Zwischenstände wie "72," tippbar sind
  const [weightText, setWeightText] = useState(
    bodyWeightKg !== null ? String(kgToDisplay(bodyWeightKg, units)).replace('.', ',') : '',
  );

  function changeWeight(text: string) {
    setWeightText(text);
    const value = parseNumber(text);
    setBodyWeightKg(value !== null && value > 0 ? displayToKg(value, units) : null);
  }
  const resetWorkouts = useWorkouts((state) => state.reset);

  function confirmReset() {
    confirmAction({
      title: 'Alle Daten löschen?',
      message:
        'Name, Einstellungen, Workouts, Home-Workouts, Läufe, Abzeichen und Vorlagen werden von diesem Gerät gelöscht. Das lässt sich nicht rückgängig machen.',
      confirmLabel: 'Löschen',
      onConfirm: () => {
        resetSettings();
        resetWorkouts();
        resetHome();
        resetRuns();
        resetGamification();
      },
    });
  }

  return (
    <Screen>
      <TextField
        label="Name"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Wie sollen wir dich nennen?"
        autoComplete="name"
      />

      <TextField
        label={`Körpergewicht in ${weightUnitLabel(units)} (optional)`}
        value={weightText}
        onChangeText={changeWeight}
        placeholder="Für genauere Kalorienwerte"
        keyboardType="decimal-pad"
      />

      <View style={styles.units}>
        <AppText variant="label" color="textSecondary">
          Einheiten
        </AppText>
        {UNITS.map((option) => (
          <Button
            key={option.value}
            title={option.label}
            variant={units === option.value ? 'primary' : 'secondary'}
            onPress={() => {
              setUnits(option.value);
              // Anzeige des Körpergewichts auf die neue Einheit umrechnen
              setWeightText(
                bodyWeightKg !== null ? String(kgToDisplay(bodyWeightKg, option.value)).replace('.', ',') : '',
              );
            }}
          />
        ))}
      </View>

      {remindersSupported ? (
        <View style={styles.units}>
          <AppText variant="label" color="textSecondary">
            Erinnerung
          </AppText>
          <Button
            title={streakReminder ? 'Serien-Erinnerung an (19 Uhr)' : 'Serien-Erinnerung aus'}
            variant={streakReminder ? 'primary' : 'secondary'}
            onPress={toggleReminder}
          />
          <AppText variant="caption" color="textSecondary">
            Höchstens einmal am Tag, nur wenn du eine Serie hast und noch nicht trainiert hast.
          </AppText>
          {reminderDenied ? (
            <AppText variant="caption" color="danger">
              Ohne Erlaubnis für Benachrichtigungen kann die Erinnerung nicht gesendet werden.
            </AppText>
          ) : null}
        </View>
      ) : null}

      <Card>
        <AppText variant="heading">Deine Daten bleiben bei dir</AppText>
        <AppText color="textSecondary">
          Die App arbeitet komplett offline. Alles wird nur auf diesem Gerät gespeichert, es gibt kein Konto und keine
          Verbindung zu einem Server.
        </AppText>
      </Card>

      <Button title="Alle Daten löschen" variant="danger" onPress={confirmReset} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  units: { gap: Spacing.two },
});
