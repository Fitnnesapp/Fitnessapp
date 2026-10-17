import type { ProgramCategory } from '../../types/home.ts';

/** MET-Werte (Energieumsatz relativ zur Ruhe) je Kategorie, grobe Richtwerte. */
export const MET_BY_CATEGORY: Record<ProgramCategory, number> = {
  HIIT: 8,
  Ganzkörper: 6,
  Core: 4,
  Mobility: 2.5,
};

export const DEFAULT_BODY_WEIGHT_KG = 70;

/** Kalorien = MET × Körpergewicht (kg) × Dauer (h). Nur eine grobe Schätzung. */
export function estimateCalories(
  category: ProgramCategory,
  activeSeconds: number,
  bodyWeightKg: number | null,
): number {
  const weight = bodyWeightKg && bodyWeightKg > 0 ? bodyWeightKg : DEFAULT_BODY_WEIGHT_KG;
  return Math.round((MET_BY_CATEGORY[category] * weight * Math.max(0, activeSeconds)) / 3600);
}
