import { BADGES, type BadgeContext, type BadgeKey } from './badges.ts';

/**
 * Motivationshilfen für den Start-Bildschirm.
 * Bewusst einfach und ehrlich: kleine, erreichbare Ziele und sichtbarer Fortschritt,
 * keine künstliche Dringlichkeit.
 */

/** Wochenziel in Trainingstagen. Drei Tage sind für Einsteiger gut erreichbar. */
export const WEEKLY_GOAL_DAYS = 3;

export type WeeklyGoal = {
  /** Tage dieser Woche mit mindestens einem Workout */
  activeDays: number;
  goal: number;
  /** Fortschritt von 0 bis 1 */
  ratio: number;
  reached: boolean;
  /** Fehlende Tage bis zum Ziel, mindestens 0 */
  remaining: number;
  /** Kurzer, ermutigender Satz zum Stand */
  message: string;
};

/** Fortschritt zum Wochenziel aus den Workouts je Wochentag (Montag zuerst). */
export function weeklyGoal(perDay: number[], goal = WEEKLY_GOAL_DAYS): WeeklyGoal {
  const activeDays = perDay.filter((count) => count > 0).length;
  const remaining = Math.max(0, goal - activeDays);
  const reached = remaining === 0;

  let message: string;
  if (activeDays === 0) message = `${goal} ${goal === 1 ? 'Trainingstag' : 'Trainingstage'} diese Woche. Der erste ist der wichtigste.`;
  else if (reached && activeDays > goal) message = `Ziel übertroffen: ${activeDays} Trainingstage. Stark!`;
  else if (reached) message = 'Wochenziel geschafft. Alles ab jetzt ist Bonus.';
  else if (remaining === 1) message = 'Nur noch 1 Tag bis zu deinem Wochenziel.';
  else message = `Noch ${remaining} Tage bis zu deinem Wochenziel.`;

  return { activeDays, goal, ratio: Math.min(1, activeDays / goal), reached, remaining, message };
}

/** Begrüßung passend zur Tageszeit (lokale Zeit). */
export function greeting(now: number): string {
  const hour = new Date(now).getHours();
  if (hour >= 5 && hour < 11) return 'Guten Morgen';
  if (hour >= 11 && hour < 18) return 'Hallo';
  if (hour >= 18 && hour < 23) return 'Guten Abend';
  return 'Hallo';
}

export type BadgeProgress = {
  key: BadgeKey;
  current: number;
  target: number;
  /** Fortschritt von 0 bis 1 */
  ratio: number;
};

/** Messbarer Fortschritt für jedes Abzeichen. */
export function badgeProgress(ctx: BadgeContext): BadgeProgress[] {
  const total = ctx.strengthCount + ctx.homeCount + ctx.runCount;
  const typesDone = [ctx.strengthCount, ctx.homeCount, ctx.runCount].filter((n) => n > 0).length;

  const values: Record<BadgeKey, [number, number]> = {
    first_workout: [total, 1],
    workouts_10: [total, 10],
    workouts_50: [total, 50],
    first_5k: [ctx.longestRunM / 1000, 5],
    first_10k: [ctx.longestRunM / 1000, 10],
    first_record: [ctx.recordCount, 1],
    home_10: [ctx.homeCount, 10],
    streak_7: [ctx.longestStreak, 7],
    streak_30: [ctx.longestStreak, 30],
    all_rounder: [typesDone, 3],
  };

  return BADGES.map((badge) => {
    const [current, target] = values[badge.key];
    const capped = Math.min(current, target);
    return { key: badge.key, current: capped, target, ratio: capped / target };
  });
}

/**
 * Das noch offene Abzeichen, das am nächsten liegt.
 * Bei Gleichstand gewinnt das zuerst definierte, also das einfachere.
 * Gibt null zurück, wenn alle Abzeichen vergeben sind.
 */
export function nextBadge(ctx: BadgeContext, awarded: Record<string, number>): BadgeProgress | null {
  const open = badgeProgress(ctx).filter((p) => !(p.key in awarded) && p.ratio < 1);
  if (open.length === 0) return null;

  return open.reduce((best, p) => (p.ratio > best.ratio ? p : best));
}

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

/** Datum für die Kopfzeile, z.B. "Samstag, 24. Oktober". Ohne Intl, damit es auf allen Geräten gleich aussieht. */
export function dayHeading(now: number): string {
  const d = new Date(now);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`;
}
