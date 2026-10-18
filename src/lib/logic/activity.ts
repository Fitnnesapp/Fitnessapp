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

export type StreakInfo = { current: number; longest: number };

/**
 * Serie aufeinanderfolgender Tage mit mindestens einem Workout.
 * Ein heute noch fehlendes Workout unterbricht die aktuelle Serie nicht: sie zählt bis gestern weiter.
 */
export function streaks(activities: Activity[], now: number): StreakInfo {
  const days = new Set(activities.map((a) => dayKey(a.startedAt)));
  if (days.size === 0) return { current: 0, longest: 0 };

  const dayNumber = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return Math.round(Date.UTC(y, m - 1, d) / 86400000);
  };
  const sorted = [...days].map(dayNumber).sort((a, b) => a - b);

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = sorted[i] === sorted[i - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const today = dayNumber(dayKey(now));
  const last = sorted[sorted.length - 1];
  let current = 0;
  if (last === today || last === today - 1) {
    current = 1;
    for (let i = sorted.length - 1; i > 0 && sorted[i] === sorted[i - 1] + 1; i--) current += 1;
  }

  return { current, longest };
}
