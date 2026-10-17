import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { confirmAction } from '@/lib/confirm';
import { useSettings, type UnitsPreference } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';

const UNITS: { value: UnitsPreference; label: string }[] = [
  { value: 'metric', label: 'Metrisch (kg, km)' },
  { value: 'imperial', label: 'Imperial (lb, mi)' },
];

export default function ProfileScreen() {
  const { displayName, units, setDisplayName, setUnits, reset: resetSettings } = useSettings();
  const resetWorkouts = useWorkouts((state) => state.reset);

  function confirmReset() {
    confirmAction({
      title: 'Alle Daten löschen?',
      message:
        'Name, Einstellungen, Workouts und Vorlagen werden von diesem Gerät gelöscht. Das lässt sich nicht rückgängig machen.',
      confirmLabel: 'Löschen',
      onConfirm: () => {
        resetSettings();
        resetWorkouts();
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

      <View style={styles.units}>
        <AppText variant="label" color="textSecondary">
          Einheiten
        </AppText>
        {UNITS.map((option) => (
          <Button
            key={option.value}
            title={option.label}
            variant={units === option.value ? 'primary' : 'secondary'}
            onPress={() => setUnits(option.value)}
          />
        ))}
      </View>

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
