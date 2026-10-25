import { weekStart, weekStats, type Activity } from './activity.ts';

/**
 * Fortschritt sichtbar machen (Progress Principle, Amabile & Kramer 2011):
 * Rückblick auf die letzte volle Woche, Trend über mehrere Wochen und die Gesamtbilanz.
 * Nur Vergleiche mit dir selbst, Pausen werden als Neuanfang formuliert (Fresh-Start-Effekt).
 */

const DAY = 86_400_000;

/** Kalenderwoche nach ISO 8601 (Woche mit dem ersten Donnerstag ist KW 1). */
export function isoWeek(at: number): number {
  const d = new Date(at);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayNr = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3); // Donnerstag dieser Woche
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = target.getTime() - firstThursday.getTime();
  return 1 + Math.round((diff / DAY - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
}

/** Montag der Woche davor; robust gegen Zeitumstellung. */
function previousWeekStart(start: number): number {
  return weekStart(start - DAY / 2);
}

export type WeekTotal = { start: number; week: number; sessions: number; minutes: number; distanceM: number };

/** Summen je Woche, älteste zuerst, die aktuelle Woche zuletzt. */
export function weeklyTotals(activities: Activity[], now: number, weeks = 8): WeekTotal[] {
  const starts: number[] = [weekStart(now)];
  while (starts.length < weeks) starts.unshift(previousWeekStart(starts[0]));
  return starts.map((start) => {
    const s = weekStats(activities, start);
    return { start, week: isoWeek(start), sessions: s.workouts, minutes: Math.round(s.durationSeconds / 60), distanceM: s.distanceM };
  });
}

export type LastWeekReview = {
  start: number;
  week: number;
  sessions: number;
  minutes: number;
  distanceM: number;
  activeDays: number;
  goal: number;
  goalReached: boolean;
  /** Längste Einheit der Woche */
  longest: Activity | null;
  message: string;
};

/** Rückblick auf die letzte vollständige Woche (Montag bis Sonntag). */
export function lastWeekReview(activities: Activity[], now: number, goalDays: number): LastWeekReview {
  const start = previousWeekStart(weekStart(now));
  const end = weekStart(now);
  const inWeek = activities.filter((a) => a.startedAt >= start && a.startedAt < end);
  const stats = weekStats(activities, start);
  const activeDays = stats.perDay.filter((n) => n > 0).length;
  const goal = Math.max(1, goalDays);
  const goalReached = activeDays >= goal;
  const longest = inWeek.reduce<Activity | null>((best, a) => (best === null || a.durationSeconds > best.durationSeconds ? a : best), null);

  let message: string;
  if (inWeek.length === 0) message = 'Letzte Woche war Pause. Diese Woche ist ein neuer Anfang.';
  else if (activeDays > goal) message = `Ziel übertroffen: ${activeDays} Trainingstage statt ${goal}.`;
  else if (goalReached) message = 'Wochenziel geschafft. Genau so baut sich eine Gewohnheit auf.';
  else message = `${activeDays} von ${goal} Tagen. Jeder Tag hat gezählt.`;

  return {
    start,
    week: isoWeek(start),
    sessions: stats.workouts,
    minutes: Math.round(stats.durationSeconds / 60),
    distanceM: stats.distanceM,
    activeDays,
    goal,
    goalReached,
    longest,
    message,
  };
}

/** Aktivste Woche nach Minuten; bei Gleichstand die neuere. null, wenn alle Wochen leer sind. */
export function bestWeek(totals: WeekTotal[]): WeekTotal | null {
  let best: WeekTotal | null = null;
  for (const t of totals) if (t.minutes > 0 && (best === null || t.minutes >= best.minutes)) best = t;
  return best;
}

export type Lifetime = { sessions: number; minutes: number; distanceM: number; activeDays: number };

export function lifetimeTotals(activities: Activity[]): Lifetime {
  const days = new Set(
    activities.map((a) => {
      const d = new Date(a.startedAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );
  return {
    sessions: activities.length,
    minutes: Math.round(activities.reduce((s, a) => s + a.durationSeconds, 0) / 60),
    distanceM: activities.reduce((s, a) => s + a.distanceM, 0),
    activeDays: days.size,
  };
}
