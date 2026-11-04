import type { StrengthWorkout } from '../../types/workout.ts';
import { estimateOneRepMax } from './strength-calc.ts';

/** Rekordbuch: beste Leistungen je Übung über den gesamten Verlauf. */
export type ExerciseRecord = {
  exerciseId: string;
  /** Schwerster Arbeitssatz (bei Gleichstand mit mehr Wiederholungen) */
  best: { weightKg: number; reps: number; at: number };
  /** Höchstes geschätztes Maximalgewicht (Epley, nur Sätze bis 12 Wiederholungen) */
  oneRepMax: { kg: number; at: number } | null;
  /** Meiste Wiederholungen in einem Satz, z.B. für Körpergewichtsübungen */
  maxReps: number;
  sessions: number;
  lastAt: number;
};

export function recordBook(history: readonly StrengthWorkout[]): ExerciseRecord[] {
  const book = new Map<string, ExerciseRecord>();
  const sorted = [...history].sort((a, b) => a.startedAt - b.startedAt);

  for (const workout of sorted) {
    for (const exercise of workout.exercises) {
      const working = exercise.sets.filter((set) => !set.isWarmup && set.reps > 0);
      if (working.length === 0) continue;
      let record = book.get(exercise.exerciseId);
      if (!record) {
        record = {
          exerciseId: exercise.exerciseId,
          best: { weightKg: working[0].weightKg, reps: working[0].reps, at: workout.startedAt },
          oneRepMax: null,
          maxReps: 0,
          sessions: 0,
          lastAt: workout.startedAt,
        };
        book.set(exercise.exerciseId, record);
      }
      record.sessions += 1;
      record.lastAt = workout.startedAt;
      for (const set of working) {
        if (set.weightKg > record.best.weightKg || (set.weightKg === record.best.weightKg && set.reps > record.best.reps)) {
          record.best = { weightKg: set.weightKg, reps: set.reps, at: workout.startedAt };
        }
        record.maxReps = Math.max(record.maxReps, set.reps);
        const estimate = set.weightKg > 0 ? estimateOneRepMax(set.weightKg, set.reps) : null;
        if (estimate !== null && (record.oneRepMax === null || estimate > record.oneRepMax.kg)) {
          record.oneRepMax = { kg: Math.round(estimate * 10) / 10, at: workout.startedAt };
        }
      }
    }
  }

  return [...book.values()].sort((a, b) => b.sessions - a.sessions || b.lastAt - a.lastAt);
}
