import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { useWorkouts } from '@/lib/storage/workout-store';
import type { WorkoutTemplate } from '@/types/workout';

/** Eigene Vorlage: starten oder im Editor bearbeiten (Name, Übungen, Reihenfolge, löschen). */
export function TemplateCard({ template, onStart }: { template: WorkoutTemplate; onStart: () => void }) {
  const router = useRouter();
  const active = useWorkouts((state) => state.active);
  const edit = () => router.push({ pathname: '/training/template/[id]', params: { id: template.id } });

  return (
    <Card>
      <AppText variant="heading">{template.name}</AppText>
      <AppText variant="caption" color="textSecondary">
        {template.exerciseIds.length > 0
          ? template.exerciseIds.map((id) => getExercise(id)?.name ?? id).join(', ')
          : 'Noch keine Übungen'}
      </AppText>
      <View style={styles.actions}>
        <Button
          title={active ? 'Workout läuft' : 'Starten'}
          disabled={active !== null || template.exerciseIds.length === 0}
          onPress={onStart}
          style={styles.flex}
        />
        <Button title="Bearbeiten" variant="ghost" onPress={edit} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  flex: { flex: 1 },
});
