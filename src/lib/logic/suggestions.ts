import type { StrengthWorkout } from '../../types/workout.ts';
import { dayKey, type Activity } from './activity.ts';
import { muscleVolume } from './analytics.ts';

export type SuggestionTarget =
  | { kind: 'strength' }
  | { kind: 'run' }
  | { kind: 'program'; programId: string };

export type Suggestion = {
  /** Kurzer, nachvollziehbarer Grund. Es gibt keine versteckte KI, nur diese Regeln. */
  reason: string;
  title: string;
  target: SuggestionTarget | null;
};

type Input = {
  activities: Activity[];
  strength: StrengthWorkout[];
  now: number;
  muscleGroupOf: (exerciseId: string) => string | undefined;
};

const DAY_MS = 86400000;
/** Große Muskelgruppen, auf die der Vorschlag achtet */
const MAIN_GROUPS = ['Brust', 'Rücken', 'Beine', 'Schultern'] as const;

// Nur kostenlose Programme vorschlagen, damit kein Vorschlag an der Paywall endet
const EASY_PROGRAM = 'mobility-morgen';
const STARTER_PROGRAM = 'hiit-express';
const CORE_PROGRAM = 'core-basics';

/** Anzahl aufeinanderfolgender Trainingstage bis einschließlich heute oder gestern. */
function consecutiveDays(activities: Activity[], now: number): number {
  const days = new Set(activities.map((a) => dayKey(a.startedAt)));
  let count = 0;
  let cursor = days.has(dayKey(now)) ? now : now - DAY_MS;
  while (days.has(dayKey(cursor))) {
    count += 1;
    cursor -= DAY_MS;
  }
  return count;
}

/**
 * Einfache, nachvollziehbare Regeln statt Black-Box-KI. Die Reihenfolge entspricht der Priorität:
 * 1. ganz neu: ein leichter Einstieg
 * 2. heute schon trainiert: Erholung statt mehr
 * 3. drei und mehr Tage am Stück: Erholung
 * 4. eine große Muskelgruppe wurde 14 Tage lang nicht trainiert: Kraft mit Fokus darauf
 * 5. seit 7 Tagen oder länger nicht gelaufen: lockerer Lauf
 * 6. sonst: ein Programm einer Art, die lange nicht dran war
 */
export function suggestWorkout({ activities, strength, now, muscleGroupOf }: Input): Suggestion {
  if (activities.length === 0) {
    return {
      title: 'Starte mit HIIT Express',
      reason: 'Du hast noch kein Workout gemacht. 12 Minuten ohne Equipment sind ein guter Einstieg.',
      target: { kind: 'program', programId: STARTER_PROGRAM },
    };
  }

  const trainedToday = activities.some((a) => dayKey(a.startedAt) === dayKey(now));
  if (trainedToday) {
    return {
      title: 'Für heute ist alles geschafft',
      reason: 'Du hast heute schon trainiert. Morgen geht es mit frischer Energie weiter.',
      target: null,
    };
  }

  const streak = consecutiveDays(activities, now);
  if (streak >= 3) {
    return {
      title: 'Zeit für eine lockere Einheit',
      reason: `Du trainierst seit ${streak} Tagen am Stück. Mobility hält dich in Bewegung und lässt den Körper erholen.`,
      target: { kind: 'program', programId: EASY_PROGRAM },
    };
  }

  if (strength.length > 0) {
    const recent = muscleVolume(strength, 14, now, muscleGroupOf);
    const trained = new Set(recent.map((m) => m.group));
    const missing = MAIN_GROUPS.find((group) => !trained.has(group));
    if (missing) {
      return {
        title: `Krafttraining mit Fokus ${missing}`,
        reason: `${missing} kam in den letzten 14 Tagen nicht vor.`,
        target: { kind: 'strength' },
      };
    }
  }

  const lastRun = Math.max(0, ...activities.filter((a) => a.type === 'running').map((a) => a.startedAt));
  if (lastRun > 0 && now - lastRun >= 7 * DAY_MS) {
    const days = Math.floor((now - lastRun) / DAY_MS);
    return {
      title: 'Ein lockerer Lauf',
      reason: `Dein letzter Lauf war vor ${days} Tagen.`,
      target: { kind: 'run' },
    };
  }

  return {
    title: 'Kurzes Core-Training',
    reason: 'Ein kompaktes Rumpf-Workout ergänzt deine bisherigen Einheiten.',
    target: { kind: 'program', programId: CORE_PROGRAM },
  };
}
