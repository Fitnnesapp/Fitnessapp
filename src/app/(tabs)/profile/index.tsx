import { useState } from 'react';
import { useRouter } from 'expo-router';
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
import { usePlanStore } from '@/lib/storage/plan-store';
import { useChallengeStore } from '@/lib/storage/challenge-store';
import { GOAL_LABELS } from '@/lib/logic/plan';
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
  const router = useRouter();
  const { displayName, units, bodyWeightKg, setDisplayName, setUnits, setBodyWeightKg, reset: resetSettings } = useSettings();
  const resetHome = useHomeSessions((state) => state.reset);
  const resetRuns = useRunStore((state) => state.reset);
  const resetGamification = useGamification((state) => state.reset);
  const plan = usePlanStore((state) => state.plan);
  const resetPlan = usePlanStore((state) => state.reset);
  const resetChallenges = useChallengeStore((state) => state.reset);
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
        'Name, Einstellungen, Trainingsplan, Challenges, Workouts, Home-Workouts, Läufe, Abzeichen und Vorlagen werden von diesem Gerät gelöscht. Das lässt sich nicht rückgängig machen.',
      confirmLabel: 'Löschen',
      onConfirm: () => {
        resetSettings();
        resetWorkouts();
        resetHome();
        resetRuns();
        resetGamification();
        resetPlan();
        resetChallenges();
      },
    });
  }

  return (
    <Screen>
      <Card onPress={() => router.push(plan ? '/plan' : '/plan/setup')}>
        <AppText variant="label" color="accent">
          TRAININGSPLAN
        </AppText>
        <AppText variant="heading">
          {plan ? `${GOAL_LABELS[plan.answers.goal]} · ${plan.sessions.length} Tage pro Woche` : 'Persönlichen Plan erstellen'}
        </AppText>
        <AppText color="textSecondary">
          {plan
            ? 'Ansehen, anpassen oder neu erstellen.'
            : 'Sechs kurze Fragen, dann steht dein Wochenplan nach Ziel, Zeit und Erfahrung.'}
        </AppText>
      </Card>

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

      <Button title="Premium" variant="secondary" onPress={() => router.push('/profile/premium')} />

      <Card>
        <AppText variant="heading">Deine Daten bleiben bei dir</AppText>
        <AppText color="textSecondary">
          Alles, was du trainierst, wird nur auf diesem Gerät gespeichert. Es gibt kein Konto. Die App lädt nur die
          öffentliche Event-Liste aus dem Internet und sendet dabei keine Daten über dich.
        </AppText>
      </Card>

      <Button title="Alle Daten löschen" variant="danger" onPress={confirmReset} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  units: { gap: Spacing.two },
});
