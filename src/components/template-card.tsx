import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { confirmAction } from '@/lib/confirm';
import { useWorkouts } from '@/lib/storage/workout-store';
import type { WorkoutTemplate } from '@/types/workout';

/** Eigene Vorlage: starten, umbenennen oder löschen. */
export function TemplateCard({ template, onStart }: { template: WorkoutTemplate; onStart: () => void }) {
  const active = useWorkouts((state) => state.active);
  const deleteTemplate = useWorkouts((state) => state.deleteTemplate);
  const renameTemplate = useWorkouts((state) => state.renameTemplate);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(template.name);

  return (
    <Card>
      {editing ? (
        <>
          <TextField label="Name der Vorlage" value={name} onChangeText={setName} maxLength={40} autoFocus />
          <View style={styles.actions}>
            <Button
              title="Speichern"
              disabled={name.trim() === ''}
              onPress={() => {
                renameTemplate(template.id, name);
                setEditing(false);
              }}
              style={styles.flex}
            />
            <Button
              title="Abbrechen"
              variant="ghost"
              onPress={() => {
                setName(template.name);
                setEditing(false);
              }}
            />
          </View>
        </>
      ) : (
        <>
          <AppText variant="heading">{template.name}</AppText>
          <AppText variant="caption" color="textSecondary">
            {template.exerciseIds.map((id) => getExercise(id)?.name ?? id).join(', ')}
          </AppText>
          <View style={styles.actions}>
            <Button
              title={active ? 'Workout läuft' : 'Starten'}
              disabled={active !== null}
              onPress={onStart}
              style={styles.flex}
            />
            <Button title="Umbenennen" variant="ghost" onPress={() => setEditing(true)} />
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
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  flex: { flex: 1 },
});
