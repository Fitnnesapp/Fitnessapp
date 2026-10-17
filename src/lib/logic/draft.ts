import type { ActiveWorkout, DraftSet, LoggedSet, StrengthWorkout } from '../../types/workout.ts';
import { displayToKg, parseNumber, type Units } from './units.ts';

/** Wandelt einen erledigten Satz in einen gespeicherten um. Ungültige Eingaben ergeben null. */
export function logDraftSet(set: DraftSet, units: Units): LoggedSet | null {
  if (!set.done) return null;

  const reps = parseNumber(set.reps);
  if (reps === null || reps <= 0) return null;

  // Leeres Gewicht heißt Körpergewicht, also 0
  const weight = set.weight.trim() === '' ? 0 : parseNumber(set.weight);
  if (weight === null) return null;

  const rpe = parseNumber(set.rpe);

  return {
    id: set.id,
    weightKg: displayToKg(weight, units),
    reps: Math.round(reps),
    rpe: rpe !== null && rpe >= 1 && rpe <= 10 ? rpe : null,
    isWarmup: set.isWarmup,
  };
}

/** Übernimmt nur erledigte, gültige Sätze; Übungen ohne solche Sätze entfallen. */
export function finalizeDraft(draft: ActiveWorkout, units: Units, endedAt: number): StrengthWorkout {
  const exercises = draft.exercises
    .map((exercise) => ({
      exerciseId: exercise.exerciseId,
      sets: exercise.sets.map((set) => logDraftSet(set, units)).filter((set): set is LoggedSet => set !== null),
    }))
    .filter((exercise) => exercise.sets.length > 0);

  return { id: draft.id, type: 'strength', startedAt: draft.startedAt, endedAt, exercises };
}
