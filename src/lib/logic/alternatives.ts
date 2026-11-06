import type { Exercise } from '../../types/workout.ts';

const LEVEL = { Einsteiger: 0, Fortgeschritten: 1, Profi: 2 } as const;

/**
 * Alternativen für eine Übung, z.B. wenn das Gerät besetzt ist oder zu Hause etwas fehlt:
 * gleiche Muskelgruppe, bevorzugt anderes Gerät und ähnliches Niveau.
 */
export function alternativesFor(exercise: Exercise, all: readonly Exercise[], limit = 4): Exercise[] {
  return all
    .filter((other) => other.id !== exercise.id && other.muscleGroup === exercise.muscleGroup)
    .map((other) => ({
      other,
      score:
        (other.equipment !== exercise.equipment ? 2 : 0) - Math.abs(LEVEL[other.difficulty] - LEVEL[exercise.difficulty]),
    }))
    .sort((a, b) => b.score - a.score || a.other.name.localeCompare(b.other.name, 'de'))
    .slice(0, limit)
    .map(({ other }) => other);
}
