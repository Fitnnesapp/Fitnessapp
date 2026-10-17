import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { RestTimer } from '@/components/rest-timer';
import { SetRow } from '@/components/set-row';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { useNow } from '@/hooks/use-now';
import { confirmAction } from '@/lib/confirm';
import { finalizeDraft } from '@/lib/logic/draft';
import { formatClock } from '@/lib/logic/format';
import { findRecords } from '@/lib/logic/personal-records';
import { weightUnitLabel } from '@/lib/logic/units';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';

export default function WorkoutScreen() {
  const router = useRouter();
  const units = useSettings((state) => state.units);
  const store = useWorkouts();
  const { active, history } = store;

  const now = useNow(1000, active !== null);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [restSeconds, setRestSeconds] = useState(90);
  const [error, setError] = useState<string | null>(null);

  // Rekorde gegen den bisherigen Verlauf und die schon erledigten Sätze dieses Workouts prüfen
  const records = useMemo(() => {
    if (!active) return new Map();
    const draft = finalizeDraft(active, units, active.startedAt);
    return findRecords([...history].sort((a, b) => a.startedAt - b.startedAt).concat(draft));
  }, [active, history, units]);

  if (!active) return <Redirect href="/training/strength" />;

  const unit = weightUnitLabel(units);

  function finish() {
    const id = store.finishWorkout();
    if (id) {
      router.replace({ pathname: '/training/summary/[id]', params: { id } });
    } else {
      setError('Markiere mindestens einen Satz mit Wiederholungen als erledigt.');
    }
  }

  function confirmDiscard() {
    confirmAction({
      title: 'Workout verwerfen?',
      message: 'Alle Eingaben dieses Workouts gehen verloren.',
      confirmLabel: 'Verwerfen',
      onConfirm: () => {
        store.discardWorkout();
        router.replace('/training/strength');
      },
    });
  }

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="display">{formatClock(now - active.startedAt)}</AppText>
        <AppText color="textSecondary">Das Workout wird automatisch gespeichert.</AppText>
      </View>

      <RestTimer
        endsAt={restEndsAt}
        onChangeEnd={setRestEndsAt}
        duration={restSeconds}
        onChangeDuration={setRestSeconds}
      />

      {active.exercises.length === 0 ? (
        <AppText color="textSecondary">Füge deine erste Übung hinzu.</AppText>
      ) : null}

      {active.exercises.map((entry, exerciseIndex) => {
        const exercise = getExercise(entry.exerciseId);
        let workingIndex = 0;

        return (
          <Card key={`${entry.exerciseId}-${exerciseIndex}`}>
            <View style={styles.exerciseHeader}>
              <AppText variant="heading" style={styles.exerciseName}>
                {exercise?.name ?? entry.exerciseId}
              </AppText>
              <Button
                title="Entfernen"
                variant="ghost"
                onPress={() =>
                  confirmAction({
                    title: 'Übung entfernen?',
                    message: 'Alle Sätze dieser Übung werden aus dem Workout gelöscht.',
                    confirmLabel: 'Entfernen',
                    onConfirm: () => store.removeExercise(exerciseIndex),
                  })
                }
                style={styles.removeButton}
              />
            </View>

            {entry.sets.map((set) => {
              if (!set.isWarmup) workingIndex += 1;

              return (
                <SetRow
                  key={set.id}
                  set={set}
                  workingIndex={workingIndex}
                  weightUnit={unit}
                  isRecord={set.done && records.has(set.id)}
                  onChange={(patch) => store.updateSet(exerciseIndex, set.id, patch)}
                  onRemove={() => store.removeSet(exerciseIndex, set.id)}
                  onToggleDone={() => {
                    store.updateSet(exerciseIndex, set.id, { done: !set.done });
                    // Beim Abhaken eines Satzes startet die Ruhezeit
                    if (!set.done) setRestEndsAt(Date.now() + restSeconds * 1000);
                  }}
                />
              );
            })}

            <Button title="Satz hinzufügen" variant="secondary" onPress={() => store.addSet(exerciseIndex)} />
            <AppText variant="caption" color="textSecondary">
              Tipp: Auf die Satznummer tippen markiert einen Aufwärmsatz, lang drücken löscht den Satz.
            </AppText>
          </Card>
        );
      })}

      <Button
        title="Übung hinzufügen"
        variant="secondary"
        onPress={() => router.push({ pathname: '/training/exercises', params: { pick: '1' } })}
      />

      {error ? (
        <AppText color="danger" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
      <Button title="Workout beenden" onPress={finish} />
      <Button title="Workout verwerfen" variant="danger" onPress={confirmDiscard} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.one },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  exerciseName: { flex: 1 },
  removeButton: { minHeight: 36, paddingHorizontal: Spacing.two },
});
