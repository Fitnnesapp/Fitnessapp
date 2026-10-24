import { dayKey, type Activity } from './activity.ts';

/**
 * Persönlicher Trainingsplan aus wenigen Antworten.
 *
 * Die Regeln sind bewusst einfach und nachvollziehbar (keine KI). Psychologische Grundlagen:
 * - Wenn-Dann-Pläne (Implementation Intentions, Gollwitzer & Sheeran 2006): Jede Einheit hat
 *   einen festen Tag und eine Tageszeit, daraus entsteht ein Satz "Wenn ..., dann ...".
 * - Neustart-Effekt (Dai, Milkman & Riis 2014): Der Plan kann bewusst an einem Montag starten.
 * - Comeback belohnen (Milkman et al. 2021): Nach einer verpassten Einheit wird die nächste
 *   ausdrücklich als Comeback begrüßt, statt Schuldgefühle zu erzeugen.
 */

export type PlanGoal = 'muskeln' | 'fitness' | 'abnehmen' | 'ausdauer';
export type PlanLevel = 'einsteiger' | 'fortgeschritten';
export type PlanPlace = 'studio' | 'zuhause' | 'beides';
export type PlanTime = 'morgens' | 'mittags' | 'abends';

export type PlanAnswers = {
  goal: PlanGoal;
  level: PlanLevel;
  place: PlanPlace;
  /** Trainingstage, 0 = Montag bis 6 = Sonntag */
  days: number[];
  /** Geplante Minuten pro Einheit */
  minutes: number;
  time: PlanTime;
};

export type PlanSessionKind = 'strength' | 'program' | 'run';

export type PlanSession = {
  /** Wochentag, 0 = Montag */
  day: number;
  kind: PlanSessionKind;
  title: string;
  detail: string;
  minutes: number;
  /** nur bei Home-Programmen */
  programId?: string;
};

export type TrainingPlan = {
  answers: PlanAnswers;
  sessions: PlanSession[];
  createdAt: number;
  /** Ab diesem Zeitpunkt (Tagesbeginn) gilt der Plan */
  startsAt: number;
};

export const GOAL_LABELS: Record<PlanGoal, string> = {
  muskeln: 'Muskeln aufbauen',
  fitness: 'Fit und gesund bleiben',
  abnehmen: 'Abnehmen',
  ausdauer: 'Ausdauer und Laufen',
};

export const WEEKDAY_NAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
export const WEEKDAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const TIME_PHRASE: Record<PlanTime, string> = { morgens: 'morgens', mittags: 'mittags', abends: 'abends' };

/** Empfohlene Trainingstage je Anzahl: verteilt über die Woche, mit Pausentagen dazwischen. */
export function recommendedDays(count: number): number[] {
  const presets: Record<number, number[]> = {
    2: [1, 4],
    3: [0, 2, 4],
    4: [0, 1, 3, 5],
    5: [0, 1, 3, 4, 5],
    6: [0, 1, 2, 3, 4, 5],
  };
  return presets[Math.max(2, Math.min(6, count))];
}

/** Empfohlene Anzahl Trainingstage je Ziel und Erfahrung. */
export function recommendedDayCount(goal: PlanGoal, level: PlanLevel): number {
  if (level === 'einsteiger') return 3;
  // Fortgeschrittene beim Abnehmen und für die Fitness: 3 reichen oft, mehr Volumen bringt bei Kraft und Ausdauer mehr
  return goal === 'muskeln' || goal === 'ausdauer' ? 4 : 3;
}

type Slot =
  | { kind: 'strength'; focus: string }
  | { kind: 'home'; category: 'HIIT' | 'Core' | 'Mobility' | 'Ganzkörper' }
  | { kind: 'run'; type: 'locker' | 'intervall' | 'lang' };

function strengthFoci(count: number): string[] {
  if (count <= 3) return ['Ganzkörper A', 'Ganzkörper B'];
  if (count === 4) return ['Oberkörper', 'Unterkörper'];
  return ['Push: Brust, Schultern, Trizeps', 'Pull: Rücken, Bizeps', 'Beine und Rumpf'];
}

/** Abfolge der Einheiten je Ziel. Die letzte Einheit der Woche bekommt bei Ausdauer den langen Lauf. */
function slotsFor(goal: PlanGoal, place: PlanPlace, count: number): Slot[] {
  const foci = strengthFoci(goal === 'muskeln' ? count : Math.min(count, 3));
  let fociIndex = 0;
  const strength = (): Slot => {
    if (place === 'zuhause') return { kind: 'home', category: 'Ganzkörper' };
    const focus = foci[fociIndex % foci.length];
    fociIndex += 1;
    return { kind: 'strength', focus };
  };

  const slots: Slot[] = [];
  for (let i = 0; i < count; i++) {
    switch (goal) {
      case 'muskeln':
        // Bei "beides" ab 4 Tagen ein Rumpf-Workout zu Hause als Ergänzung
        slots.push(place === 'beides' && count >= 4 && i === count - 1 ? { kind: 'home', category: 'Core' } : strength());
        break;
      case 'ausdauer': {
        const pattern: Slot[] =
          count <= 2
            ? [{ kind: 'run', type: 'locker' }, { kind: 'run', type: 'lang' }]
            : count === 3
              ? [{ kind: 'run', type: 'locker' }, { kind: 'run', type: 'intervall' }, { kind: 'run', type: 'lang' }]
              : [
                  { kind: 'run', type: 'locker' },
                  strength(),
                  { kind: 'run', type: 'intervall' },
                  ...Array.from({ length: count - 4 }, (_, k): Slot => (k % 2 === 0 ? { kind: 'home', category: 'Mobility' } : { kind: 'run', type: 'locker' })),
                  { kind: 'run', type: 'lang' },
                ];
        return pattern;
      }
      case 'abnehmen': {
        const cycle: (() => Slot)[] = [strength, () => ({ kind: 'home', category: 'HIIT' }), () => ({ kind: 'run', type: 'locker' })];
        slots.push(cycle[i % cycle.length]());
        break;
      }
      case 'fitness': {
        const cycle: (() => Slot)[] = [
          strength,
          () => ({ kind: 'run', type: 'locker' }),
          () => ({ kind: 'home', category: 'Core' }),
          () => ({ kind: 'home', category: 'Mobility' }),
        ];
        slots.push(cycle[i % cycle.length]());
        break;
      }
    }
  }
  return slots;
}

const PROGRAM_CHOICES: Record<string, Record<PlanLevel, string[]>> = {
  HIIT: { einsteiger: ['hiit-express'], fortgeschritten: ['hiit-inferno', 'hiit-express'] },
  Core: { einsteiger: ['core-basics'], fortgeschritten: ['core-burn', 'core-basics'] },
  Mobility: { einsteiger: ['mobility-morgen', 'mobility-abend'], fortgeschritten: ['mobility-morgen', 'mobility-abend'] },
  'Ganzkörper': { einsteiger: ['ganzkoerper-basics', 'hiit-express'], fortgeschritten: ['ganzkoerper-power', 'ganzkoerper-basics', 'hiit-express'] },
};

export type ProgramInfo = { id: string; name: string };

type BuildOptions = {
  /** Programme, die der Nutzer öffnen darf (z.B. ohne Premium nur die kostenlosen) */
  allowedProgramIds: readonly string[];
  programs: readonly ProgramInfo[];
  now: number;
  /** Start erst am nächsten Montag (Neustart-Effekt) */
  startNextMonday: boolean;
};

function pickProgram(category: string, level: PlanLevel, time: PlanTime, allowed: readonly string[]): string {
  let choices = PROGRAM_CHOICES[category][level];
  // Abends lieber die ruhige Abend-Mobility
  if (category === 'Mobility' && time === 'abends') choices = ['mobility-abend', ...choices];
  return choices.find((id) => allowed.includes(id)) ?? allowed[0];
}

function startOfDay(at: number): number {
  const d = new Date(at);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Nächster Montag 00:00, oder heute, wenn heute Montag ist. */
export function nextMonday(now: number): number {
  const d = new Date(now);
  const daysUntil = (8 - d.getDay()) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + daysUntil).getTime();
}

export function buildPlan(answers: PlanAnswers, options: BuildOptions): TrainingPlan {
  const days = [...new Set(answers.days)].filter((d) => d >= 0 && d <= 6).sort((a, b) => a - b);
  const slots = slotsFor(answers.goal, answers.place, days.length);
  const nameOf = (id: string) => options.programs.find((p) => p.id === id)?.name ?? id;
  const m = answers.minutes;

  const sessions = days.map((day, i): PlanSession => {
    const slot = slots[i];
    if (slot.kind === 'strength') {
      return {
        day,
        kind: 'strength',
        title: `Kraft: ${slot.focus}`,
        detail:
          answers.level === 'einsteiger'
            ? '4 bis 5 Übungen, je 3 Sätze mit 10 bis 12 Wiederholungen. Technik vor Gewicht.'
            : '5 bis 6 Übungen, je 3 bis 4 Sätze mit 6 bis 12 Wiederholungen. Gewicht steigern, wenn alle Sätze sauber klappen.',
        minutes: m,
      };
    }
    if (slot.kind === 'home') {
      const programId = pickProgram(slot.category, answers.level, answers.time, options.allowedProgramIds);
      return { day, kind: 'program', title: nameOf(programId), detail: `${slot.category} zu Hause, ohne Geräte`, minutes: m, programId };
    }
    if (slot.type === 'intervall') {
      const reps = answers.level === 'einsteiger' ? 5 : 8;
      return {
        day,
        kind: 'run',
        title: 'Intervall-Lauf',
        detail: `10 Min einlaufen, ${reps} × 1 Min zügig mit je 2 Min locker, dann auslaufen.`,
        minutes: m,
      };
    }
    if (slot.type === 'lang') {
      return { day, kind: 'run', title: 'Langer Lauf', detail: 'Ruhiges Tempo, bei dem du dich noch unterhalten kannst.', minutes: m + 15 };
    }
    return { day, kind: 'run', title: 'Lockerer Lauf', detail: 'Entspanntes Tempo, du solltest dabei noch sprechen können.', minutes: m };
  });

  return {
    answers: { ...answers, days },
    sessions,
    createdAt: options.now,
    startsAt: options.startNextMonday ? nextMonday(options.now) : startOfDay(options.now),
  };
}

/** Wochentag (0 = Montag) eines Zeitpunkts. */
export function weekdayOf(at: number): number {
  return (new Date(at).getDay() + 6) % 7;
}

/** Die für heute geplante Einheit, falls der Plan schon gilt. */
export function sessionForDay(plan: TrainingPlan, at: number): PlanSession | null {
  if (at < plan.startsAt) return null;
  return plan.sessions.find((s) => s.day === weekdayOf(at)) ?? null;
}

/** Satz als Wenn-Dann-Plan, z.B. "Wenn es Montag abends ist, mache ich Kraft: Ganzkörper A." */
export function ifThenSentence(session: PlanSession, time: PlanTime): string {
  return `Wenn es ${WEEKDAY_NAMES[session.day]} ${TIME_PHRASE[time]} ist, mache ich ${session.title}.`;
}

/**
 * Wurde die letzte geplante Einheit vor heute verpasst?
 * Zählt nur Tage, an denen der Plan schon galt, und schaut höchstens 7 Tage zurück.
 */
export function missedLastPlanned(plan: TrainingPlan, activities: Activity[], now: number): boolean {
  const trainedDays = new Set(activities.map((a) => dayKey(a.startedAt)));
  const today = startOfDay(now);
  for (let back = 1; back <= 7; back++) {
    const d = new Date(today);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate() - back).getTime();
    if (day < plan.startsAt) return false;
    if (plan.sessions.some((s) => s.day === weekdayOf(day))) return !trainedDays.has(dayKey(day));
  }
  return false;
}

/** Nächste geplante Einheit nach heute, mit Abstand in Tagen (1 = morgen). */
export function nextSession(plan: TrainingPlan, now: number): { session: PlanSession; inDays: number } | null {
  if (plan.sessions.length === 0) return null;
  const today = startOfDay(now);
  for (let ahead = 1; ahead <= 14; ahead++) {
    const d = new Date(today);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate() + ahead).getTime();
    if (day < plan.startsAt) continue;
    const session = plan.sessions.find((s) => s.day === weekdayOf(day));
    if (session) return { session, inDays: ahead };
  }
  return null;
}

/**
 * Geplante Einheiten in der Woche ab `weekStartAt` (Montag 00:00), die nicht vor dem Planstart liegen.
 * So zeigt die erste Woche nur die Einheiten, die nach dem Erstellen noch kommen.
 */
export function plannedDaysThisWeek(plan: TrainingPlan, weekStartAt: number): number {
  const start = new Date(weekStartAt);
  return plan.sessions.filter((s) => {
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + s.day).getTime();
    return day >= plan.startsAt;
  }).length;
}
