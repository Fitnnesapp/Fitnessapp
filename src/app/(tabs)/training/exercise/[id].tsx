import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GoalEditor } from '@/components/goal-card';
import { MuscleMap } from '@/components/muscle-map';
import { ProgressChart } from '@/components/progress-chart';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { EXERCISES, getExercise, secondaryMuscles } from '@/data/exercises';
import { confirmAction } from '@/lib/confirm';
import { alternativesFor } from '@/lib/logic/alternatives';
import { exerciseUsage } from '@/lib/logic/custom-exercises';
import { formatDate } from '@/lib/logic/format';
import { muscleLoad } from '@/lib/logic/muscle-load';
import { findRecords } from '@/lib/logic/personal-records';
import { bestOneRepMax } from '@/lib/logic/strength-calc';
import { formatWeight, kgToDisplay, weightUnitLabel } from '@/lib/logic/units';
import { exerciseProgress } from '@/lib/logic/workout-stats';
import { useCustomExercises } from '@/lib/storage/custom-exercise-store';
import { useGoalsStore } from '@/lib/storage/goals-store';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';

type Metric = 'max' | 'orm' | 'volume';
const METRICS: { key: Metric; label: string }[] = [
  { key: 'max', label: 'Höchstgewicht' },
  { key: 'orm', label: '1RM (geschätzt)' },
  { key: 'volume', label: 'Volumen' },
];

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const exercise = getExercise(id);
  const units = useSettings((state) => state.units);
  const history = useWorkouts((state) => state.history);
  const activeWorkout = useWorkouts((state) => state.active);
  const addExercise = useWorkouts((state) => state.addExercise);
  const startWorkout = useWorkouts((state) => state.startWorkout);
  const templates = useWorkouts((state) => state.templates);
  const goals = useGoalsStore((state) => state.goals);
  const removeCustom = useCustomExercises((state) => state.remove);
  // Abonniert die eigenen Übungen, damit die Seite nach dem Anlegen oder Löschen neu zeichnet
  useCustomExercises((state) => state.exercises.length);
  const [metric, setMetric] = useState<Metric>('max');

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
  const usage = exercise.custom ? exerciseUsage(exercise.id, { history, templates, active: activeWorkout, goals }) : null;

  function deleteOwn() {
    if (!exercise) return;
    confirmAction({
      title: 'Übung löschen?',
      message: `„${exercise.name}“ wird aus deiner Bibliothek entfernt.`,
      confirmLabel: 'Löschen',
      onConfirm: () => {
        removeCustom(exercise.id);
        if (router.canGoBack()) router.back();
        else router.replace('/training/exercises');
      },
    });
  }
  const best = progress.length > 0 ? Math.max(...progress.map((p) => p.maxWeightKg)) : null;

  return (
    <Screen>
      <AppText variant="title">{exercise.name}</AppText>
      <AppText color="textSecondary">
        {exercise.muscleGroup} · {exercise.equipment} · {exercise.custom ? 'Eigene Übung' : exercise.difficulty}
      </AppText>

      {/* Direkt ins Training: zum laufenden Workout hinzufügen oder mit dieser Übung starten */}
      {activeWorkout ? (
        activeWorkout.exercises.some((entry) => entry.exerciseId === exercise.id) ? (
          <Button title="Ist im laufenden Workout" variant="secondary" onPress={() => router.push('/training/workout')} />
        ) : (
          <Button
            title="Zum laufenden Workout hinzufügen"
            onPress={() => {
              addExercise(exercise.id);
              router.push('/training/workout');
            }}
          />
        )
      ) : (
        <Button
          title="Mit dieser Übung starten"
          variant="secondary"
          onPress={() => {
            startWorkout([exercise.id]);
            router.push('/training/workout');
          }}
        />
      )}

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

      {exercise.instructions ? (
        <Card>
          <AppText variant="label" color="textSecondary">
            {exercise.custom ? 'DEINE NOTIZ' : 'ANLEITUNG'}
          </AppText>
          <AppText>{exercise.instructions}</AppText>
        </Card>
      ) : null}

      <Card>
        <AppText variant="label" color="textSecondary">
          FORTSCHRITT
        </AppText>
        {progress.length > 1 ? (
          <View style={styles.metrics}>
            {METRICS.map((item) => (
              <Chip key={item.key} label={item.label} selected={metric === item.key} onPress={() => setMetric(item.key)} />
            ))}
          </View>
        ) : null}
        <ProgressChart
          unitLabel={weightUnitLabel(units)}
          points={progress
            .map((p) => ({
              at: p.at,
              raw: metric === 'max' ? p.maxWeightKg : metric === 'orm' ? p.oneRepMaxKg : p.volumeKg,
            }))
            .filter((p): p is { at: number; raw: number } => p.raw !== null)
            .map((p) => ({ at: p.at, value: kgToDisplay(p.raw, units) }))}
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

      {usage ? (
        usage.used ? (
          <AppText variant="caption" color="textSecondary">
            Eigene Übung. Sie bleibt erhalten, solange sie in{' '}
            {[
              usage.workouts > 0 ? `${usage.workouts} ${usage.workouts === 1 ? 'Workout' : 'Workouts'}` : null,
              usage.templates > 0 ? `${usage.templates} ${usage.templates === 1 ? 'Vorlage' : 'Vorlagen'}` : null,
              usage.inActive ? 'deinem laufenden Workout' : null,
              usage.goal ? 'einem Kraftziel' : null,
            ]
              .filter(Boolean)
              .join(', ')}{' '}
            steckt, damit dein Verlauf vollständig bleibt.
          </AppText>
        ) : (
          <Button title="Eigene Übung löschen" variant="danger" onPress={deleteOwn} />
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
