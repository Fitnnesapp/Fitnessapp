import type { Equipment } from '../../types/workout.ts';
import type { Units } from './units.ts';

/**
 * Aufwärmsätze zum Arbeitsgewicht: steigende Last, sinkende Wiederholungen, damit die Muskulatur
 * vorbereitet, aber nicht ermüdet ist (übliche Praxis, z.B. NSCA-Empfehlungen zum spezifischen Aufwärmen).
 */
export type WarmupSet = { weight: number; reps: number };

const RAMPS: Record<'heavy' | 'light', [share: number, reps: number][]> = {
  heavy: [
    [0.5, 8],
    [0.7, 5],
    [0.85, 3],
  ],
  light: [
    [0.5, 10],
    [0.75, 5],
  ],
};

/** Kleinster sinnvoller Schritt: 2,5 kg bzw. 5 lb, bei Kurzhanteln 2 kg bzw. 5 lb. */
function roundTo(value: number, units: Units, equipment: Equipment): number {
  const step = units === 'imperial' ? 5 : equipment === 'Kurzhantel' ? 2 : 2.5;
  return Math.round(value / step) * step;
}

/**
 * Aufwärmsätze für ein Arbeitsgewicht in Anzeigeeinheit. Leer bei Körpergewicht oder sehr leichtem Gewicht.
 * Langhantel: nie unter dem Stangengewicht (20 kg bzw. 45 lb).
 */
export function warmupSets(workWeight: number, equipment: Equipment, units: Units): WarmupSet[] {
  if (equipment === 'Körpergewicht' || !Number.isFinite(workWeight)) return [];
  const minimum = units === 'imperial' ? 25 : 12;
  if (workWeight < minimum) return [];

  const bar = units === 'imperial' ? 45 : 20;
  const heavy = equipment === 'Langhantel' || equipment === 'Maschine';
  const result: WarmupSet[] = [];
  for (const [share, reps] of RAMPS[heavy ? 'heavy' : 'light']) {
    let weight = roundTo(workWeight * share, units, equipment);
    if (equipment === 'Langhantel') weight = Math.max(bar, weight);
    if (weight <= 0 || weight >= workWeight) continue;
    if (result.some((set) => set.weight === weight)) continue;
    result.push({ weight, reps });
  }
  return result;
}
