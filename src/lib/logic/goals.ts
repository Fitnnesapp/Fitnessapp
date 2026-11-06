import type { StrengthWorkout } from '../../types/workout.ts';

/**
 * Persönliche Kraftziele, z.B. "100 kg Bankdrücken". Ein konkretes, selbst gewähltes Ziel mit sichtbarem
 * Abstand motiviert stärker als ein vages "stärker werden" (Locke & Latham 2002; Goal-Gradient, Kivetz et al. 2006).
 */
export type StrengthGoal = {
  id: string;
  exerciseId: string;
  targetKg: number;
  /** Bestes Gewicht beim Anlegen (für spätere Auswertungen, z.B. Zuwachs seit dem Ziel) */
  startKg: number;
  createdAt: number;
};

export type GoalProgress = {
  currentKg: number;
  /**
   * Anteil am Zielgewicht von 0 bis 1. Bewusst ab 0 gerechnet, nicht ab dem Startwert: schon erreichter
   * Fortschritt bleibt sichtbar (Endowed-Progress-Effekt, Nunes & Drèze 2006).
   */
  ratio: number;
  remainingKg: number;
  achieved: boolean;
  /** Erstes Workout, in dem das Ziel erreicht wurde (nach dem Anlegen) */
  achievedAt: number | null;
};

/** Schwerstes Gewicht in einem Arbeitssatz mit mindestens einer Wiederholung. 0 ohne Verlauf. */
export function bestWeight(history: readonly StrengthWorkout[], exerciseId: string, until = Infinity): number {
  let best = 0;
  for (const workout of history) {
    if (workout.startedAt > until) continue;
    for (const exercise of workout.exercises) {
      if (exercise.exerciseId !== exerciseId) continue;
      for (const set of exercise.sets) if (!set.isWarmup && set.reps > 0) best = Math.max(best, set.weightKg);
    }
  }
  return best;
}

export function goalProgress(goal: StrengthGoal, history: readonly StrengthWorkout[]): GoalProgress {
  const currentKg = bestWeight(history, goal.exerciseId);
  const ratio = goal.targetKg <= 0 ? 1 : Math.min(1, Math.max(0, currentKg / goal.targetKg));
  const achieved = currentKg >= goal.targetKg;

  let achievedAt: number | null = null;
  if (achieved) {
    const sorted = [...history].filter((w) => w.startedAt >= goal.createdAt).sort((a, b) => a.startedAt - b.startedAt);
    achievedAt = sorted.find((w) => bestWeight([w], goal.exerciseId) >= goal.targetKg)?.startedAt ?? null;
  }

  return {
    currentKg,
    ratio,
    remainingKg: Math.max(0, Math.round((goal.targetKg - currentKg) * 100) / 100),
    achieved,
    achievedAt,
  };
}

/**
 * Prüft eine Zieleingabe: muss über dem aktuellen Bestwert liegen und realistisch sein
 * (höchstens das Doppelte + 20 kg; ohne bisherigen Wert höchstens 300 kg gegen Tippfehler).
 */
export function validateGoal(targetKg: number | null, currentKg: number): string | null {
  if (targetKg === null || !(targetKg > 0)) return 'Bitte ein Zielgewicht eingeben.';
  if (targetKg <= currentKg) return 'Das hast du schon geschafft. Wähle ein höheres Ziel.';
  if (targetKg > (currentKg > 0 ? currentKg * 2 + 20 : 300)) return 'Das ist ein sehr großer Sprung. Setz dir lieber ein näheres Zwischenziel.';
  return null;
}

/** Das offene Ziel, das am nächsten dran ist (Goal-Gradient: kurz vor dem Ziel steigt der Einsatz). */
export function closestGoal(goals: readonly StrengthGoal[], history: readonly StrengthWorkout[]): StrengthGoal | null {
  let best: { goal: StrengthGoal; ratio: number } | null = null;
  for (const goal of goals) {
    const progress = goalProgress(goal, history);
    if (progress.achieved) continue;
    if (!best || progress.ratio > best.ratio) best = { goal, ratio: progress.ratio };
  }
  return best?.goal ?? null;
}
