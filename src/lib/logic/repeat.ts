import type { HomeSession } from '../../types/home.ts';
import type { RunSession } from '../../types/running.ts';
import type { DraftExercise, StrengthWorkout } from '../../types/workout.ts';
import { kgToDisplay, type Units } from './units.ts';

/**
 * "Nochmal machen": die zuletzt trainierten, unterschiedlichen Einheiten zum direkten Wiederholen.
 * Gleiche Krafttrainings (gleiche Übungen in gleicher Reihenfolge) und gleiche Programme erscheinen nur einmal.
 */

export const REPEAT_LIMIT = 3;

export type RepeatOption =
  | { kind: 'strength'; workoutId: string; at: number; exerciseIds: string[]; sets: number }
  | { kind: 'home'; programId: string; at: number }
  | { kind: 'run'; at: number; distanceM: number };

export function repeatOptions(
  strength: StrengthWorkout[],
  home: HomeSession[],
  runs: RunSession[],
  limit = REPEAT_LIMIT,
): RepeatOption[] {
  const all: RepeatOption[] = [
    ...strength
      .filter((w) => w.exercises.length > 0)
      .map(
        (w): RepeatOption => ({
          kind: 'strength',
          workoutId: w.id,
          at: w.startedAt,
          exerciseIds: w.exercises.map((e) => e.exerciseId),
          sets: w.exercises.reduce((sum, e) => sum + e.sets.length, 0),
        }),
      ),
    ...home.map((s): RepeatOption => ({ kind: 'home', programId: s.programId, at: s.startedAt })),
    ...runs.map((r): RepeatOption => ({ kind: 'run', at: r.startedAt, distanceM: r.distanceM })),
  ].sort((a, b) => b.at - a.at);

  const seen = new Set<string>();
  const result: RepeatOption[] = [];
  for (const option of all) {
    const key =
      option.kind === 'strength'
        ? `s:${option.exerciseIds.join(',')}`
        : option.kind === 'home'
          ? `h:${option.programId}`
          : 'r';
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(option);
    if (result.length >= limit) break;
  }
  return result;
}

/**
 * Übernimmt ein gespeichertes Krafttraining als neuen Entwurf: gleiche Übungen, gleiche Sätze,
 * Gewichte und Wiederholungen vorbelegt, aber noch nicht abgehakt.
 */
export function draftFromWorkout(workout: StrengthWorkout, units: Units, newId: () => string): DraftExercise[] {
  return workout.exercises.map((exercise) => ({
    exerciseId: exercise.exerciseId,
    sets: exercise.sets.map((set) => ({
      id: newId(),
      weight: set.weightKg > 0 ? String(kgToDisplay(set.weightKg, units)) : '',
      reps: String(set.reps),
      rpe: '',
      isWarmup: set.isWarmup,
      done: false,
    })),
  }));
}
