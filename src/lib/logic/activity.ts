export type ActivityType = 'strength' | 'home' | 'running';

/** Gemeinsame Sicht auf ein Workout, unabhängig von der Trainingsart. */
export type Activity = {
  id: string;
  type: ActivityType;
  startedAt: number;
  durationSeconds: number;
  /** nur Läufe */
  distanceM: number;
};

/** Lokaler Kalendertag als Schlüssel, z.B. 2026-10-18. */
export function dayKey(at: number): string {
  const d = new Date(at);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Beginn der Woche (Montag, 00:00 lokale Zeit) als Zeitstempel. */
export function weekStart(at: number): number {
  const d = new Date(at);
  const daysSinceMonday = (d.getDay() + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysSinceMonday).getTime();
}

export type WeekStats = {
  workouts: number;
  durationSeconds: number;
  distanceM: number;
  byType: Record<ActivityType, number>;
  /** Anzahl Workouts je Wochentag, Montag zuerst */
  perDay: number[];
};

export function weekStats(activities: Activity[], weekStartAt: number): WeekStats {
  const start = new Date(weekStartAt);
  const dayStarts = Array.from({ length: 8 }, (_, i) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + i).getTime(),
  );

  const stats: WeekStats = {
    workouts: 0,
    durationSeconds: 0,
    distanceM: 0,
    byType: { strength: 0, home: 0, running: 0 },
    perDay: Array(7).fill(0),
  };

  for (const a of activities) {
    if (a.startedAt < dayStarts[0] || a.startedAt >= dayStarts[7]) continue;

    stats.workouts += 1;
    stats.durationSeconds += a.durationSeconds;
    stats.distanceM += a.distanceM;
    stats.byType[a.type] += 1;
    const day = dayStarts.findIndex((s, i) => i < 7 && a.startedAt >= s && a.startedAt < dayStarts[i + 1]);
    stats.perDay[day] += 1;
  }

  return stats;
}

/** Freezes pro Kalendermonat. Sie sammeln sich nicht an. */
export const FREEZES_PER_MONTH = 2;

export type StreakInfo = {
  /** Aktuelle Serie in Trainingstagen. Eingefrorene Tage halten sie am Leben, zählen aber nicht mit. */
  current: number;
  longest: number;
  /** Noch verfügbare Freezes im aktuellen Monat */
  freezesLeft: number;
  /** Tage (yyyy-mm-dd), an denen ein Freeze die Serie gerettet hat */
  frozenDays: string[];
  /** Heute wurde noch nicht trainiert, die Serie läuft aber noch */
  atRisk: boolean;
  trainedToday: boolean;
};

const DAY_MS = 86400000;

const dayNumberOf = (at: number): number => {
  const d = new Date(at);
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
};

const monthKeyOfDay = (dayNumber: number): string => {
  const d = new Date(dayNumber * DAY_MS);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
};

const keyOfDay = (dayNumber: number): string => {
  const d = new Date(dayNumber * DAY_MS);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

/**
 * Serie aufeinanderfolgender Trainingstage mit Freezes.
 *
 * Ein verpasster Tag verbraucht einen Freeze des Monats, in den er fällt (pro Monat `freezesPerMonth`).
 * Ist keiner mehr übrig, reißt die Serie. Heute zählt noch nicht als verpasst: wer heute noch nicht
 * trainiert hat, behält die Serie bis zum Tagesende ("atRisk").
 * Das Ergebnis wird immer aus dem gesamten Verlauf neu berechnet, es gibt keinen gespeicherten Zähler.
 */
export function streaks(activities: Activity[], now: number, freezesPerMonth = FREEZES_PER_MONTH): StreakInfo {
  const today = dayNumberOf(now);
  const active = new Set(activities.map((a) => dayNumberOf(a.startedAt)));
  const trainedToday = active.has(today);
  const empty: StreakInfo = {
    current: 0,
    longest: 0,
    freezesLeft: freezesPerMonth,
    frozenDays: [],
    atRisk: false,
    trainedToday,
  };
  if (active.size === 0) return empty;

  const first = Math.min(...active);
  const usedPerMonth = new Map<string, number>();
  const frozenDays: string[] = [];
  let current = 0;
  let longest = 0;

  for (let day = first; day <= today; day++) {
    if (active.has(day)) {
      current += 1;
      longest = Math.max(longest, current);
    } else if (day < today && current > 0) {
      const month = monthKeyOfDay(day);
      const used = usedPerMonth.get(month) ?? 0;
      if (used < freezesPerMonth) {
        usedPerMonth.set(month, used + 1);
        frozenDays.push(keyOfDay(day));
      } else {
        current = 0;
      }
    }
  }

  const freezesLeft = freezesPerMonth - (usedPerMonth.get(monthKeyOfDay(today)) ?? 0);
  return { ...empty, current, longest, freezesLeft, frozenDays, atRisk: current > 0 && !trainedToday };
}
