import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { EQUIPMENT, EXERCISES, MUSCLE_GROUPS } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';
import { useWorkouts } from '@/lib/storage/workout-store';
import type { Equipment, MuscleGroup } from '@/types/workout';

export default function ExercisesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { pick } = useLocalSearchParams<{ pick?: string }>();
  const picking = pick === '1';
  const addExercise = useWorkouts((state) => state.addExercise);

  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return EXERCISES.filter(
      (exercise) =>
        (!needle || exercise.name.toLowerCase().includes(needle)) &&
        (!muscle || exercise.muscleGroup === muscle) &&
        (!equipment || exercise.equipment === equipment),
    );
  }, [query, muscle, equipment]);

  function select(id: string) {
    if (picking) {
      addExercise(id);
      router.back();
    } else {
      router.push({ pathname: '/training/exercise/[id]', params: { id } });
    }
  }

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      data={results}
      keyExtractor={(exercise) => exercise.id}
      ListHeaderComponent={
        <View style={styles.filters}>
          <TextField label="Suchen" value={query} onChangeText={setQuery} placeholder="z.B. Bankdrücken" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {MUSCLE_GROUPS.map((group) => (
              <Chip
                key={group}
                label={group}
                selected={muscle === group}
                onPress={() => setMuscle(muscle === group ? null : group)}
              />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {EQUIPMENT.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={equipment === item}
                onPress={() => setEquipment(equipment === item ? null : item)}
              />
            ))}
          </ScrollView>
          <AppText variant="caption" color="textSecondary">
            {results.length} {results.length === 1 ? 'Übung' : 'Übungen'}
          </AppText>
        </View>
      }
      ListEmptyComponent={<AppText color="textSecondary">Keine Übung gefunden. Passe Suche oder Filter an.</AppText>}
      renderItem={({ item }) => (
        <Card onPress={() => select(item.id)} style={styles.row}>
          <AppText variant="heading">{item.name}</AppText>
          <AppText variant="caption" color="textSecondary">
            {item.muscleGroup} · {item.equipment} · {item.difficulty}
          </AppText>
        </Card>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  filters: { gap: Spacing.three, marginBottom: Spacing.three },
  chips: { gap: Spacing.two },
  row: { padding: Spacing.three, gap: Spacing.one },
  separator: { height: Spacing.two },
});
