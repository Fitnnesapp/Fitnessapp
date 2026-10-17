import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { ProgressChart } from '@/components/progress-chart';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { getExercise } from '@/data/exercises';
import { findRecords } from '@/lib/logic/personal-records';
import { formatWeight, kgToDisplay, weightUnitLabel } from '@/lib/logic/units';
import { exerciseProgress } from '@/lib/logic/workout-stats';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercise = getExercise(id);
  const units = useSettings((state) => state.units);
  const history = useWorkouts((state) => state.history);

  const progress = useMemo(() => exerciseProgress(history, id), [history, id]);
  const prCount = useMemo(() => {
    const own = history.map((w) => ({ exercises: w.exercises.filter((e) => e.exerciseId === id) }));
    return findRecords(own).size;
  }, [history, id]);

  if (!exercise) {
    return (
      <Screen>
        <AppText variant="title">Übung nicht gefunden</AppText>
      </Screen>
    );
  }

  const best = progress.length > 0 ? Math.max(...progress.map((p) => p.maxWeightKg)) : null;

  return (
    <Screen>
      <AppText variant="title">{exercise.name}</AppText>
      <AppText color="textSecondary">
        {exercise.muscleGroup} · {exercise.equipment} · {exercise.difficulty}
      </AppText>

      <Card>
        <AppText variant="label" color="textSecondary">
          ANLEITUNG
        </AppText>
        <AppText>{exercise.instructions}</AppText>
      </Card>

      <Card>
        <AppText variant="label" color="textSecondary">
          FORTSCHRITT (HÖCHSTGEWICHT)
        </AppText>
        <ProgressChart
          unitLabel={weightUnitLabel(units)}
          points={progress.map((p) => ({ at: p.at, value: kgToDisplay(p.maxWeightKg, units) }))}
        />
        {best !== null ? (
          <View>
            <AppText>Bestleistung: {formatWeight(best, units)}</AppText>
            <AppText color="textSecondary">
              {progress.length} {progress.length === 1 ? 'Workout' : 'Workouts'} · {prCount}{' '}
              {prCount === 1 ? 'Rekord' : 'Rekorde'}
            </AppText>
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}
