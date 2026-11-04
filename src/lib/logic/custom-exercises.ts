import type { Equipment, Exercise, MuscleGroup } from '@/types/workout';

/**
 * Eigene Übungen: alles, was in der Bibliothek fehlt (z.B. ein bestimmtes Gerät im Studio).
 * Sie bekommen eine eigene ID-Vorsilbe, damit sie nie mit mitgelieferten Übungen kollidieren.
 */
export const CUSTOM_EXERCISE_PREFIX = 'eigene-uebung-';

export const CUSTOM_EXERCISE_LIMITS = {
  nameMin: 2,
  nameMax: 40,
  notesMax: 300,
  maxCount: 100,
} as const;

export type CustomExerciseInput = {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  instructions?: string;
};

export function isCustomExercise(id: string): boolean {
  return id.startsWith(CUSTOM_EXERCISE_PREFIX);
}

/** Entfernt doppelte Leerzeichen und Ränder. */
export function cleanExerciseName(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}

/** Fehlertext für die Eingabe oder null, wenn alles passt. */
export function validateCustomExercise(input: CustomExerciseInput, existing: readonly Exercise[]): string | null {
  const name = cleanExerciseName(input.name);
  if (name.length < CUSTOM_EXERCISE_LIMITS.nameMin) return 'Gib der Übung einen Namen (mindestens 2 Zeichen).';
  if (name.length > CUSTOM_EXERCISE_LIMITS.nameMax) {
    return `Der Name darf höchstens ${CUSTOM_EXERCISE_LIMITS.nameMax} Zeichen haben.`;
  }
  const lower = name.toLocaleLowerCase('de');
  if (existing.some((exercise) => exercise.name.toLocaleLowerCase('de') === lower)) {
    return 'Eine Übung mit diesem Namen gibt es schon.';
  }
  if (existing.filter((exercise) => isCustomExercise(exercise.id)).length >= CUSTOM_EXERCISE_LIMITS.maxCount) {
    return `Du kannst höchstens ${CUSTOM_EXERCISE_LIMITS.maxCount} eigene Übungen anlegen.`;
  }
  return null;
}

/** Erstellt die Übung. Vorher mit validateCustomExercise prüfen. */
export function createCustomExercise(input: CustomExerciseInput, now: number, random = Math.random()): Exercise {
  const notes = (input.instructions ?? '').replace(/\s+/g, ' ').trim().slice(0, CUSTOM_EXERCISE_LIMITS.notesMax);
  return {
    id: `${CUSTOM_EXERCISE_PREFIX}${now.toString(36)}${Math.floor(random * 1e6).toString(36)}`,
    name: cleanExerciseName(input.name).slice(0, CUSTOM_EXERCISE_LIMITS.nameMax),
    muscleGroup: input.muscleGroup,
    equipment: input.equipment,
    difficulty: 'Einsteiger',
    instructions: notes,
    custom: true,
  };
}

type UsageSources = {
  history: readonly { exercises: readonly { exerciseId: string }[] }[];
  templates: readonly { exerciseIds: readonly string[] }[];
  active: { exercises: readonly { exerciseId: string }[] } | null;
  goals: readonly { exerciseId: string }[];
};

/**
 * Wo eine Übung verwendet wird. Solange sie in Workouts, Vorlagen oder Zielen steckt,
 * bleibt sie erhalten, damit der Verlauf lesbar bleibt.
 */
export function exerciseUsage(id: string, sources: UsageSources) {
  const workouts = sources.history.filter((workout) => workout.exercises.some((e) => e.exerciseId === id)).length;
  const templates = sources.templates.filter((template) => template.exerciseIds.includes(id)).length;
  const inActive = sources.active?.exercises.some((e) => e.exerciseId === id) ?? false;
  const goal = sources.goals.some((g) => g.exerciseId === id);
  return { workouts, templates, inActive, goal, used: workouts > 0 || templates > 0 || inActive || goal };
}
