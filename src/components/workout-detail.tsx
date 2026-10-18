import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';

import { DetailHeader, StatGrid } from '@/components/detail-layout';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { getExercise } from '@/data/exercises';
import { confirmAction } from '@/lib/confirm';
import { formatDuration } from '@/lib/logic/format';
import { findRecords } from '@/lib/logic/personal-records';
import { formatWeight } from '@/lib/logic/units';
import { summarizeWorkout } from '@/lib/logic/workout-stats';
import { useSettings } from '@/lib/storage/settings-store';
import { getWorkout, useWorkouts } from '@/lib/storage/workout-store';

type WorkoutDetailProps = {
  workoutId: string | undefined;
  justFinished?: boolean;
};

/** Zusammenfassung eines abgeschlossenen Workouts. Wird nach dem Training und im Verlauf verwendet. */
export function WorkoutDetail({ workoutId, justFinished = false }: WorkoutDetailProps) {
  const router = useRouter();
  const units = useSettings((state) => state.units);
  const { history, deleteWorkout, saveTemplate } = useWorkouts();
  const workout = getWorkout(history, workoutId);

  const [templateName, setTemplateName] = useState('');
  const [templateSaved, setTemplateSaved] = useState(false);

  const records = useMemo(
    () => findRecords([...history].sort((a, b) => a.startedAt - b.startedAt)),
    [history],
  );

  if (!workout) {
    return (
      <Screen>
        <AppText variant="title">Workout nicht gefunden</AppText>
      </Screen>
    );
  }

  const summary = summarizeWorkout(workout, (id) => getExercise(id)?.muscleGroup);
  const recordCount = workout.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((set) => records.has(set.id)).length,
    0,
  );

  function confirmDelete() {
    confirmAction({
      title: 'Workout löschen?',
      message: 'Das Workout wird aus dem Verlauf entfernt.',
      confirmLabel: 'Löschen',
      onConfirm: () => {
        deleteWorkout(workout!.id);
        router.back();
      },
    });
  }

  return (
    <Screen>
      <DetailHeader startedAt={workout.startedAt} title={justFinished ? 'Stark! Workout abgeschlossen.' : 'Kraft-Workout'} />

      <StatGrid
        items={[
          { label: 'Dauer', value: formatDuration(summary.durationMs) },
          { label: 'Volumen', value: formatWeight(summary.volumeKg, units) },
          { label: 'Sätze', value: String(summary.workingSets) },
          { label: 'Rekorde', value: String(recordCount) },
        ]}
      />

      {summary.muscleGroups.length > 0 ? (
        <AppText color="textSecondary">Trainiert: {summary.muscleGroups.join(', ')}</AppText>
      ) : null}

      {workout.exercises.map((entry, index) => {
        const exercise = getExercise(entry.exerciseId);
        let workingIndex = 0;

        return (
          <Card key={`${entry.exerciseId}-${index}`}>
            <AppText variant="heading">{exercise?.name ?? entry.exerciseId}</AppText>
            {entry.sets.map((set) => {
              if (!set.isWarmup) workingIndex += 1;
              const rpe = set.rpe !== null ? ` · RPE ${String(set.rpe).replace('.', ',')}` : '';

              return (
                <AppText key={set.id} color={set.isWarmup ? 'textSecondary' : 'text'}>
                  {set.isWarmup ? 'Aufwärmen' : `Satz ${workingIndex}`}: {formatWeight(set.weightKg, units)} × {set.reps}
                  {rpe}
                  {records.has(set.id) ? '  🏆' : ''}
                </AppText>
              );
            })}
          </Card>
        );
      })}

      <Card>
        <AppText variant="heading">Als Vorlage speichern</AppText>
        <AppText variant="caption" color="textSecondary">
          Speichert die Übungen dieses Workouts, damit du es später mit einem Tipp erneut starten kannst.
        </AppText>
        <TextField
          label="Name der Vorlage"
          value={templateName}
          onChangeText={(text) => {
            setTemplateName(text);
            setTemplateSaved(false);
          }}
          placeholder="z.B. Push-Tag"
        />
        <Button
          title={templateSaved ? 'Gespeichert' : 'Vorlage speichern'}
          variant="secondary"
          disabled={templateName.trim() === '' || templateSaved}
          onPress={() => {
            saveTemplate(
              templateName,
              workout.exercises.map((exercise) => exercise.exerciseId),
            );
            setTemplateSaved(true);
          }}
        />
      </Card>

      {justFinished ? <Button title="Fertig" onPress={() => router.replace('/training/strength')} /> : null}
      <Button title="Workout löschen" variant="danger" onPress={confirmDelete} />
    </Screen>
  );
}

