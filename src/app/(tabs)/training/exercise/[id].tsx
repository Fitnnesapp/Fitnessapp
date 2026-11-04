import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { GoalEditor } from '@/components/goal-card';
import { MuscleMap } from '@/components/muscle-map';
import { ProgressChart } from '@/components/progress-chart';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { EXERCISES, getExercise, secondaryMuscles } from '@/data/exercises';
import { alternativesFor } from '@/lib/logic/alternatives';
import { formatDate } from '@/lib/logic/format';
import { muscleLoad } from '@/lib/logic/muscle-load';
import { findRecords } from '@/lib/logic/personal-records';
import { bestOneRepMax } from '@/lib/logic/strength-calc';
import { formatWeight, kgToDisplay, weightUnitLabel } from '@/lib/logic/units';
import { exerciseProgress } from '@/lib/logic/workout-stats';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const exercise = getExercise(id);
  const units = useSettings((state) => state.units);
  const history = useWorkouts((state) => state.history);

  const progress = useMemo(() => exerciseProgress(history, id), [history, id]);
  const estimate = useMemo(() => bestOneRepMax(history, id), [history, id]);
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

  const alternatives = alternativesFor(exercise, EXERCISES, 3);
  const best = progress.length > 0 ? Math.max(...progress.map((p) => p.maxWeightKg)) : null;

  return (
    <Screen>
      <AppText variant="title">{exercise.name}</AppText>
      <AppText color="textSecondary">
        {exercise.muscleGroup} · {exercise.equipment} · {exercise.difficulty}
      </AppText>

      <Card>
        <MuscleMap
          load={muscleLoad([{ primary: exercise.muscleGroup, secondary: secondaryMuscles(exercise.id), amount: 1 }])}
          height={180}
        />
        {secondaryMuscles(exercise.id).length > 0 ? (
          <AppText variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
            Hauptmuskel: {exercise.muscleGroup} · Unterstützend: {secondaryMuscles(exercise.id).join(', ')}
          </AppText>
        ) : null}
      </Card>

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

      {/* Geschätztes Maximalgewicht aus dem besten Satz, mit Sprung in den Rechner */}
      {estimate ? (
        <Card>
          <AppText variant="label" color="textSecondary">
            GESCHÄTZTES 1RM
          </AppText>
          <AppText variant="title">{formatWeight(estimate.oneRepMaxKg, units)}</AppText>
          <AppText color="textSecondary">
            Aus {formatWeight(estimate.weightKg, units)} × {estimate.reps} am {formatDate(estimate.at)}
          </AppText>
          <Button
            title="Prozenttabelle im Rechner"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: '/training/calculator',
                params: {
                  weight: String(kgToDisplay(estimate.weightKg, units)).replace('.', ','),
                  reps: String(estimate.reps),
                },
              })
            }
          />
        </Card>
      ) : null}

      {exercise.equipment !== 'Körpergewicht' ? <GoalEditor exerciseId={exercise.id} /> : null}

      {alternatives.length > 0 ? (
        <>
          <AppText variant="heading">Alternativen</AppText>
          <AppText variant="caption" color="textSecondary">
            Gleiche Muskelgruppe, anderes Gerät: praktisch, wenn etwas besetzt ist oder zu Hause fehlt.
          </AppText>
          {alternatives.map((other) => (
            <Card
              key={other.id}
              onPress={() => router.push({ pathname: '/training/exercise/[id]', params: { id: other.id } })}
              accessibilityLabel={`${other.name}, ${other.equipment}`}>
              <AppText variant="heading">{other.name}</AppText>
              <AppText variant="caption" color="textSecondary">
                {other.equipment} · {other.difficulty}
              </AppText>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}
