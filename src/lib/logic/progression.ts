import type { Equipment, MuscleGroup, StrengthWorkout } from '../../types/workout.ts';
import { kgToDisplay, type Units } from './units.ts';

/**
 * Progressions-Tipp für das laufende Workout nach dem Prinzip der doppelten Progression:
 * erst Wiederholungen steigern, bei Erreichen der Obergrenze das Gewicht erhöhen und
 * mit weniger Wiederholungen weitermachen. Progressive Überlastung ist der zentrale Treiber
 * für Kraft- und Muskelzuwachs (ACSM 2009; Plotkin et al. 2022: Wiederholungs- und
 * Gewichtssteigerung wirken ähnlich gut).
 */

export const REP_CEILING = 12;
export const BODYWEIGHT_CEILING = 20;

export type ProgressionAction = 'first' | 'weight' | 'reps' | 'hold' | 'harder';

export type ProgressionTip = {
  action: ProgressionAction;
  /** Arbeitssätze des letzten Trainings dieser Übung */
  last: { weight: number; reps: number[] } | null;
  /** Empfehlung in Anzeigeeinheit; null bei Körpergewicht oder ohne Verlauf */
  weight: number | null;
  reps: number | null;
  text: string;
};

type ExerciseInfo = { equipment: Equipment; muscleGroup: MuscleGroup };

/** Sinnvoller Gewichtssprung in Anzeigeeinheit: klein bei Kurzhanteln, größer bei Beinen. */
export function weightStep(info: ExerciseInfo, units: Units): number {
  const lower = info.muscleGroup === 'Beine' || info.muscleGroup === 'Gesäß';
  const metric = info.equipment === 'Kurzhantel' ? 2 : info.equipment === 'Kettlebell' ? 4 : lower ? 5 : 2.5;
  if (units === 'metric') return metric;
  return info.equipment === 'Kurzhantel' || !lower ? 5 : 10;
}

/** Auf ladbare Gewichte runden: 0,25 kg bzw. 2,5 lb. */
function roundDisplay(value: number, units: Units): number {
  return units === 'metric' ? Math.round(value * 4) / 4 : Math.round(value / 2.5) * 2.5;
}

export function progressionTip(
  history: readonly StrengthWorkout[],
  exerciseId: string,
  info: ExerciseInfo,
  units: Units,
): ProgressionTip {
  const sorted = [...history].sort((a, b) => b.startedAt - a.startedAt);
  let sets: { weightKg: number; reps: number; rpe: number | null }[] = [];
  for (const workout of sorted) {
    const exercise = workout.exercises.find((e) => e.exerciseId === exerciseId);
    const working = exercise?.sets.filter((set) => !set.isWarmup && set.reps > 0) ?? [];
    if (working.length > 0) {
      sets = working;
      break;
    }
  }

  if (sets.length === 0) {
    return {
      action: 'first',
      last: null,
      weight: null,
      reps: null,
      text: 'Erstes Mal: Starte leicht und finde ein Gewicht, mit dem 8 bis 12 saubere Wiederholungen klappen.',
    };
  }

  const topKg = Math.max(...sets.map((set) => set.weightKg));
  const top = sets.filter((set) => set.weightKg === topKg);
  const reps = top.map((set) => set.reps);
  const minReps = Math.min(...reps);
  const maxReps = Math.max(...reps);
  const topDisplay = roundDisplay(kgToDisplay(topKg, units), units);
  const last = { weight: topDisplay, reps };
  const veryHard = top.some((set) => set.rpe !== null && set.rpe >= 9.5);

  if (topKg === 0) {
    if (minReps >= BODYWEIGHT_CEILING) {
      return {
        action: 'harder',
        last,
        weight: null,
        reps: null,
        text: `${minReps}+ Wiederholungen in jedem Satz: Zeit für eine schwerere Variante oder Zusatzgewicht.`,
      };
    }
    return {
      action: 'reps',
      last,
      weight: null,
      reps: maxReps + 1,
      text: `Heute ${maxReps + 1} Wiederholungen pro Satz anpeilen.`,
    };
  }

  if (veryHard) {
    return {
      action: 'hold',
      last,
      weight: topDisplay,
      reps: maxReps,
      text: 'Letztes Mal war am Limit. Gleiches Gewicht, Sätze sauber und stabil halten.',
    };
  }

  if (minReps >= REP_CEILING) {
    const weight = topDisplay + weightStep(info, units);
    return {
      action: 'weight', last, weight,
      reps: 8,
      text: 'Obergrenze geschafft! Heute mehr Gewicht mit rund 8 Wiederholungen.',
    };
  }

  if (maxReps - minReps >= 3) {
    return {
      action: 'hold',
      last,
      weight: topDisplay,
      reps: minReps + 1,
      text: 'Gleiches Gewicht und die schwächeren Sätze an die stärksten heranführen.',
    };
  }

  return {
    action: 'reps',
    last,
    weight: topDisplay,
    reps: maxReps + 1,
    text: 'Gleiches Gewicht, heute eine Wiederholung mehr pro Satz.',
  };
}
