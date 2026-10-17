import type { LoggedExercise, RecordType } from '../../types/workout.ts';

type WorkoutLike = { exercises: LoggedExercise[] };

const weightKey = (kg: number) => kg.toFixed(2);

/**
 * Findet alle Sätze, die einen persönlichen Rekord brechen.
 * Erwartet die Workouts in zeitlicher Reihenfolge (ältestes zuerst).
 *
 * - max_weight: mehr Gewicht als je zuvor bei dieser Übung
 * - max_reps: mehr Wiederholungen als je zuvor bei genau diesem Gewicht
 *
 * Gleicher Wert ist kein Rekord. Der allererste Satz einer Übung legt nur die Basis
 * fest und zählt nicht als Rekord. Aufwärmsätze werden ignoriert.
 */
export function findRecords(workouts: WorkoutLike[]): Map<string, RecordType[]> {
  const records = new Map<string, RecordType[]>();
  const bestWeight = new Map<string, number>();
  const bestRepsAtWeight = new Map<string, number>();

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        if (set.isWarmup || set.reps <= 0) continue;

        const types: RecordType[] = [];

        const previousWeight = bestWeight.get(exercise.exerciseId);
        if (previousWeight !== undefined && set.weightKg > previousWeight) types.push('max_weight');
        if (previousWeight === undefined || set.weightKg > previousWeight) {
          bestWeight.set(exercise.exerciseId, set.weightKg);
        }

        const repsKey = `${exercise.exerciseId}|${weightKey(set.weightKg)}`;
        const previousReps = bestRepsAtWeight.get(repsKey);
        if (previousReps !== undefined && set.reps > previousReps) types.push('max_reps');
        if (previousReps === undefined || set.reps > previousReps) {
          bestRepsAtWeight.set(repsKey, set.reps);
        }

        if (types.length > 0) records.set(set.id, types);
      }
    }
  }

  return records;
}
