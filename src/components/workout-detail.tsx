import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';

import { CelebrationCard } from '@/components/celebration-card';
import { MuscleMap } from '@/components/muscle-map';
import { DetailHeader, StatGrid } from '@/components/detail-layout';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { getExercise, secondaryMuscles } from '@/data/exercises';
import { confirmAction } from '@/lib/confirm';
import { compareWithPrevious } from '@/lib/logic/compare';
import { goalProgress } from '@/lib/logic/goals';
import { formatDuration } from '@/lib/logic/format';
import { muscleLoad } from '@/lib/logic/muscle-load';
import { findRecords } from '@/lib/logic/personal-records';
import { formatWeight } from '@/lib/logic/units';
import { summarizeWorkout } from '@/lib/logic/workout-stats';
import { canShare, shareText } from '@/lib/share';
import { useGoalsStore } from '@/lib/storage/goals-store';
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
  const { history, active, deleteWorkout, saveTemplate, repeatWorkout } = useWorkouts();
  const goals = useGoalsStore((state) => state.goals);
  const workout = getWorkout(history, workoutId);

  const [templateName, setTemplateName] = useState('');
  const [templateSaved, setTemplateSaved] = useState(false);

  const records = useMemo(
    () => findRecords([...history].sort((a, b) => a.startedAt - b.startedAt)),
    [history],
  );

  const comparison = useMemo(() => (workoutId ? compareWithPrevious(history, workoutId) : null), [history, workoutId]);

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
        // Nach dem Löschen zurück, nach einem frisch beendeten Training gibt es keinen sinnvollen Rückweg
        if (!justFinished && router.canGoBack()) router.back();
        else router.replace('/history');
      },
    });
  }

  return (
    <Screen>
      {justFinished ? (
        <CelebrationCard
          sessionId={workout.id}
          headline="Stark!"
          records={[
            ...(recordCount > 0 ? [recordCount === 1 ? '1 neuer Rekord' : `${recordCount} neue Rekorde`] : []),
            ...goals
              .filter((goal) => goalProgress(goal, history).achievedAt === workout.startedAt)
              .map((goal) => `Ziel erreicht: ${getExercise(goal.exerciseId)?.name ?? 'Übung'} ${formatWeight(goal.targetKg, units)}`),
          ]}
        />
      ) : null}
      <DetailHeader startedAt={workout.startedAt} title="Kraft-Workout" />

      <StatGrid
        items={[
          { label: 'Dauer', value: formatDuration(summary.durationMs) },
          { label: 'Volumen', value: formatWeight(summary.volumeKg, units) },
          { label: 'Sätze', value: String(summary.workingSets) },
          { label: 'Rekorde', value: String(recordCount) },
        ]}
      />

      {comparison ? (
        <Card>
          <AppText variant="eyebrow" color="textSecondary">
            Im Vergleich zum {new Date(comparison.previous.startedAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}
          </AppText>
          <AppText variant="title" color={comparison.volumeDeltaKg >= 0 ? 'accent' : 'text'}>
            {comparison.volumePct !== null
              ? `${comparison.volumePct > 0 ? '+' : ''}${comparison.volumePct} % Volumen`
              : `${comparison.volumeDeltaKg >= 0 ? '+' : ''}${formatWeight(comparison.volumeDeltaKg, units)}`}
          </AppText>
          {comparison.exercises
            .filter((delta) => delta.topKgDelta > 0 || (delta.topKgDelta === 0 && delta.repsDelta > 0))
            .slice(0, 3)
            .map((delta) => (
              <AppText key={delta.exerciseId} color="textSecondary">
                {getExercise(delta.exerciseId)?.name ?? delta.exerciseId}:{' '}
                {delta.topKgDelta > 0 ? `+${formatWeight(delta.topKgDelta, units)}` : `+${delta.repsDelta} Wdh.`} im besten
                Satz
              </AppText>
            ))}
          {comparison.volumeDeltaKg < 0 ? (
            <AppText variant="caption" color="textSecondary">
              Ein leichterer Tag. Auch der gehört dazu: Fortschritt verläuft in Wellen, nicht in einer Linie.
            </AppText>
          ) : null}
        </Card>
      ) : null}

      {summary.muscleGroups.length > 0 ? (
        <Card>
          <AppText variant="eyebrow" color="textSecondary">
            Trainiert: {summary.muscleGroups.join(', ')}
          </AppText>
          <MuscleMap
            height={170}
            legendLabels={['viele Sätze', 'wenige']}
            load={muscleLoad(
              workout.exercises.map((entry) => ({
                primary: getExercise(entry.exerciseId)?.muscleGroup,
                secondary: secondaryMuscles(entry.exerciseId),
                amount: entry.sets.filter((set) => !set.isWarmup).length,
              })),
            )}
          />
        </Card>
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

      {!justFinished ? (
        <Button
          title={active ? 'Erst das laufende Workout beenden' : 'Dieses Workout nochmal machen'}
          disabled={active !== null}
          onPress={() => {
            if (repeatWorkout(workout.id)) router.push('/training/workout');
          }}
        />
      ) : null}

      {canShare() ? (
        <Button
          title="Workout teilen"
          variant="secondary"
          onPress={() =>
            void shareText(
              [
                `Kraft-Workout · ${formatDuration(summary.durationMs)} · ${summary.workingSets} Sätze · ${formatWeight(summary.volumeKg, units)} Volumen`,
                ...workout.exercises.map((entry) => {
                  const top = entry.sets
                    .filter((set) => !set.isWarmup)
                    .reduce<{ weightKg: number; reps: number } | null>(
                      (best, set) => (!best || set.weightKg > best.weightKg ? set : best),
                      null,
                    );
                  const name = getExercise(entry.exerciseId)?.name ?? entry.exerciseId;
                  return top ? `${name}: ${formatWeight(top.weightKg, units)} × ${top.reps}` : name;
                }),
                recordCount > 0 ? `${recordCount} ${recordCount === 1 ? 'neuer Rekord' : 'neue Rekorde'}` : '',
              ]
                .filter(Boolean)
                .join('\n'),
            )
          }
        />
      ) : null}

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

