import { weekStart, type Activity, type ActivityType } from './activity.ts';

/**
 * Identität und Selbstvergleich für den Start-Bildschirm.
 * - Identität (Bryan et al. 2011): "Team Lauf" statt "du bist gelaufen"
 * - Vergleich nur mit der eigenen Vorwoche, positiv oder neutral formuliert, nie als Verlust
 */

export const IDENTITY_WINDOW_DAYS = 90;
/** Ab diesem Anteil einer Trainingsart gilt man als "Team" dieser Art, sonst Allround. */
export const IDENTITY_SHARE = 0.6;

export type Team = 'Kraft' | 'Lauf' | 'Home' | 'Allround';

export type Identity = { team: Team; sessions: number };

const TEAM_OF: Record<ActivityType, Team> = { strength: 'Kraft', running: 'Lauf', home: 'Home' };

/** Team aus den Einheiten der letzten 90 Tage. Ohne Einheiten gibt es noch keine Identität. */
export function trainingIdentity(activities: Activity[], now: number): Identity | null {
  const from = now - IDENTITY_WINDOW_DAYS * 86_400_000;
  const recent = activities.filter((a) => a.startedAt >= from && a.startedAt <= now);
  if (recent.length === 0) return null;

  const counts: Record<ActivityType, number> = { strength: 0, running: 0, home: 0 };
  for (const a of recent) counts[a.type] += 1;

  const [topType, topCount] = (Object.entries(counts) as [ActivityType, number][]).sort((a, b) => b[1] - a[1])[0];
  const team = topCount / recent.length >= IDENTITY_SHARE ? TEAM_OF[topType] : 'Allround';
  return { team, sessions: recent.length };
}

export type WeekComparison = {
  minutes: number;
  lastMinutes: number;
  sessions: number;
  lastSessions: number;
  /** Positiv oder neutral formuliert, null wenn es nichts zu vergleichen gibt */
  message: string | null;
};

/**
 * Diese Woche bis jetzt gegen die Vorwoche bis zum gleichen Zeitpunkt.
 * Fair: Montagmorgen wird nicht mit einer ganzen Vorwoche verglichen.
 */
export function compareWithLastWeek(activities: Activity[], now: number): WeekComparison {
  const thisStart = weekStart(now);
  const elapsed = now - thisStart;
  const lastStart = weekStart(thisStart - 1);
  const lastEnd = lastStart + elapsed;

  const sum = (from: number, to: number) => {
    const inRange = activities.filter((a) => a.startedAt >= from && a.startedAt <= to);
    return { minutes: Math.round(inRange.reduce((s, a) => s + a.durationSeconds, 0) / 60), sessions: inRange.length };
  };
  const current = sum(thisStart, now);
  const last = sum(lastStart, lastEnd);

  let message: string | null = null;
  if (current.minutes > 0 || last.minutes > 0) {
    const diff = current.minutes - last.minutes;
    if (last.minutes === 0) message = 'Mehr als letzte Woche bis heute. Starker Start!';
    else if (diff > 0) message = `${diff} Min mehr als letzte Woche bis heute.`;
    else if (diff === 0) message = 'Genau so viel wie letzte Woche bis heute.';
    else message = `Letzte Woche bis heute: ${last.minutes} Min. Jede Minute zählt.`;
  }

  return { minutes: current.minutes, lastMinutes: last.minutes, sessions: current.sessions, lastSessions: last.sessions, message };
}
