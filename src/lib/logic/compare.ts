import type { StrengthWorkout } from '../../types/workout.ts';

/**
 * Vergleich eines Workouts mit dem letzten ähnlichen Training. Verglichen wird nur mit dir selbst:
 * sichtbarer persönlicher Fortschritt motiviert, ohne den Druck sozialer Vergleiche.
 */

export type ExerciseDelta = { exerciseId: string; topKgDelta: number; repsDelta: number };

export type WorkoutComparison = {
  previous: StrengthWorkout;
  volumeDeltaKg: number;
  /** Veränderung in Prozent, gerundet; null wenn das alte Volumen 0 war */
  volumePct: number | null;
  /** Nur Übungen, die in beiden Workouts vorkommen */
  exercises: ExerciseDelta[];
};

function volume(workout: StrengthWorkout, onlyIds?: Set<string>): number {
  let sum = 0;
  for (const exercise of workout.exercises) {
    if (onlyIds && !onlyIds.has(exercise.exerciseId)) continue;
    for (const set of exercise.sets) if (!set.isWarmup) sum += set.weightKg * set.reps;
  }
  return sum;
}

function topSet(workout: StrengthWorkout, exerciseId: string): { weightKg: number; reps: number } | null {
  let best: { weightKg: number; reps: number } | null = null;
  for (const exercise of workout.exercises) {
    if (exercise.exerciseId !== exerciseId) continue;
    for (const set of exercise.sets) {
      if (set.isWarmup) continue;
      if (!best || set.weightKg > best.weightKg || (set.weightKg === best.weightKg && set.reps > best.reps)) {
        best = { weightKg: set.weightKg, reps: set.reps };
      }
    }
  }
  return best;
}

const ids = (workout: StrengthWorkout) => new Set(workout.exercises.map((exercise) => exercise.exerciseId));

/**
 * Sucht das jüngste frühere Workout, das mindestens die Hälfte der Übungen teilt, und vergleicht
 * das Volumen der gemeinsamen Übungen. null, wenn es kein ähnliches Workout gibt.
 */
export function compareWithPrevious(history: readonly StrengthWorkout[], workoutId: string): WorkoutComparison | null {
  const current = history.find((workout) => workout.id === workoutId);
  if (!current) return null;
  const currentIds = ids(current);
  if (currentIds.size === 0) return null;

  const previous = [...history]
    .filter((workout) => workout.startedAt < current.startedAt)
    .sort((a, b) => b.startedAt - a.startedAt)
    .find((workout) => {
      const shared = [...ids(workout)].filter((id) => currentIds.has(id)).length;
      return shared > 0 && shared >= Math.ceil(currentIds.size / 2);
    });
  if (!previous) return null;

  const shared = new Set([...ids(previous)].filter((id) => currentIds.has(id)));
  const before = volume(previous, shared);
  const after = volume(current, shared);
  const exercises: ExerciseDelta[] = [];
  for (const id of shared) {
    const a = topSet(previous, id);
    const b = topSet(current, id);
    if (!a || !b) continue;
    exercises.push({
      exerciseId: id,
      topKgDelta: Math.round((b.weightKg - a.weightKg) * 100) / 100,
      repsDelta: b.reps - a.reps,
    });
  }

  return {
    previous,
    volumeDeltaKg: Math.round((after - before) * 100) / 100,
    volumePct: before > 0 ? Math.round(((after - before) / before) * 100) : null,
    exercises,
  };
}
