import type { Difficulty, MuscleGroup, Routine, RoutineSetting, StrengthWorkout } from '../../types/workout.ts';

/**
 * Logik für fertige Kraft-Workouts: Dauer schätzen, Muskelgruppen zählen und das Workout
 * vorschlagen, das heute am besten passt.
 *
 * Der Vorschlag folgt der Erholung: Eine Muskelgruppe braucht nach hartem Training etwa
 * 48 bis 72 Stunden (z.B. McLester et al. 2003), und zwei Einheiten pro Muskel und Woche
 * bringen mehr als eine (Schoenfeld, Ogborn & Krieger 2016). Deshalb gewinnt das Workout,
 * dessen Hauptmuskeln am längsten ausgeruht sind.
 */

/** Sekunden reine Arbeit pro Satz, für die Zeitschätzung. */
const WORK_SECONDS = 40;
/** Aufwärmen, Gerät einstellen und Wechsel pro Übung. */
const SETUP_SECONDS = 60;
/** Ab so vielen Stunden gilt ein Muskel als voll erholt. */
const FULL_RECOVERY_HOURS = 72;

export type MuscleLookup = (exerciseId: string) => MuscleGroup | undefined;

/** Geschätzte Dauer in Minuten, auf 5 Minuten gerundet (mindestens 10). */
export function routineMinutes(routine: Routine): number {
  const seconds = routine.items.reduce((sum, item) => sum + item.sets * (WORK_SECONDS + item.restSeconds) + SETUP_SECONDS, 0);
  return Math.max(10, Math.round(seconds / 60 / 5) * 5);
}

export function routineSetCount(routine: Routine): number {
  return routine.items.reduce((sum, item) => sum + item.sets, 0);
}

/** Untere Grenze einer Vorgabe wie "8–10", "30–45 s" oder "10 je Bein". null, wenn keine Zahl darin steht. */
export function targetReps(reps: string): number | null {
  const match = reps.match(/\d+/);
  if (!match) return null;
  const value = Number(match[0]);
  return value > 0 ? value : null;
}

export type MuscleShare = { muscle: MuscleGroup; sets: number };

/** Muskelgruppen eines Workouts nach Anzahl Sätze, die größte zuerst. */
export function routineMuscles(routine: Routine, muscleOf: MuscleLookup): MuscleShare[] {
  const sets = new Map<MuscleGroup, number>();
  for (const item of routine.items) {
    const muscle = muscleOf(item.exerciseId);
    if (!muscle) continue;
    sets.set(muscle, (sets.get(muscle) ?? 0) + item.sets);
  }
  return [...sets.entries()].map(([muscle, count]) => ({ muscle, sets: count })).sort((a, b) => b.sets - a.sets);
}

/** Wann jede Muskelgruppe zuletzt mit mindestens einem Arbeitssatz trainiert wurde. */
export function lastTrainedByMuscle(history: readonly StrengthWorkout[], muscleOf: MuscleLookup): Map<MuscleGroup, number> {
  const last = new Map<MuscleGroup, number>();
  for (const workout of history) {
    for (const exercise of workout.exercises) {
      if (!exercise.sets.some((set) => !set.isWarmup)) continue;
      const muscle = muscleOf(exercise.exerciseId);
      if (!muscle) continue;
      if ((last.get(muscle) ?? -Infinity) < workout.startedAt) last.set(muscle, workout.startedAt);
    }
  }
  return last;
}

export type RoutinePreferences = {
  setting?: RoutineSetting;
  /** Einsteiger bekommen keine Fortgeschrittenen-Workouts vorgeschlagen. */
  difficulty?: Difficulty;
};

export type RoutineSuggestion = { routine: Routine; reason: string };

function joinGerman(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} und ${items[items.length - 1]}`;
}

/** Schlägt das Workout vor, dessen Hauptmuskeln am besten erholt sind. null bei leerer Liste. */
export function suggestRoutine(
  routines: readonly Routine[],
  history: readonly StrengthWorkout[],
  now: number,
  muscleOf: MuscleLookup,
  preferences: RoutinePreferences = {},
): RoutineSuggestion | null {
  let pool = routines.filter((routine) => !preferences.setting || routine.setting === preferences.setting);
  if (pool.length === 0) pool = [...routines];
  if (preferences.difficulty === 'Einsteiger') {
    const easy = pool.filter((routine) => routine.difficulty === 'Einsteiger');
    if (easy.length > 0) pool = easy;
  }
  // Reine Rumpf-Einheiten ergänzen, sie ersetzen kein Haupttraining
  const main = pool.filter((routine) => routine.focus !== 'Rumpf');
  if (main.length > 0) pool = main;
  if (pool.length === 0) return null;

  const last = lastTrainedByMuscle(history, muscleOf);
  const recovery = (muscle: MuscleGroup) => {
    const at = last.get(muscle);
    if (at === undefined) return 1;
    return Math.min(1, Math.max(0, (now - at) / 3_600_000 / FULL_RECOVERY_HOURS));
  };

  let best: { routine: Routine; score: number; main: MuscleShare[] } | null = null;
  for (const routine of pool) {
    const main = routineMuscles(routine, muscleOf).slice(0, 3);
    const totalSets = main.reduce((sum, share) => sum + share.sets, 0);
    const score = totalSets === 0 ? 0 : main.reduce((sum, share) => sum + recovery(share.muscle) * share.sets, 0) / totalSets;
    if (!best || score > best.score + 1e-9) best = { routine, score, main };
  }
  if (!best) return null;

  const names = best.main.slice(0, 2).map((share) => share.muscle);
  const neverTrained = names.filter((muscle) => !last.has(muscle));
  let reason: string;
  if (history.length === 0) {
    reason = 'Ein guter Start: deckt die wichtigsten Muskelgruppen ab.';
  } else if (neverTrained.length === names.length) {
    reason = `Neuer Reiz: ${joinGerman(names)} hast du hier noch nicht trainiert.`;
  } else {
    // Nur Muskeln nennen, die wirklich erholt sind (mindestens 2 Tage Pause oder nie trainiert)
    const days = (muscle: MuscleGroup) => {
      const at = last.get(muscle);
      return at === undefined ? Infinity : Math.floor((now - at) / 86_400_000);
    };
    const rested = names.filter((muscle) => days(muscle) >= 2);
    const restedDays = Math.min(...rested.map(days));
    if (rested.length === 0) {
      reason = 'Passt am besten zu dem, was du zuletzt trainiert hast.';
    } else if (restedDays === Infinity) {
      reason = `Neuer Reiz: ${joinGerman(rested)} hast du hier noch nicht trainiert.`;
    } else {
      reason = `${joinGerman(rested)} ${rested.length > 1 ? 'sind' : 'ist'} seit ${restedDays} Tagen erholt und bereit.`;
    }
  }
  return { routine: best.routine, reason };
}

/** Leitet Ort und Niveau für den Vorschlag aus den Plan-Antworten ab (ohne Plan: keine Einschränkung). */
export function preferencesFromPlan(answers: { places: readonly string[]; level: string } | undefined): RoutinePreferences {
  if (!answers) return {};
  const studio = answers.places.includes('studio');
  const home = answers.places.includes('zuhause');
  return {
    setting: studio && !home ? 'Studio' : home && !studio ? 'Zuhause' : undefined,
    difficulty: answers.level === 'einsteiger' ? 'Einsteiger' : undefined,
  };
}
