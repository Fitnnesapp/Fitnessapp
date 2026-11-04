import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';

import { MuscleMap } from '@/components/muscle-map';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { EQUIPMENT, EXERCISES, getExercise, MUSCLE_GROUPS } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';
import { formatWeight } from '@/lib/logic/units';
import { addToTemplate } from '@/lib/logic/templates';
import { recentExerciseIds } from '@/lib/logic/workout-stats';
import { useCustomExercises } from '@/lib/storage/custom-exercise-store';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';
import type { Equipment, MuscleGroup } from '@/types/workout';

export default function ExercisesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ pick?: string; swap?: string; muscle?: string; template?: string }>();
  const swapIndex = params.swap !== undefined ? Number(params.swap) : null;
  // Auswahl für eine Vorlage (Editor) statt fürs laufende Workout
  const template = useWorkouts((state) => state.templates.find((t) => t.id === params.template));
  const setTemplateExercises = useWorkouts((state) => state.setTemplateExercises);
  const picking = params.pick === '1' || swapIndex !== null || template !== undefined;
  const addExercise = useWorkouts((state) => state.addExercise);
  const replaceExercise = useWorkouts((state) => state.replaceExercise);
  const history = useWorkouts((state) => state.history);
  const active = useWorkouts((state) => state.active);
  const units = useSettings((state) => state.units);
  const custom = useCustomExercises((state) => state.exercises);
  // Eigene Übungen zuerst, sie sind meist genau die, die man sucht
  const all = useMemo(() => [...custom, ...EXERCISES], [custom]);
  // Letzter Arbeitssatz je Übung, damit man beim Auswählen sofort sieht, wo man steht
  const lastSets = useMemo(() => {
    const map = new Map<string, string>();
    for (const workout of [...history].sort((a, b) => b.startedAt - a.startedAt)) {
      for (const exercise of workout.exercises) {
        if (map.has(exercise.exerciseId)) continue;
        const working = exercise.sets.filter((set) => !set.isWarmup && set.reps > 0);
        const last = working[working.length - 1];
        if (!last) continue;
        map.set(exercise.exerciseId, last.weightKg > 0 ? `${formatWeight(last.weightKg, units)} × ${last.reps}` : `${last.reps} Wdh.`);
      }
    }
    return map;
  }, [history, units]);

  // Schnellauswahl beim Hinzufügen: zuletzt trainierte Übungen, die noch nicht im Workout sind
  const activeIds = useMemo(
    () => template?.exerciseIds ?? active?.exercises.map((entry) => entry.exerciseId) ?? [],
    [template, active],
  );
  const recent = useMemo(
    () => (picking ? recentExerciseIds(history, 8, activeIds).filter((id) => getExercise(id)) : []),
    [picking, history, activeIds],
  );

  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(
    MUSCLE_GROUPS.find((group) => group === params.muscle) ?? null,
  );
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [onlyOwn, setOnlyOwn] = useState(false);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return all.filter(
      (exercise) =>
        (!onlyOwn || exercise.custom) &&
        (!needle || exercise.name.toLowerCase().includes(needle)) &&
        (!muscle || exercise.muscleGroup === muscle) &&
        (!equipment || exercise.equipment === equipment),
    );
  }, [all, query, muscle, equipment, onlyOwn]);

  function createOwn() {
    router.push({
      pathname: '/training/exercise/new',
      params: {
        ...(params.pick === '1' ? { pick: '1' } : {}),
        ...(params.swap !== undefined ? { swap: params.swap } : {}),
        ...(query.trim() ? { name: query.trim() } : {}),
      },
    });
  }

  function select(id: string) {
    if (template) {
      setTemplateExercises(template.id, addToTemplate(template.exerciseIds, id));
      router.back();
    } else if (swapIndex !== null && Number.isInteger(swapIndex)) {
      replaceExercise(swapIndex, id);
      router.back();
    } else if (picking) {
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
          {template ? (
            <AppText variant="caption" color="textSecondary">
              Übung für „{template.name}“ auswählen
            </AppText>
          ) : null}
          {recent.length > 0 ? (
            <View style={styles.recent}>
              <AppText variant="label" color="textSecondary">
                ZULETZT TRAINIERT
              </AppText>
              <View style={styles.wrap}>
                {recent.map((id) => (
                  <Chip key={id} label={getExercise(id)?.name ?? id} selected={false} onPress={() => select(id)} />
                ))}
              </View>
            </View>
          ) : null}
          <TextField label="Suchen" value={query} onChangeText={setQuery} placeholder="z.B. Bankdrücken" />
          <Card style={styles.mapCard}>
            <MuscleMap
              load={muscle ? { [muscle]: 1 } : {}}
              height={150}
              showLegend={false}
              onSelectMuscle={(group) => setMuscle(muscle === group ? null : group)}
            />
            <AppText variant="caption" color="textSecondary" style={styles.center}>
              {muscle ? `${muscle} · nochmal tippen hebt den Filter auf` : 'Tippe auf einen Muskel oder wähle unten'}
            </AppText>
          </Card>
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
            {custom.length > 0 ? (
              <Chip label={`Eigene (${custom.length})`} selected={onlyOwn} onPress={() => setOnlyOwn(!onlyOwn)} />
            ) : null}
            {EQUIPMENT.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={equipment === item}
                onPress={() => setEquipment(equipment === item ? null : item)}
              />
            ))}
          </ScrollView>
          <View style={styles.countRow}>
            <AppText variant="caption" color="textSecondary">
              {results.length} {results.length === 1 ? 'Übung' : 'Übungen'}
            </AppText>
            <Button title="Eigene Übung" variant="ghost" onPress={createOwn} />
          </View>
        </View>
      }
      ListEmptyComponent={
        <Card style={styles.row}>
          <AppText color="textSecondary">Keine Übung gefunden. Passe Suche oder Filter an oder leg sie selbst an.</AppText>
          <Button
            title={query.trim() ? `„${query.trim()}“ anlegen` : 'Eigene Übung anlegen'}
            variant="secondary"
            onPress={createOwn}
          />
        </Card>
      }
      renderItem={({ item }) => (
        <Card onPress={() => select(item.id)} style={styles.row}>
          <View style={styles.nameRow}>
            {item.custom ? <Ionicons name="person-circle-outline" size={18} color={theme.accent} /> : null}
            <AppText variant="heading" style={styles.flex}>
              {item.name}
            </AppText>
          </View>
          <AppText variant="caption" color="textSecondary">
            {item.muscleGroup} · {item.equipment} · {item.custom ? 'Eigene Übung' : item.difficulty}
          </AppText>
          {lastSets.has(item.id) ? (
            <AppText variant="caption" color="accent">
              Zuletzt: {lastSets.get(item.id)}
            </AppText>
          ) : null}
        </Card>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  mapCard: { paddingVertical: Spacing.three, alignItems: 'center' },
  center: { textAlign: 'center' },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  filters: { gap: Spacing.three, marginBottom: Spacing.three },
  chips: { gap: Spacing.two },
  row: { padding: Spacing.three, gap: Spacing.one },
  separator: { height: Spacing.two },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  flex: { flex: 1 },
  recent: { gap: Spacing.two },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
