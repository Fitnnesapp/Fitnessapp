import { weekStart, weekStats, type Activity } from './activity.ts';

/**
 * Erfolgsmoment direkt nach einer Einheit (Gewohnheitsschleife: die Belohnung folgt unmittelbar auf die Handlung).
 * Belohnt wird nur echte Leistung: Anzahl der Einheiten, Wochenziel, Rekorde. Nichts Zufälliges.
 */

/** Runde Zahlen, die als Meilenstein gefeiert werden. */
export const MILESTONES = [1, 5, 10, 25, 50, 75, 100, 150, 200, 250, 300, 365, 400, 500, 750, 1000];

export type WeekEffect =
  /** Diese Einheit hat das Wochenziel gerade erreicht */
  | { kind: 'goal-reached'; activeDays: number; goal: number }
  /** Ziel war schon erreicht, das ist ein Bonus */
  | { kind: 'bonus'; activeDays: number; goal: number }
  /** Ziel noch offen */
  | { kind: 'progress'; activeDays: number; goal: number; remaining: number };

export type Celebration = {
  /** Die wievielte Einheit insgesamt (1-basiert) */
  ordinal: number;
  milestone: boolean;
  week: WeekEffect;
};

const activeDays = (perDay: number[]) => perDay.filter((n) => n > 0).length;

export function celebrate(activities: Activity[], sessionId: string, goalDays: number): Celebration | null {
  const session = activities.find((a) => a.id === sessionId);
  if (!session) return null;

  const sorted = [...activities].sort((a, b) => a.startedAt - b.startedAt || a.id.localeCompare(b.id));
  const ordinal = sorted.findIndex((a) => a.id === sessionId) + 1;

  // Woche der Einheit: einmal mit, einmal ohne sie und alles danach, damit der Moment stimmt
  const start = weekStart(session.startedAt);
  const upToNow = sorted.filter((a) => a.startedAt <= session.startedAt);
  const before = upToNow.filter((a) => a.id !== sessionId);
  const daysWith = activeDays(weekStats(upToNow, start).perDay);
  const daysBefore = activeDays(weekStats(before, start).perDay);
  const goal = Math.max(1, goalDays);

  let week: WeekEffect;
  if (daysBefore >= goal) week = { kind: 'bonus', activeDays: daysWith, goal };
  else if (daysWith >= goal) week = { kind: 'goal-reached', activeDays: daysWith, goal };
  else week = { kind: 'progress', activeDays: daysWith, goal, remaining: goal - daysWith };

  return { ordinal, milestone: MILESTONES.includes(ordinal), week };
}

/** Kurzer Satz zum Wochenziel, immer positiv. */
export function weekEffectText(week: WeekEffect): string {
  if (week.kind === 'goal-reached') return `Wochenziel geschafft: ${week.activeDays} von ${week.goal} ${week.goal === 1 ? 'Tag' : 'Tagen'}.`;
  if (week.kind === 'bonus') return `Bonus! Dein Wochenziel war schon geschafft, das ist Tag ${week.activeDays}.`;
  return week.remaining === 1
    ? `Tag ${week.activeDays} von ${week.goal}. Nur noch 1 Tag bis zum Wochenziel.`
    : `Tag ${week.activeDays} von ${week.goal}. Noch ${week.remaining} Tage bis zum Wochenziel.`;
}

/** Überschrift zur Anzahl: Meilensteine bekommen einen eigenen Satz. */
export function ordinalText(c: Celebration): string {
  if (c.ordinal === 1) return 'Deine erste Einheit. Der wichtigste Schritt!';
  if (c.milestone) return `Meilenstein: ${c.ordinal} Einheiten!`;
  return `Einheit Nr. ${c.ordinal}`;
}
