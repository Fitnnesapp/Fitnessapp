import type { MuscleGroup } from '../../types/workout.ts';

/** Anteil der Hilfsmuskeln an der Belastung einer Übung (Hauptmuskel = 1). */
export const SECONDARY_SHARE = 0.4;

export type MuscleLoad = Partial<Record<MuscleGroup, number>>;

export type LoadEntry = {
  primary: MuscleGroup | undefined;
  secondary: readonly MuscleGroup[];
  /** Gewichtung, z.B. Anzahl Sätze oder Volumen */
  amount: number;
};

/**
 * Belastung je Muskelgruppe, normiert auf 0 bis 1 (stärkste Gruppe = 1).
 * Hilfsmuskeln zählen anteilig, damit z.B. Bankdrücken auch Trizeps und Schultern leicht färbt.
 */
export function muscleLoad(entries: readonly LoadEntry[]): MuscleLoad {
  const raw = new Map<MuscleGroup, number>();
  const add = (muscle: MuscleGroup, value: number) => raw.set(muscle, (raw.get(muscle) ?? 0) + value);
  for (const entry of entries) {
    if (entry.amount <= 0) continue;
    if (entry.primary) add(entry.primary, entry.amount);
    for (const muscle of entry.secondary) {
      if (muscle !== entry.primary) add(muscle, entry.amount * SECONDARY_SHARE);
    }
  }
  const max = Math.max(0, ...raw.values());
  const result: MuscleLoad = {};
  if (max === 0) return result;
  for (const [muscle, value] of raw) result[muscle] = Math.round((value / max) * 1000) / 1000;
  return result;
}
