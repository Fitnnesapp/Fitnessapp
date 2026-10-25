import type { StrengthWorkout } from '../../types/workout.ts';
import type { Units } from './units.ts';

/**
 * Kraft-Rechner: geschätztes Maximalgewicht (1RM) und Hantelscheiben pro Seite.
 * Alle Werte in der Anzeige-Einheit (kg oder lb), nur bestOneRepMax arbeitet mit gespeicherten kg.
 */

/** Über 12 Wiederholungen wird die Schätzung zu ungenau. */
export const MAX_REPS_FOR_ESTIMATE = 12;

/** Epley-Formel: Gewicht × (1 + Wiederholungen / 30). Ein Satz mit 1 Wiederholung ist das 1RM selbst. */
export function estimateOneRepMax(weight: number, reps: number): number | null {
  if (!(weight > 0) || !Number.isInteger(reps) || reps < 1 || reps > MAX_REPS_FOR_ESTIMATE) return null;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/** Rundet auf die nächste ladbare Stufe (z. B. 2,5 kg). */
export function roundToStep(value: number, step: number): number {
  if (!(step > 0)) return value;
  return Math.round(Math.round(value / step) * step * 100) / 100;
}

export const LOAD_STEP: Record<Units, number> = { metric: 2.5, imperial: 5 };

/** Prozent vom 1RM mit typischer Wiederholungszahl, wie in gängigen Trainingstabellen. */
const PERCENT_REPS: [number, number][] = [
  [100, 1],
  [95, 2],
  [90, 4],
  [85, 6],
  [80, 8],
  [75, 10],
  [70, 12],
  [65, 15],
  [60, 20],
];

/** Rundet auf die nächstniedrigere ladbare Stufe: Trainingsgewichte sollen nie über dem Ziel liegen. */
export function roundDownToStep(value: number, step: number): number {
  if (!(step > 0)) return value;
  // kleiner Zuschlag gegen Gleitkomma-Fehler wie 84.99999
  return Math.round(Math.floor(value / step + 1e-9) * step * 100) / 100;
}

export type PercentRow = { percent: number; weight: number; reps: number };

/** Trainingsgewichte je Prozentstufe, abgerundet, damit 100 % nie über dem geschätzten 1RM liegt. */
export function percentTable(oneRepMax: number, step: number): PercentRow[] {
  return PERCENT_REPS.map(([percent, reps]) => ({ percent, reps, weight: roundDownToStep((oneRepMax * percent) / 100, step) }));
}

export type BestEstimate = { oneRepMaxKg: number; weightKg: number; reps: number; at: number };

/** Höchstes geschätztes 1RM einer Übung über alle Arbeitssätze (in kg). */
export function bestOneRepMax(history: StrengthWorkout[], exerciseId: string): BestEstimate | null {
  let best: BestEstimate | null = null;
  for (const workout of history) {
    for (const exercise of workout.exercises) {
      if (exercise.exerciseId !== exerciseId) continue;
      for (const set of exercise.sets) {
        if (set.isWarmup) continue;
        const estimate = estimateOneRepMax(set.weightKg, set.reps);
        if (estimate !== null && (best === null || estimate > best.oneRepMaxKg)) {
          best = { oneRepMaxKg: estimate, weightKg: set.weightKg, reps: set.reps, at: workout.startedAt };
        }
      }
    }
  }
  return best;
}

export const PLATES: Record<Units, number[]> = {
  metric: [25, 20, 15, 10, 5, 2.5, 1.25],
  imperial: [45, 35, 25, 10, 5, 2.5],
};

export const BARS: Record<Units, number[]> = {
  metric: [20, 15, 10],
  imperial: [45, 35, 15],
};

export type PlateResult = {
  /** Scheiben für EINE Seite, schwerste zuerst */
  perSide: number[];
  /** Tatsächlich geladenes Gesamtgewicht mit Stange */
  loaded: number;
  /** Fehlendes Gewicht, das mit den Scheiben nicht erreichbar ist (0 = passt genau) */
  missing: number;
};

/**
 * Welche Scheiben pro Seite auf die Stange müssen. Rechnet in Hundertsteln, damit 1,25er-Scheiben
 * keine Rundungsfehler erzeugen. Ziel unter dem Stangengewicht ergibt eine leere Stange.
 */
export function platesPerSide(target: number, bar: number, plates: number[]): PlateResult {
  const toInt = (v: number) => Math.round(v * 100);
  let remaining = Math.max(0, toInt(target) - toInt(bar));
  // Pro Seite die Hälfte, ungerade Hundertstel sind nicht ladbar
  let perSideLeft = Math.floor(remaining / 2);
  const perSide: number[] = [];

  for (const plate of [...plates].sort((a, b) => b - a)) {
    const p = toInt(plate);
    if (p <= 0) continue;
    while (perSideLeft >= p) {
      perSide.push(plate);
      perSideLeft -= p;
    }
  }

  const loadedInt = toInt(bar) + perSide.reduce((sum, p) => sum + toInt(p), 0) * 2;
  remaining = Math.max(0, toInt(target) - loadedInt);
  return { perSide, loaded: loadedInt / 100, missing: remaining / 100 };
}
