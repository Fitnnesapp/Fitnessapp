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

const HOUR = 3_600_000;
/** Volle Erholung nach hartem Training des Hauptmuskels, bei Hilfsmuskeln kürzer. */
export const PRIMARY_RECOVERY_HOURS = 72;
export const SECONDARY_RECOVERY_HOURS = 36;

export type RecoveryWorkout = {
  startedAt: number;
  exercises: { primary: MuscleGroup | undefined; secondary: readonly MuscleGroup[]; workingSets: number }[];
};

export type MuscleRecovery = {
  /** 0 = gerade trainiert, 1 = vollständig erholt; nur Muskeln mit Belastung in den letzten 72 Stunden */
  recovering: Partial<Record<MuscleGroup, number>>;
  /** Stunden bis zur vollen Erholung je Muskel */
  hoursLeft: Partial<Record<MuscleGroup, number>>;
};

/**
 * Erholungsstand der Muskelgruppen nach den Krafttrainings der letzten Tage.
 * Grobe, verständliche Faustregel (48 bis 72 Stunden für den Hauptmuskel), keine medizinische Aussage.
 */
export function muscleRecovery(workouts: readonly RecoveryWorkout[], now: number): MuscleRecovery {
  const recovering: Partial<Record<MuscleGroup, number>> = {};
  const hoursLeft: Partial<Record<MuscleGroup, number>> = {};
  const apply = (muscle: MuscleGroup, startedAt: number, fullHours: number) => {
    const hours = (now - startedAt) / HOUR;
    if (hours < 0 || hours >= fullHours) return;
    const value = hours / fullHours;
    if (recovering[muscle] === undefined || value < recovering[muscle]) {
      recovering[muscle] = Math.round(value * 100) / 100;
      hoursLeft[muscle] = Math.ceil(fullHours - hours);
    }
  };
  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      if (exercise.workingSets <= 0) continue;
      if (exercise.primary) apply(exercise.primary, workout.startedAt, PRIMARY_RECOVERY_HOURS);
      for (const muscle of exercise.secondary) {
        if (muscle !== exercise.primary) apply(muscle, workout.startedAt, SECONDARY_RECOVERY_HOURS);
      }
    }
  }
  return { recovering, hoursLeft };
}
