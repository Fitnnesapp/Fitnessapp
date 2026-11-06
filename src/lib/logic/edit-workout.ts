import type { StrengthWorkout } from "../../types/workout.ts";

/** Grenzen für Korrekturen an gespeicherten Sätzen (Gewicht in kg). */
export const SET_LIMITS = { maxKg: 1000, minReps: 1, maxReps: 200 } as const;

export type SetCorrection = { weightKg: number; reps: number };

/** Fehlertext für eine Korrektur oder null, wenn sie gültig ist. */
export function validateCorrection(correction: SetCorrection): string | null {
  const { weightKg, reps } = correction;
  if (!Number.isFinite(weightKg) || weightKg < 0 || weightKg > SET_LIMITS.maxKg)
    return "Gewicht zwischen 0 und 1000 kg.";
  if (
    !Number.isInteger(reps) ||
    reps < SET_LIMITS.minReps ||
    reps > SET_LIMITS.maxReps
  ) {
    return "Wiederholungen zwischen 1 und 200.";
  }
  return null;
}

/**
 * Wendet Korrekturen (nach Satz-ID) und Löschungen auf ein gespeichertes Workout an.
 * Übungen ohne verbleibende Sätze fallen weg. Rekorde und Statistiken werden ohnehin
 * immer aus dem Verlauf berechnet und passen sich dadurch automatisch an.
 */
export function applySetEdits(
  workout: StrengthWorkout,
  corrections: Record<string, SetCorrection>,
  removed: readonly string[],
): StrengthWorkout {
  const gone = new Set(removed);
  return {
    ...workout,
    exercises: workout.exercises
      .map((exercise) => ({
        ...exercise,
        sets: exercise.sets
          .filter((set) => !gone.has(set.id))
          .map((set) => {
            const fix = corrections[set.id];
            return fix && validateCorrection(fix) === null
              ? { ...set, weightKg: fix.weightKg, reps: fix.reps }
              : set;
          }),
      }))
      .filter((exercise) => exercise.sets.length > 0),
  };
}
