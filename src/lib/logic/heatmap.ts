import { dayKey, weekStart, type Activity } from './activity.ts';

/**
 * Beständigkeits-Raster (Wochen × Wochentage) für die Fortschrittsseite.
 *
 * Gewohnheiten entstehen durch Wiederholung über Wochen, nicht durch einzelne perfekte Tage
 * (Lally et al. 2010: im Mittel 66 Tage, einzelne Aussetzer schaden kaum). Darum zählt die
 * Kennzahl aktive Wochen statt lückenloser Tage.
 */

export type HeatCell = {
  key: string;
  at: number;
  minutes: number;
  /** 0 = nichts, 1 bis 4 = steigende Trainingszeit */
  level: 0 | 1 | 2 | 3 | 4;
  /** Tag liegt nach heute */
  future: boolean;
};

export type HeatWeek = { start: number; days: HeatCell[] };

export type Heatmap = {
  weeks: HeatWeek[];
  activeDays: number;
  activeWeeks: number;
  /** Längste Folge aktiver Wochen im Zeitraum */
  bestWeekRun: number;
  /** Aktuelle Folge aktiver Wochen bis heute (die laufende Woche zählt mit, wenn schon aktiv) */
  currentWeekRun: number;
};

export function levelFor(minutes: number, sessions: number): HeatCell['level'] {
  if (sessions === 0) return 0;
  if (minutes < 20) return 1;
  if (minutes < 40) return 2;
  if (minutes < 60) return 3;
  return 4;
}

export function buildHeatmap(activities: readonly Activity[], now: number, weekCount = 18): Heatmap {
  const minutes = new Map<string, number>();
  const sessions = new Map<string, number>();
  for (const activity of activities) {
    const key = dayKey(activity.startedAt);
    minutes.set(key, (minutes.get(key) ?? 0) + activity.durationSeconds / 60);
    sessions.set(key, (sessions.get(key) ?? 0) + 1);
  }

  const todayKey = dayKey(now);
  const current = new Date(weekStart(now));
  const weeks: HeatWeek[] = [];
  let reachedToday = false;
  for (let w = weekCount - 1; w >= 0; w -= 1) {
    const start = new Date(current.getFullYear(), current.getMonth(), current.getDate() - 7 * w);
    const days: HeatCell[] = [];
    for (let d = 0; d < 7; d += 1) {
      const at = new Date(start.getFullYear(), start.getMonth(), start.getDate() + d).getTime();
      const key = dayKey(at);
      const future = reachedToday;
      if (key === todayKey) reachedToday = true;
      const total = Math.round(minutes.get(key) ?? 0);
      days.push({ key, at, minutes: total, level: future ? 0 : levelFor(total, sessions.get(key) ?? 0), future });
    }
    weeks.push({ start: start.getTime(), days });
  }

  const activeFlags = weeks.map((week) => week.days.some((day) => day.level > 0));
  let best = 0;
  let run = 0;
  for (const active of activeFlags) {
    run = active ? run + 1 : 0;
    best = Math.max(best, run);
  }
  // Die laufende Woche bricht die Serie nicht, solange sie noch nicht vorbei ist
  let currentRun = 0;
  for (let i = activeFlags.length - 1; i >= 0; i -= 1) {
    if (activeFlags[i]) currentRun += 1;
    else if (i !== activeFlags.length - 1) break;
  }

  return {
    weeks,
    activeDays: weeks.reduce((sum, week) => sum + week.days.filter((day) => day.level > 0).length, 0),
    activeWeeks: activeFlags.filter(Boolean).length,
    bestWeekRun: best,
    currentWeekRun: currentRun,
  };
}
