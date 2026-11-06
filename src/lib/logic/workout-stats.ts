import type { LoggedExercise, StrengthWorkout } from '../../types/workout.ts';
import { estimateOneRepMax } from './strength-calc.ts';

export type WorkoutSummary = {
  durationMs: number;
  /** Gesamtvolumen in kg: Summe aus Gewicht mal Wiederholungen aller Arbeitssätze */
  volumeKg: number;
  workingSets: number;
  muscleGroups: string[];
};

export function summarizeWorkout(
  workout: StrengthWorkout,
  muscleGroupOf: (exerciseId: string) => string | undefined,
): WorkoutSummary {
  let volumeKg = 0;
  let workingSets = 0;
  const muscleGroups = new Set<string>();

  for (const exercise of workout.exercises) {
    const group = muscleGroupOf(exercise.exerciseId);
    if (group) muscleGroups.add(group);

    for (const set of exercise.sets) {
      if (set.isWarmup) continue;
      workingSets += 1;
      volumeKg += set.weightKg * set.reps;
    }
  }

  return {
    durationMs: Math.max(0, workout.endedAt - workout.startedAt),
    volumeKg: Math.round(volumeKg * 100) / 100,
    workingSets,
    muscleGroups: [...muscleGroups],
  };
}

export type ProgressPoint = {
  workoutId: string;
  at: number;
  maxWeightKg: number;
  /** Bestes geschätztes Maximalgewicht (Epley) des Workouts, null ohne geeigneten Satz */
  oneRepMaxKg: number | null;
  /** Gewicht × Wiederholungen aller Arbeitssätze */
  volumeKg: number;
};

/** Höchstes Arbeitsgewicht je Workout für eine Übung, zeitlich aufsteigend. */
export function exerciseProgress(history: StrengthWorkout[], exerciseId: string): ProgressPoint[] {
  const points: ProgressPoint[] = [];

  for (const workout of history) {
    const sets = workout.exercises
      .filter((exercise) => exercise.exerciseId === exerciseId)
      .flatMap((exercise) => exercise.sets.filter((set) => !set.isWarmup && set.reps > 0));

    if (sets.length > 0) {
      const estimates = sets
        .map((set) => estimateOneRepMax(set.weightKg, set.reps))
        .filter((value): value is number => value !== null);
      points.push({
        workoutId: workout.id,
        at: workout.startedAt,
        maxWeightKg: Math.max(...sets.map((set) => set.weightKg)),
        oneRepMaxKg: estimates.length > 0 ? Math.max(...estimates) : null,
        volumeKg: Math.round(sets.reduce((sum, set) => sum + set.weightKg * set.reps, 0) * 100) / 100,
      });
    }
  }

  return points.sort((a, b) => a.at - b.at);
}

/** Letzter Arbeitssatz einer Übung aus dem Verlauf, dient als Vorbelegung für neue Sätze. */
export function lastWorkingSet(history: StrengthWorkout[], exerciseId: string): LoggedExercise['sets'][number] | null {
  const sorted = [...history].sort((a, b) => b.startedAt - a.startedAt);

  for (const workout of sorted) {
    for (const exercise of workout.exercises) {
      if (exercise.exerciseId !== exerciseId) continue;
      const working = exercise.sets.filter((set) => !set.isWarmup);
      if (working.length > 0) return working[working.length - 1];
    }
  }
  return null;
}

export type ExerciseLogEntry = {
  workoutId: string;
  at: number;
  /** Arbeitssätze in Reihenfolge (ohne Aufwärmsätze) */
  sets: { weightKg: number; reps: number }[];
  warmups: number;
  volumeKg: number;
};

/** Die letzten Einheiten einer Übung, neueste zuerst, nur mit mindestens einem Arbeitssatz. */
export function exerciseLog(history: StrengthWorkout[], exerciseId: string, limit = 5): ExerciseLogEntry[] {
  const entries: ExerciseLogEntry[] = [];
  for (const workout of [...history].sort((a, b) => b.startedAt - a.startedAt)) {
    const sets = workout.exercises
      .filter((exercise) => exercise.exerciseId === exerciseId)
      .flatMap((exercise) => exercise.sets);
    const working = sets.filter((set) => !set.isWarmup && set.reps > 0);
    if (working.length === 0) continue;
    entries.push({
      workoutId: workout.id,
      at: workout.startedAt,
      sets: working.map((set) => ({ weightKg: set.weightKg, reps: set.reps })),
      warmups: sets.length - sets.filter((set) => !set.isWarmup).length,
      volumeKg: working.reduce((sum, set) => sum + set.weightKg * set.reps, 0),
    });
    if (entries.length >= limit) break;
  }
  return entries;
}

/**
 * Kurzschreibweise für Sätze: aufeinanderfolgende Sätze mit gleichem Gewicht werden gebündelt,
 * z.B. "80 kg × 8, 8, 7 · 85 kg × 5". Ohne Gewicht: "12, 10, 9 Wdh.".
 */
export function compactSets(sets: { weightKg: number; reps: number }[], formatWeight: (kg: number) => string): string {
  const groups: { weightKg: number; reps: number[] }[] = [];
  for (const set of sets) {
    const last = groups[groups.length - 1];
    if (last && last.weightKg === set.weightKg) last.reps.push(set.reps);
    else groups.push({ weightKg: set.weightKg, reps: [set.reps] });
  }
  return groups
    .map((group) =>
      group.weightKg > 0 ? `${formatWeight(group.weightKg)} × ${group.reps.join(', ')}` : `${group.reps.join(', ')} Wdh.`,
    )
    .join(' · ');
}

/** Zuletzt trainierte Übungen ohne Doppelte, neueste zuerst. */
export function recentExerciseIds(history: StrengthWorkout[], limit = 8, exclude: readonly string[] = []): string[] {
  const seen = new Set<string>(exclude);
  const result: string[] = [];
  for (const workout of [...history].sort((a, b) => b.startedAt - a.startedAt)) {
    for (const exercise of workout.exercises) {
      if (seen.has(exercise.exerciseId)) continue;
      seen.add(exercise.exerciseId);
      result.push(exercise.exerciseId);
      if (result.length >= limit) return result;
    }
  }
  return result;
}
