import type { LoggedExercise, StrengthWorkout } from '../../types/workout.ts';

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

export type ProgressPoint = { workoutId: string; at: number; maxWeightKg: number };

/** Höchstes Arbeitsgewicht je Workout für eine Übung, zeitlich aufsteigend. */
export function exerciseProgress(history: StrengthWorkout[], exerciseId: string): ProgressPoint[] {
  const points: ProgressPoint[] = [];

  for (const workout of history) {
    const weights = workout.exercises
      .filter((exercise) => exercise.exerciseId === exerciseId)
      .flatMap((exercise) => exercise.sets.filter((set) => !set.isWarmup && set.reps > 0))
      .map((set) => set.weightKg);

    if (weights.length > 0) {
      points.push({ workoutId: workout.id, at: workout.startedAt, maxWeightKg: Math.max(...weights) });
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
