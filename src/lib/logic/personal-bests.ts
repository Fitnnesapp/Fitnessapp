import type { RunSession } from '../../types/running.ts';
import type { StrengthWorkout } from '../../types/workout.ts';
import type { Activity } from './activity.ts';

/**
 * Bestleistungen und Eckdaten fürs Profil. Eigene Rekorde sichtbar zu machen stärkt das
 * Kompetenzerleben (Selbstbestimmungstheorie, Ryan & Deci 2000), ganz ohne Vergleich mit anderen.
 */

export type PersonalBests = {
  heaviest: { exerciseId: string; weightKg: number; reps: number; at: number } | null;
  longestRun: { distanceM: number; at: number } | null;
  fastest1k: { seconds: number; at: number } | null;
  fastest5k: { seconds: number; at: number } | null;
};

export function personalBests(strength: StrengthWorkout[], runs: RunSession[]): PersonalBests {
  let heaviest: PersonalBests['heaviest'] = null;
  for (const w of strength) {
    for (const e of w.exercises) {
      for (const s of e.sets) {
        if (s.isWarmup || s.reps <= 0 || s.weightKg <= 0) continue;
        // Höheres Gewicht gewinnt, bei gleichem Gewicht mehr Wiederholungen
        if (heaviest === null || s.weightKg > heaviest.weightKg || (s.weightKg === heaviest.weightKg && s.reps > heaviest.reps)) {
          heaviest = { exerciseId: e.exerciseId, weightKg: s.weightKg, reps: s.reps, at: w.startedAt };
        }
      }
    }
  }

  let longestRun: PersonalBests['longestRun'] = null;
  let fastest1k: PersonalBests['fastest1k'] = null;
  let fastest5k: PersonalBests['fastest5k'] = null;
  for (const r of runs) {
    if (r.distanceM > 0 && (longestRun === null || r.distanceM > longestRun.distanceM)) longestRun = { distanceM: r.distanceM, at: r.startedAt };
    if (r.bests.k1 !== null && (fastest1k === null || r.bests.k1 < fastest1k.seconds)) fastest1k = { seconds: r.bests.k1, at: r.startedAt };
    if (r.bests.k5 !== null && (fastest5k === null || r.bests.k5 < fastest5k.seconds)) fastest5k = { seconds: r.bests.k5, at: r.startedAt };
  }

  return { heaviest, longestRun, fastest1k, fastest5k };
}

/** Beginn der Trainingsgeschichte: erste Einheit, sonst null. */
export function memberSince(activities: Activity[]): number | null {
  if (activities.length === 0) return null;
  return Math.min(...activities.map((a) => a.startedAt));
}

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export function monthYear(at: number): string {
  const d = new Date(at);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
