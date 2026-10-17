import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { confirmAction } from '@/lib/confirm';
import { useWorkouts } from '@/lib/storage/workout-store';

export default function StrengthScreen() {
  const router = useRouter();
  const { active, templates, startWorkout, deleteTemplate } = useWorkouts();

  function start(exerciseIds?: string[]) {
    startWorkout(exerciseIds);
    router.push('/training/workout');
  }

  return (
    <Screen>
      <AppText variant="display">Kraft</AppText>

      {active ? (
        <Card>
          <AppText variant="label" color="accent">
            WORKOUT LÄUFT
          </AppText>
          <AppText color="textSecondary">
            Du hast ein angefangenes Workout mit {active.exercises.length}{' '}
            {active.exercises.length === 1 ? 'Übung' : 'Übungen'}.
          </AppText>
          <Button title="Fortsetzen" onPress={() => router.push('/training/workout')} />
        </Card>
      ) : (
        <Button title="Leeres Workout starten" onPress={() => start()} />
      )}

      <Button title="Übungsbibliothek" variant="secondary" onPress={() => router.push('/training/exercises')} />

      <AppText variant="heading">Vorlagen</AppText>
      {templates.length === 0 ? (
        <AppText color="textSecondary">
          Noch keine Vorlagen. Nach einem Workout kannst du es als Vorlage speichern.
        </AppText>
      ) : null}

      {templates.map((template) => (
        <Card key={template.id}>
          <AppText variant="heading">{template.name}</AppText>
          <AppText variant="caption" color="textSecondary">
            {template.exerciseIds.map((id) => getExercise(id)?.name ?? id).join(', ')}
          </AppText>
          <View style={styles.actions}>
            <Button
              title="Starten"
              disabled={active !== null}
              onPress={() => start(template.exerciseIds)}
              style={styles.flex}
            />
            <Button
              title="Löschen"
              variant="ghost"
              onPress={() =>
                confirmAction({
                  title: 'Vorlage löschen?',
                  message: `„${template.name}“ wird entfernt. Bereits gespeicherte Workouts bleiben erhalten.`,
                  confirmLabel: 'Löschen',
                  onConfirm: () => deleteTemplate(template.id),
                })
              }
            />
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  flex: { flex: 1 },
});
