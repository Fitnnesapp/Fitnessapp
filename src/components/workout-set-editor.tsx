import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Radius, Spacing } from "@/constants/theme";
import { getExercise } from "@/data/exercises";
import { useTheme } from "@/hooks/use-theme";
import { successFeedback } from "@/lib/haptics";
import {
  applySetEdits,
  validateCorrection,
  type SetCorrection,
} from "@/lib/logic/edit-workout";
import {
  displayToKg,
  kgToDisplay,
  parseNumber,
  weightUnitLabel,
} from "@/lib/logic/units";
import { useSettings } from "@/lib/storage/settings-store";
import { useWorkouts } from "@/lib/storage/workout-store";
import type { StrengthWorkout } from "@/types/workout";

type Draft = Record<string, { weight: string; reps: string }>;

const toText = (value: number) => String(value).replace(".", ",");

/**
 * Sätze eines gespeicherten Workouts korrigieren (Tippfehler bei Gewicht oder Wiederholungen,
 * versehentlich abgehakte Sätze). Erst "Speichern" schreibt die Änderungen.
 */
export function WorkoutSetEditor({
  workout,
  onDone,
}: {
  workout: StrengthWorkout;
  onDone: () => void;
}) {
  const theme = useTheme();
  const units = useSettings((state) => state.units);
  const replaceWorkout = useWorkouts((state) => state.replaceWorkout);
  const unit = weightUnitLabel(units);

  const [draft, setDraft] = useState<Draft>(() =>
    Object.fromEntries(
      workout.exercises.flatMap((exercise) =>
        exercise.sets.map((set) => [
          set.id,
          {
            weight: toText(kgToDisplay(set.weightKg, units)),
            reps: String(set.reps),
          },
        ]),
      ),
    ),
  );
  const [removed, setRemoved] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  function save() {
    const corrections: Record<string, SetCorrection> = {};
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        if (removed.includes(set.id)) continue;
        const entry = draft[set.id];
        const weight = parseNumber(entry.weight);
        const reps = parseNumber(entry.reps);
        const correction = {
          weightKg: weight === null ? NaN : displayToKg(weight, units),
          reps: reps ?? NaN,
        };
        const problem = validateCorrection(correction);
        if (problem) {
          setError(
            `${getExercise(exercise.exerciseId)?.name ?? "Übung"}: ${problem}`,
          );
          return;
        }
        // Unveränderte Sätze nicht anfassen, damit keine Rundung der Einheitenumrechnung hineinrutscht
        if (
          Math.abs(correction.weightKg - set.weightKg) > 0.01 ||
          correction.reps !== set.reps
        ) {
          corrections[set.id] = correction;
        }
      }
    }
    const remaining = workout.exercises.some((exercise) =>
      exercise.sets.some((set) => !removed.includes(set.id)),
    );
    if (!remaining) {
      setError(
        "Mindestens ein Satz muss bleiben. Zum Entfernen des ganzen Workouts nutze „Workout löschen“.",
      );
      return;
    }
    replaceWorkout(applySetEdits(workout, corrections, removed));
    successFeedback();
    onDone();
  }

  return (
    <>
      {workout.exercises.map((exercise, exerciseIndex) => {
        let workingIndex = 0;
        return (
          <Card
            key={`${exercise.exerciseId}-${exerciseIndex}`}
            style={styles.card}
          >
            <AppText variant="heading">
              {getExercise(exercise.exerciseId)?.name ?? exercise.exerciseId}
            </AppText>
            {exercise.sets.map((set) => {
              if (!set.isWarmup) workingIndex += 1;
              const label = set.isWarmup ? "Aufw." : `Satz ${workingIndex}`;
              const isRemoved = removed.includes(set.id);
              const entry = draft[set.id];
              return (
                <View
                  key={set.id}
                  style={[styles.row, isRemoved && styles.removed]}
                >
                  <AppText
                    variant="label"
                    color="textSecondary"
                    style={styles.label}
                  >
                    {label}
                  </AppText>
                  <TextInput
                    accessibilityLabel={`${label} Gewicht in ${unit}`}
                    editable={!isRemoved}
                    value={entry.weight}
                    onChangeText={(weight) => {
                      setDraft({ ...draft, [set.id]: { ...entry, weight } });
                      setError(null);
                    }}
                    keyboardType="decimal-pad"
                    selectionColor={theme.accent}
                    style={[
                      styles.input,
                      { color: theme.text, backgroundColor: theme.surfaceAlt },
                    ]}
                  />
                  <AppText color="textSecondary">{unit} ×</AppText>
                  <TextInput
                    accessibilityLabel={`${label} Wiederholungen`}
                    editable={!isRemoved}
                    value={entry.reps}
                    onChangeText={(reps) => {
                      setDraft({ ...draft, [set.id]: { ...entry, reps } });
                      setError(null);
                    }}
                    keyboardType="number-pad"
                    selectionColor={theme.accent}
                    style={[
                      styles.input,
                      styles.reps,
                      { color: theme.text, backgroundColor: theme.surfaceAlt },
                    ]}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      isRemoved
                        ? `${label} wiederherstellen`
                        : `${label} entfernen`
                    }
                    hitSlop={6}
                    onPress={() =>
                      setRemoved(
                        isRemoved
                          ? removed.filter((id) => id !== set.id)
                          : [...removed, set.id],
                      )
                    }
                    style={styles.icon}
                  >
                    <Ionicons
                      name={isRemoved ? "arrow-undo-outline" : "trash-outline"}
                      size={18}
                      color={isRemoved ? theme.accent : theme.textSecondary}
                    />
                  </Pressable>
                </View>
              );
            })}
          </Card>
        );
      })}

      {error ? (
        <AppText color="danger" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
      <View style={styles.actions}>
        <Button title="Speichern" onPress={save} style={styles.flex} />
        <Button title="Abbrechen" variant="ghost" onPress={onDone} />
      </View>
      <AppText variant="caption" color="textSecondary">
        Rekorde, Ziele und Statistiken rechnen sich danach automatisch neu.
      </AppText>
    </>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  removed: { opacity: 0.4 },
  label: { width: 52 },
  input: {
    width: 72,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.small,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  reps: { width: 56 },
  icon: { marginLeft: "auto", padding: Spacing.one },
  actions: { flexDirection: "row", gap: Spacing.two, alignItems: "center" },
  flex: { flex: 1 },
});
