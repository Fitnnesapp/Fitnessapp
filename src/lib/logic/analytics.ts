import type { StrengthWorkout } from '../../types/workout.ts';

export type MuscleVolume = { group: string; volumeKg: number };

const DAY_MS = 86400000;

/**
 * Trainingsvolumen (kg) je Muskelgruppe in den letzten `days` Tagen, absteigend sortiert.
 * Aufwärmsätze zählen nicht. Übungen ohne bekannte Muskelgruppe werden übersprungen.
 */
export function muscleVolume(
  history: StrengthWorkout[],
  days: number,
  now: number,
  muscleGroupOf: (exerciseId: string) => string | undefined,
): MuscleVolume[] {
  const since = now - days * DAY_MS;
  const totals = new Map<string, number>();

  for (const workout of history) {
    if (workout.startedAt < since || workout.startedAt > now) continue;

    for (const exercise of workout.exercises) {
      const group = muscleGroupOf(exercise.exerciseId);
      if (!group) continue;

      const volume = exercise.sets.reduce((sum, set) => (set.isWarmup ? sum : sum + set.weightKg * set.reps), 0);
      totals.set(group, (totals.get(group) ?? 0) + volume);
    }
  }

  return [...totals.entries()]
    .map(([group, volumeKg]) => ({ group, volumeKg: Math.round(volumeKg) }))
    .filter((entry) => entry.volumeKg > 0)
    .sort((a, b) => b.volumeKg - a.volumeKg);
}
