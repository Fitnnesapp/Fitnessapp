import { dayKey, type Activity } from './activity.ts';

/**
 * Challenges ohne Server: Fortschritt wird aus dem lokalen Verlauf berechnet.
 *
 * Gestaltung nach Studien:
 * - Zeitlich begrenzt mit festem Start (Neustart-Effekt, Dai, Milkman & Riis 2014)
 * - Bisherige Workouts im Zeitraum zählen sofort mit (Endowed Progress, Nunes & Drèze 2006)
 * - Etappen und ein Tempo-Hinweis machen den Weg sichtbar; nahe am Ziel steigt die
 *   Motivation (Zielgradient, Kivetz, Urminsky & Zheng 2006)
 * - Ziele für spät Einsteigende werden auf die Restzeit umgerechnet, damit sie erreichbar bleiben
 */

export type ChallengeMetric = 'activeDays' | 'workouts' | 'runKm' | 'minutes';

export type Challenge = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  metric: ChallengeMetric;
  /** Feste Zeitspanne (lokale Kalendertage, inklusive) oder ab Beitritt laufend */
  window: { kind: 'fixed'; start: string; end: string } | { kind: 'rolling'; days: number };
  /** Volles Ziel für die gesamte Dauer */
  target: number;
  /** Namen der vier Etappen bei 25, 50, 75 und 100 Prozent */
  stages: [string, string, string, string];
};

export type JoinedChallenge = {
  joinedAt: number;
  /** Persönliches Ziel, beim Beitritt festgelegt */
  target: number;
};

const DAY_MS = 86400000;

function parseDay(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

function startOfDay(at: number): number {
  const d = new Date(at);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Ganze Kalendertage zwischen zwei Tagesanfängen, robust gegen die Zeitumstellung. */
function dayDiff(from: number, to: number): number {
  return Math.round((to - from) / DAY_MS);
}

function addDays(at: number, days: number): number {
  const d = new Date(at);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days).getTime();
}

/** Zeitraum als [Beginn, Ende) in Millisekunden. */
export function challengeWindow(challenge: Challenge, joinedAt?: number): { start: number; end: number } {
  if (challenge.window.kind === 'fixed') {
    return { start: parseDay(challenge.window.start), end: addDays(parseDay(challenge.window.end), 1) };
  }
  const start = startOfDay(joinedAt ?? Date.now());
  return { start, end: addDays(start, challenge.window.days) };
}

export type ChallengeStatus = 'upcoming' | 'active' | 'ended';

export function challengeStatus(challenge: Challenge, now: number, joined?: JoinedChallenge): ChallengeStatus {
  if (challenge.window.kind === 'rolling' && !joined) return 'active';
  const { start, end } = challengeWindow(challenge, joined?.joinedAt);
  if (now < start) return 'upcoming';
  if (now >= end) return 'ended';
  return 'active';
}

/** Ganze Tage bis zum Start bzw. bis zum Ende (inklusive heute). */
export function daysUntil(at: number, now: number): number {
  return Math.max(0, dayDiff(startOfDay(now), startOfDay(at)));
}

/** Messwert im Zeitraum [start, end). */
export function measure(metric: ChallengeMetric, activities: Activity[], start: number, end: number): number {
  const inWindow = activities.filter((a) => a.startedAt >= start && a.startedAt < end);
  switch (metric) {
    case 'activeDays':
      return new Set(inWindow.map((a) => dayKey(a.startedAt))).size;
    case 'workouts':
      return inWindow.length;
    case 'runKm':
      return Math.floor(inWindow.reduce((sum, a) => sum + a.distanceM, 0) / 100) / 10;
    case 'minutes':
      return Math.round(inWindow.reduce((sum, a) => sum + a.durationSeconds, 0) / 60);
  }
}

/**
 * Persönliches Ziel beim Beitritt. Wer spät in eine feste Challenge einsteigt, bekommt:
 * schon Geschafftes + anteiliges Ziel für die Restzeit, höchstens das volle Ziel.
 */
export function targetOnJoin(challenge: Challenge, activities: Activity[], joinedAt: number): number {
  if (challenge.window.kind === 'rolling') return challenge.target;
  const { start, end } = challengeWindow(challenge);
  if (joinedAt <= start) return challenge.target;
  const total = dayDiff(start, end);
  const remaining = Math.max(0, dayDiff(startOfDay(joinedAt), end));
  const done = measure(challenge.metric, activities, start, joinedAt);
  const scaled = done + Math.ceil((challenge.target * remaining) / total);
  return Math.max(1, Math.min(challenge.target, Math.round(scaled)));
}

export type ChallengeProgress = {
  value: number;
  target: number;
  ratio: number;
  completed: boolean;
  /** Erreichte Etappe: -1 = noch keine, 3 = Ziel erreicht */
  stage: number;
  /** Verbleibende Tage inklusive heute, 0 nach dem Ende */
  daysLeft: number;
  /** Abstand zum gleichmäßigen Tempo: positiv = voraus */
  aheadBy: number;
  /** Kurzer Satz zum Stand */
  message: string;
};

export function challengeProgress(
  challenge: Challenge,
  joined: JoinedChallenge,
  activities: Activity[],
  now: number,
): ChallengeProgress {
  const { start, end } = challengeWindow(challenge, joined.joinedAt);
  const value = measure(challenge.metric, activities, start, Math.min(end, now + 1));
  const target = joined.target;
  const ratio = Math.min(1, value / target);
  const completed = value >= target;
  const stage = completed ? 3 : Math.floor(ratio * 4) - 1;
  // Gleichmäßiges Tempo ab Beitritt: Wer später einsteigt, startet mit dem bis dahin Geschafften
  const paceStart = Math.max(start, startOfDay(joined.joinedAt));
  const base = paceStart > start ? measure(challenge.metric, activities, start, paceStart) : 0;
  const span = Math.max(1, dayDiff(paceStart, end));
  const elapsed = Math.min(span, Math.max(0, dayDiff(paceStart, startOfDay(now)) + 1));
  const expected = base + ((target - base) * elapsed) / span;
  const aheadBy = Math.round((value - expected) * 10) / 10;
  const daysLeft = now >= end ? 0 : daysUntil(end, now);

  const unit = unitLabel(challenge.metric, Math.abs(Math.round(aheadBy)));
  let message: string;
  if (completed) message = 'Geschafft! Alles ab jetzt ist Zugabe.';
  else if (now >= end) message = `Vorbei. Du hast ${formatValue(value)} von ${target} erreicht, und jede Einheit davon zählt.`;
  else if (value === 0) message = 'Der Anfang ist das Schwerste. Eine Einheit heute, und du bist dabei.';
  else if (aheadBy >= 1) message = `Du liegst ${Math.round(aheadBy)} ${unit} vor dem Zeitplan.`;
  else if (aheadBy <= -1) message = `Noch ${Math.round(-aheadBy)} ${unit} bis zum Zeitplan. Gut aufholbar.`;
  else message = 'Genau im Zeitplan. Weiter so!';

  return { value, target, ratio, completed, stage, daysLeft, aheadBy, message };
}

export function unitLabel(metric: ChallengeMetric, count: number): string {
  switch (metric) {
    case 'activeDays':
      return count === 1 ? 'Trainingstag' : 'Trainingstage';
    case 'workouts':
      return count === 1 ? 'Workout' : 'Workouts';
    case 'runKm':
      return 'km';
    case 'minutes':
      return 'Minuten';
  }
}

export function formatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',');
}
