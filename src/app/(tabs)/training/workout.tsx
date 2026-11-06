import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ProgressionHint } from '@/components/progression-hint';
import { RestTimer } from '@/components/rest-timer';
import { SetRow } from '@/components/set-row';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { confirmAction } from '@/lib/confirm';
import { finalizeDraft, NOTE_MAX_LENGTH } from '@/lib/logic/draft';
import { formatClock } from '@/lib/logic/format';
import { goalProgress } from '@/lib/logic/goals';
import { findRecords } from '@/lib/logic/personal-records';
import { progressionTip, type ProgressionTip } from '@/lib/logic/progression';
import { plateHint } from '@/lib/logic/strength-calc';
import { formatWeight, parseNumber, weightUnitLabel } from '@/lib/logic/units';
import { warmupSets } from '@/lib/logic/warmup';
import { useGoalsStore } from '@/lib/storage/goals-store';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';

export default function WorkoutScreen() {
  const router = useRouter();
  const theme = useTheme();
  const units = useSettings((state) => state.units);
  const store = useWorkouts();
  const { active, history } = store;
  const goals = useGoalsStore((state) => state.goals);

  const now = useNow(1000, active !== null);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  // Startwert ist die zuletzt selbst gewählte Pause; Vorgaben fertiger Workouts ändern nur dieses Training
  const preferredRest = useSettings((state) => state.restSeconds);
  const setPreferredRest = useSettings((state) => state.setRestSeconds);
  const [restSeconds, setRestSeconds] = useState(preferredRest);
  const [error, setError] = useState<string | null>(null);

  // Rekorde gegen den bisherigen Verlauf und die schon erledigten Sätze dieses Workouts prüfen
  const records = useMemo(() => {
    if (!active) return new Map();
    const draft = finalizeDraft(active, units, active.startedAt);
    return findRecords([...history].sort((a, b) => a.startedAt - b.startedAt).concat(draft));
  }, [active, history, units]);

  // Progressions-Tipp je Übung aus dem bisherigen Verlauf (das laufende Workout zählt nicht mit)
  const exerciseKey = active?.exercises.map((entry) => entry.exerciseId).join('|') ?? '';
  const tips = useMemo(() => {
    const result = new Map<string, ProgressionTip>();
    for (const id of exerciseKey.split('|')) {
      const exercise = getExercise(id);
      if (exercise && !result.has(id)) result.set(id, progressionTip(history, id, exercise, units));
    }
    return result;
  }, [exerciseKey, history, units]);

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
        onChangeDuration={(seconds) => {
          setRestSeconds(seconds);
          setPreferredRest(seconds);
        }}
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
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`${exercise?.name ?? entry.exerciseId}: Anleitung und Verlauf`}
                onPress={() => router.push({ pathname: '/training/exercise/[id]', params: { id: entry.exerciseId } })}
                style={styles.exerciseName}>
                <AppText variant="heading">{exercise?.name ?? entry.exerciseId}</AppText>
              </Pressable>
              {exerciseIndex > 0 ? (
                <IconButton
                  icon="arrow-up"
                  label={`${exercise?.name ?? 'Übung'} nach oben verschieben`}
                  onPress={() => store.moveExerciseUp(exerciseIndex)}
                />
              ) : null}
              {!entry.sets.some((set) => set.done) && exercise ? (
                <IconButton
                  icon="swap-horizontal"
                  label={`${exercise.name} tauschen, z.B. wenn das Gerät besetzt ist`}
                  onPress={() =>
                    router.push({
                      pathname: '/training/exercises',
                      params: { swap: String(exerciseIndex), muscle: exercise.muscleGroup },
                    })
                  }
                />
              ) : null}
              <IconButton
                icon="trash-outline"
                label="Übung entfernen"
                onPress={() =>
                  confirmAction({
                    title: 'Übung entfernen?',
                    message: 'Alle Sätze dieser Übung werden aus dem Workout gelöscht.',
                    confirmLabel: 'Entfernen',
                    onConfirm: () => store.removeExercise(exerciseIndex),
                  })
                }
              />
            </View>
            {(() => {
              const goal = goals.find((g) => g.exerciseId === entry.exerciseId);
              if (!goal) return null;
              const progress = goalProgress(goal, history);
              if (progress.achieved) return null;
              return (
                <AppText variant="caption" color="accent">
                  Dein Ziel: {formatWeight(goal.targetKg, units)} · noch {formatWeight(progress.remainingKg, units)}
                </AppText>
              );
            })()}
            {entry.target ? (
              <AppText variant="caption" color="textSecondary">
                Ziel: {entry.sets.filter((set) => !set.isWarmup).length} × {entry.target.reps} · {entry.target.restSeconds} s Pause
              </AppText>
            ) : null}

            {(() => {
              const tip = tips.get(entry.exerciseId);
              if (!tip) return null;
              const open = entry.sets.filter((set) => !set.done && !set.isWarmup);
              const weightText = tip.weight !== null ? String(tip.weight) : null;
              const differs = open.some(
                (set) => (weightText !== null && set.weight !== weightText) || (tip.reps !== null && set.reps !== String(tip.reps)),
              );
              return (
                <ProgressionHint
                  tip={tip}
                  unit={unit}
                  onApply={
                    differs
                      ? () => {
                          for (const set of open) {
                            store.updateSet(exerciseIndex, set.id, {
                              ...(weightText !== null ? { weight: weightText } : {}),
                              ...(tip.reps !== null ? { reps: String(tip.reps) } : {}),
                            });
                          }
                        }
                      : undefined
                  }
                />
              );
            })()}

            {(() => {
              if (!exercise || entry.sets.some((set) => set.isWarmup || set.done)) return null;
              const firstWorking = entry.sets.find((set) => !set.isWarmup);
              const weight = firstWorking ? parseNumber(firstWorking.weight) : null;
              const warmups = weight !== null ? warmupSets(weight, exercise.equipment, units) : [];
              if (warmups.length === 0) return null;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${warmups.length} Aufwärmsätze hinzufügen`}
                  onPress={() => store.addWarmupSets(exerciseIndex, warmups)}
                  style={({ pressed }) => [styles.warmup, pressed && styles.pressed]}>
                  <Ionicons name="flame-outline" size={16} color={theme.accent} />
                  <AppText variant="label" color="accent">
                    Aufwärmen: {warmups.map((w) => `${String(w.weight).replace('.', ',')} × ${w.reps}`).join(' · ')}
                  </AppText>
                </Pressable>
              );
            })()}

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
                    // Beim Abhaken eines Satzes startet die Ruhezeit, bei fertigen Workouts mit der Vorgabe der Übung
                    if (!set.done) {
                      const seconds = entry.target?.restSeconds ?? restSeconds;
                      if (entry.target) setRestSeconds(seconds);
                      setRestEndsAt(Date.now() + seconds * 1000);
                    }
                  }}
                />
              );
            })}

            {(() => {
              // Auflegehilfe für Langhantel-Übungen: Scheiben pro Seite für den nächsten offenen Satz
              if (exercise?.equipment !== 'Langhantel') return null;
              const next = entry.sets.find((set) => !set.done);
              const hint = next ? plateHint(parseNumber(next.weight), units) : null;
              if (!hint) return null;
              return (
                <View style={styles.plates} accessibilityLabel={`Pro Seite auflegen: ${hint.text} ${unit}`}>
                  <Ionicons name="disc-outline" size={16} color={theme.textSecondary} />
                  <AppText variant="caption" color="textSecondary" style={styles.flex}>
                    Pro Seite: {hint.text} {unit}
                    {hint.exact ? '' : ` (ergibt ${String(hint.loaded).replace('.', ',')} ${unit})`} ·{' '}
                    {units === 'metric' ? '20' : '45'}-{unit}-Stange
                  </AppText>
                </View>
              );
            })()}

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

      <TextField
        label="Notiz (optional)"
        value={active.note ?? ''}
        onChangeText={store.setActiveNote}
        placeholder="z.B. Schulter zwickt, neues Studio, super Tag"
        multiline
        maxLength={NOTE_MAX_LENGTH}
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

function IconButton({
  icon,
  label,
  onPress,
}: {
  icon: 'swap-horizontal' | 'trash-outline' | 'arrow-up';
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, { backgroundColor: theme.surfaceAlt }, pressed && styles.pressed]}>
      <Ionicons name={icon} size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  plates: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  flex: { flex: 1 },
  header: { gap: Spacing.one },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  exerciseName: { flex: 1 },
  iconButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
  warmup: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.one },
});
