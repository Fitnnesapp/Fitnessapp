import type { RunBests } from '../../types/running.ts';

/**
 * Bestzeiten und Wettkampf-Prognose aus den eigenen Läufen.
 *
 * Prognose nach Riegel (1981): T2 = T1 × (D2 / D1)^1,06. Die Formel ist einfach und gut belegt,
 * wird für weite Sprünge (z.B. 5 km auf Marathon) aber optimistisch. Darum werden nur Läufe ab
 * 3 km und Sprünge bis zum Faktor 9 genutzt, und die App nennt das Ergebnis eine Schätzung.
 */

export const RIEGEL_EXPONENT = 1.06;
const MIN_REFERENCE_M = 3000;
const MAX_FACTOR = 9;
const DAY = 86_400_000;
export const PREDICTION_WINDOW_DAYS = 120;

type RunLike = { id: string; startedAt: number; distanceM: number; durationSeconds: number; bests: RunBests };

export type RunBestsSummary = {
  k1: number | null;
  k5: number | null;
  k10: number | null;
  longestM: number;
  totalM: number;
  count: number;
};

export function runBestsSummary(runs: readonly RunLike[]): RunBestsSummary {
  const best = (key: keyof RunBests) => {
    const values = runs.map((run) => run.bests[key]).filter((value): value is number => value !== null && value > 0);
    return values.length > 0 ? Math.min(...values) : null;
  };
  return {
    k1: best('k1'),
    k5: best('k5'),
    k10: best('k10'),
    longestM: runs.reduce((max, run) => Math.max(max, run.distanceM), 0),
    totalM: runs.reduce((sum, run) => sum + run.distanceM, 0),
    count: runs.length,
  };
}

export function riegel(seconds: number, fromM: number, toM: number): number {
  return seconds * Math.pow(toM / fromM, RIEGEL_EXPONENT);
}

export const RACE_DISTANCES = [
  { label: '5 km', meters: 5000 },
  { label: '10 km', meters: 10000 },
  { label: 'Halbmarathon', meters: 21097.5 },
  { label: 'Marathon', meters: 42195 },
] as const;

export type RacePrediction = { label: string; meters: number; seconds: number };

export type Prediction = {
  /** Lauf, auf dem die Prognose beruht */
  basis: { runId: string; meters: number; seconds: number };
  races: RacePrediction[];
};

/** Prognose aus dem stärksten Lauf der letzten 120 Tage. null ohne geeigneten Lauf. */
export function predictRaces(runs: readonly RunLike[], now: number): Prediction | null {
  type Candidate = { runId: string; meters: number; seconds: number };
  const candidates: Candidate[] = [];
  for (const run of runs) {
    if (now - run.startedAt > PREDICTION_WINDOW_DAYS * DAY) continue;
    if (run.distanceM >= MIN_REFERENCE_M && run.durationSeconds > 0) {
      candidates.push({ runId: run.id, meters: run.distanceM, seconds: run.durationSeconds });
    }
    if (run.bests.k5) candidates.push({ runId: run.id, meters: 5000, seconds: run.bests.k5 });
    if (run.bests.k10) candidates.push({ runId: run.id, meters: 10000, seconds: run.bests.k10 });
  }
  if (candidates.length === 0) return null;

  // Der stärkste Lauf ist der mit der schnellsten hochgerechneten 10-km-Zeit
  const strongest = candidates.reduce((best, candidate) =>
    riegel(candidate.seconds, candidate.meters, 10000) < riegel(best.seconds, best.meters, 10000) ? candidate : best,
  );

  const races = RACE_DISTANCES.filter(
    (race) => race.meters / strongest.meters <= MAX_FACTOR && strongest.meters / race.meters <= MAX_FACTOR,
  ).map((race) => ({
    label: race.label,
    meters: race.meters,
    seconds: Math.round(riegel(strongest.seconds, strongest.meters, race.meters)),
  }));

  return { basis: strongest, races };
}

/** Wettkampfzeit lesbar: 24:30 oder 1:52:07 */
export function formatRaceTime(seconds: number): string {
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * Vorschlag für ein Wochenziel: Schnitt der letzten vier vollen Wochen plus 10 %,
 * auf 5 km aufgerundet. Die 10 % sind die bekannte Faustregel für eine sanfte Steigerung.
 * Ohne Läufe: 10 km als machbarer Einstieg.
 */
export function suggestWeeklyRunGoalM(runs: readonly { startedAt: number; distanceM: number }[], currentWeekStart: number): number {
  const WEEK = 7 * DAY;
  const from = currentWeekStart - 4 * WEEK;
  const total = runs
    .filter((r) => r.startedAt >= from && r.startedAt < currentWeekStart)
    .reduce((sum, r) => sum + r.distanceM, 0);
  if (total === 0) return 10_000;
  const target = (total / 4) * 1.1;
  return Math.min(100_000, Math.max(5_000, Math.ceil(target / 5_000) * 5_000));
}

/** Zwischenzeiten bei gleichmäßigem Tempo: alle 5 km (bei 5 km jeder Kilometer) und im Ziel. */
export function evenSplits(meters: number, seconds: number): { meters: number; seconds: number }[] {
  if (meters <= 0 || seconds <= 0) return [];
  const step = meters <= 5000 ? 1000 : 5000;
  const result: { meters: number; seconds: number }[] = [];
  for (let at = step; at < meters - 1; at += step) result.push({ meters: at, seconds: Math.round((seconds * at) / meters) });
  result.push({ meters, seconds: Math.round(seconds) });
  return result;
}
