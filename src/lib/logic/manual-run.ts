import type { RunSession } from '../../types/running.ts';

/**
 * Läufe ohne GPS nachtragen (Laufband, Handy vergessen). Ohne Strecke gibt es keine
 * Kilometerzeiten und keine Bestzeiten über 1, 5 oder 10 km, aber Distanz und Zeit
 * zählen für Verlauf, Wochenziel, Challenges und die Wettkampf-Prognose.
 */
export const MANUAL_RUN_LIMITS = {
  minKm: 0.1,
  maxKm: 100,
  minSeconds: 60,
  maxSeconds: 12 * 3600,
  /** Schneller als 2:00 min/km ist kein Laufen mehr, langsamer als 20:00 min/km eher Gehen */
  fastestSecPerKm: 120,
  slowestSecPerKm: 1200,
  /** So weit zurück lässt sich nachtragen */
  maxDaysBack: 30,
} as const;

export type ManualRunInput = {
  distanceKm: number;
  durationSeconds: number;
  startedAt: number;
  /** Lauf (Standard) oder Rad, z.B. Indoor-Cycling */
  sport?: 'run' | 'ride';
};

/** Radfahren: 3 bis 60 km/h, bis 300 km */
export const MANUAL_RIDE_LIMITS = { maxKm: 300, fastestSecPerKm: 60, slowestSecPerKm: 1200 } as const;

const DAY = 24 * 60 * 60 * 1000;

/** Fehlertext oder null, wenn die Angaben plausibel sind. */
export function validateManualRun(input: ManualRunInput, now: number): string | null {
  const { distanceKm, durationSeconds, startedAt } = input;
  const ride = input.sport === 'ride';
  const what = ride ? 'Radfahrt' : 'Lauf';
  const maxKm = ride ? MANUAL_RIDE_LIMITS.maxKm : MANUAL_RUN_LIMITS.maxKm;
  if (!Number.isFinite(distanceKm) || distanceKm < MANUAL_RUN_LIMITS.minKm) return 'Gib eine Distanz an.';
  if (distanceKm > maxKm) return `Höchstens ${maxKm} km pro ${what}.`;
  if (!Number.isFinite(durationSeconds) || durationSeconds < MANUAL_RUN_LIMITS.minSeconds) return 'Gib eine Dauer von mindestens einer Minute an.';
  if (durationSeconds > MANUAL_RUN_LIMITS.maxSeconds) return `Höchstens 12 Stunden pro ${what}.`;
  const pace = durationSeconds / distanceKm;
  if (ride) {
    if (pace < MANUAL_RIDE_LIMITS.fastestSecPerKm) return 'Das wäre schneller als 60 km/h. Prüf Distanz und Zeit.';
    if (pace > MANUAL_RIDE_LIMITS.slowestSecPerKm) return 'Das wäre langsamer als 3 km/h. Prüf Distanz und Zeit.';
  } else {
    if (pace < MANUAL_RUN_LIMITS.fastestSecPerKm) return 'Das wäre schneller als 2:00 min/km. Prüf Distanz und Zeit.';
    if (pace > MANUAL_RUN_LIMITS.slowestSecPerKm) return 'Das wäre langsamer als 20:00 min/km. Prüf Distanz und Zeit.';
  }
  if (startedAt + durationSeconds * 1000 > now + 60_000) return `Die ${ride ? 'Radfahrt' : 'Einheit'} liegt in der Zukunft.`;
  if (now - startedAt > MANUAL_RUN_LIMITS.maxDaysBack * DAY) return 'Nachtragen geht für die letzten 30 Tage.';
  return null;
}

/** Erstellt den Lauf. Vorher mit validateManualRun prüfen. */
export function createManualRun(input: ManualRunInput, id: string): RunSession {
  const durationSeconds = Math.round(input.durationSeconds);
  return {
    id,
    type: 'running',
    startedAt: input.startedAt,
    endedAt: input.startedAt + durationSeconds * 1000,
    distanceM: Math.round(input.distanceKm * 1000),
    durationSeconds,
    elevationGainM: 0,
    bests: { k1: null, k5: null, k10: null },
    points: [],
    manual: true,
    ...(input.sport === 'ride' ? { sport: 'ride' as const } : {}),
  };
}

/** Liest "45", "45:30" oder "1:05:30" als Sekunden. Eine einzelne Zahl gilt als Minuten. */
export function parseDuration(text: string): number | null {
  const parts = text.trim().split(':');
  if (parts.length === 0 || parts.length > 3 || parts.some((part) => !/^\d{1,3}$/.test(part))) return null;
  const numbers = parts.map(Number);
  if (numbers.length === 1) return numbers[0] * 60;
  if (numbers.length === 2) return numbers[1] < 60 ? numbers[0] * 60 + numbers[1] : null;
  return numbers[1] < 60 && numbers[2] < 60 ? numbers[0] * 3600 + numbers[1] * 60 + numbers[2] : null;
}

/** Startzeitpunkt aus Tag (0 = heute, 1 = gestern …) und Uhrzeit "HH:MM". */
export function startFromDayAndTime(now: number, daysAgo: number, time: string): number | null {
  const match = /^(\d{1,2})[:.](\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
}

/** Kalendertage zwischen dem Zeitpunkt und heute (0 = heute, 1 = gestern …), unabhängig von der Uhrzeit. */
export function calendarDaysAgo(at: number, now: number): number {
  const day = (t: number) => {
    const d = new Date(t);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };
  return Math.max(0, Math.round((day(now) - day(at)) / DAY));
}

/** Uhrzeit als "HH:MM" für das Eingabefeld. */
export function timeOfDay(at: number): string {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
