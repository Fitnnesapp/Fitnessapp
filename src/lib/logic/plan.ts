import { dayKey, type Activity } from './activity.ts';

/**
 * Persönlicher Trainingsplan aus den Antworten des Einstiegs.
 *
 * Die Regeln sind bewusst einfach und nachvollziehbar (keine KI). Psychologische Grundlagen:
 * - Wenn-Dann-Pläne (Implementation Intentions, Gollwitzer & Sheeran 2006): Jede Einheit hat
 *   einen festen Tag und eine Tageszeit, daraus entsteht ein Satz "Wenn ..., dann ...".
 * - Neustart-Effekt (Dai, Milkman & Riis 2014): Der Plan kann bewusst an einem Montag starten.
 * - Comeback belohnen (Milkman et al. 2021): Nach einer verpassten Einheit wird die nächste
 *   ausdrücklich als Comeback begrüßt, statt Schuldgefühle zu erzeugen.
 * - Autonomie: Ziele und Orte lassen sich kombinieren, jeder Tag lässt sich einzeln belegen.
 */

export type PlanGoal = 'muskeln' | 'fitness' | 'abnehmen' | 'ausdauer' | 'beweglichkeit';
export type PlanLevel = 'einsteiger' | 'fortgeschritten';
export type PlanPlace = 'studio' | 'zuhause' | 'draussen';
export type PlanTime = 'morgens' | 'mittags' | 'abends';
export type HomeEquipment = 'kurzhanteln' | 'kettlebell' | 'widerstandsband' | 'klimmzugstange';
export type RunExperience = 'keine' | 'bis5' | 'bis10' | 'mehr';
export type Limitation = 'knie' | 'ruecken' | 'schulter' | 'herzkreislauf';

/** Nur mit ausdrücklicher Einwilligung erhoben (Gesundheitsdaten, Art. 9 DSGVO). */
export type BodyProfile = {
  age: number | null;
  limitations: Limitation[];
};

export type PlanAnswers = {
  /** Ein oder zwei Ziele, das erste ist das Hauptziel */
  goals: PlanGoal[];
  level: PlanLevel;
  places: PlanPlace[];
  equipment: HomeEquipment[];
  runExperience: RunExperience;
  /** Trainingstage, 0 = Montag bis 6 = Sonntag */
  days: number[];
  /** An einigen Tagen eine kurze zweite Einheit */
  doubleSessions: boolean;
  /** Geplante Minuten pro Haupteinheit */
  minutes: number;
  time: PlanTime;
  /** null, wenn keine Einwilligung für Gesundheitsdaten */
  body: BodyProfile | null;
};

export type PlanSessionKind = 'strength' | 'program' | 'run';

export type PlanSession = {
  /** Eindeutig innerhalb des Plans */
  id: string;
  /** Wochentag, 0 = Montag */
  day: number;
  kind: PlanSessionKind;
  title: string;
  detail: string;
  minutes: number;
  /** nur bei Home-Programmen */
  programId?: string;
  /** Kurze Zusatzeinheit am selben Tag */
  extra?: boolean;
};

export type TrainingPlan = {
  answers: PlanAnswers;
  /** Nach Tag sortiert, Haupteinheit vor Zusatzeinheit */
  sessions: PlanSession[];
  /** Hinweise aus den Angaben, z.B. zu Beschwerden */
  notes: string[];
  createdAt: number;
  /** Ab diesem Zeitpunkt (Tagesbeginn) gilt der Plan */
  startsAt: number;
};

export const GOAL_LABELS: Record<PlanGoal, string> = {
  muskeln: 'Muskeln aufbauen',
  fitness: 'Fit und gesund bleiben',
  abnehmen: 'Abnehmen',
  ausdauer: 'Ausdauer und Laufen',
  beweglichkeit: 'Beweglicher werden',
};

export const PLACE_LABELS: Record<PlanPlace, string> = {
  studio: 'Fitnessstudio',
  zuhause: 'Zu Hause',
  draussen: 'Draußen',
};

export const EQUIPMENT_LABELS: Record<HomeEquipment, string> = {
  kurzhanteln: 'Kurzhanteln',
  kettlebell: 'Kettlebell',
  widerstandsband: 'Widerstandsband',
  klimmzugstange: 'Klimmzugstange',
};

export const LIMITATION_LABELS: Record<Limitation, string> = {
  knie: 'Knie',
  ruecken: 'Rücken',
  schulter: 'Schulter',
  herzkreislauf: 'Herz-Kreislauf',
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

/** Empfohlene Anzahl Trainingstage je Hauptziel und Erfahrung. */
export function recommendedDayCount(goal: PlanGoal, level: PlanLevel): number {
  if (level === 'einsteiger') return 3;
  return goal === 'muskeln' || goal === 'ausdauer' ? 4 : 3;
}

// ---------------------------------------------------------------------------------------------
// Bausteine

type Slot =
  | { kind: 'strength'; focus: string }
  | { kind: 'home'; category: 'HIIT' | 'Core' | 'Mobility' | 'Ganzkörper' }
  | { kind: 'run'; type: 'locker' | 'intervall' | 'lang' };

function strengthFoci(count: number): string[] {
  if (count <= 3) return ['Ganzkörper A', 'Ganzkörper B'];
  if (count === 4) return ['Oberkörper', 'Unterkörper'];
  return ['Push: Brust, Schultern, Trizeps', 'Pull: Rücken, Bizeps', 'Beine und Rumpf'];
}

/** Abfolge der Einheiten für ein einzelnes Ziel. */
function slotsForGoal(goal: PlanGoal, count: number, strengthCount: number): Slot[] {
  const foci = strengthFoci(strengthCount);
  let fociIndex = 0;
  const strength = (): Slot => {
    const focus = foci[fociIndex % foci.length];
    fociIndex += 1;
    return { kind: 'strength', focus };
  };
  const cycle = (parts: (() => Slot)[]) => Array.from({ length: count }, (_, i) => parts[i % parts.length]());

  switch (goal) {
    case 'muskeln':
      return cycle([strength]);
    case 'ausdauer': {
      if (count <= 0) return [];
      if (count === 1) return [{ kind: 'run', type: 'locker' }];
      if (count === 2) return [{ kind: 'run', type: 'locker' }, { kind: 'run', type: 'lang' }];
      if (count === 3) return [{ kind: 'run', type: 'locker' }, { kind: 'run', type: 'intervall' }, { kind: 'run', type: 'lang' }];
      return [
        { kind: 'run', type: 'locker' },
        strength(),
        { kind: 'run', type: 'intervall' },
        ...Array.from({ length: count - 4 }, (_, k): Slot =>
          k % 2 === 0 ? { kind: 'home', category: 'Mobility' } : { kind: 'run', type: 'locker' },
        ),
        { kind: 'run', type: 'lang' },
      ];
    }
    case 'abnehmen':
      return cycle([strength, () => ({ kind: 'home', category: 'HIIT' }), () => ({ kind: 'run', type: 'locker' })]);
    case 'fitness':
      return cycle([
        strength,
        () => ({ kind: 'run', type: 'locker' }),
        () => ({ kind: 'home', category: 'Core' }),
        () => ({ kind: 'home', category: 'Mobility' }),
      ]);
    case 'beweglichkeit':
      return cycle([() => ({ kind: 'home', category: 'Mobility' }), () => ({ kind: 'home', category: 'Core' }), strength]);
  }
}

/**
 * Kombiniert ein oder zwei Ziele: Das Hauptziel bekommt gut die Hälfte der Tage (mindestens eine mehr
 * bei ungerader Zahl), das zweite Ziel den Rest. Die Einheiten werden abwechselnd verteilt; ein langer
 * Lauf landet immer auf dem letzten Tag.
 */
export function combineGoals(goals: PlanGoal[], count: number): Slot[] {
  const [primary, secondary] = goals.length > 0 ? goals : (['fitness'] as PlanGoal[]);
  if (!secondary || secondary === primary || count < 2) return slotsForGoal(primary, count, count);

  const primaryCount = Math.ceil(count / 2);
  const secondaryCount = count - primaryCount;
  const strengthDays = goals.includes('muskeln') ? count : Math.min(count, 3);
  const a = slotsForGoal(primary, primaryCount, strengthDays);
  const b = slotsForGoal(secondary, secondaryCount, strengthDays);

  const result: Slot[] = [];
  for (let i = 0; i < count; i++) {
    const fromA = i % 2 === 0 ? a.shift() : b.shift();
    result.push(fromA ?? a.shift() ?? b.shift() ?? { kind: 'home', category: 'Mobility' });
  }
  const longIndex = result.findIndex((s) => s.kind === 'run' && s.type === 'lang');
  if (longIndex >= 0 && longIndex !== count - 1) {
    const [long] = result.splice(longIndex, 1);
    result.push(long);
  }
  return result;
}

const PROGRAM_CHOICES: Record<string, Record<PlanLevel, string[]>> = {
  HIIT: { einsteiger: ['hiit-express'], fortgeschritten: ['hiit-inferno', 'hiit-express'] },
  Core: { einsteiger: ['core-basics'], fortgeschritten: ['core-burn', 'core-basics'] },
  Mobility: { einsteiger: ['mobility-morgen', 'mobility-abend'], fortgeschritten: ['mobility-morgen', 'mobility-abend'] },
  'Ganzkörper': { einsteiger: ['ganzkoerper-basics', 'hiit-express'], fortgeschritten: ['ganzkoerper-power', 'ganzkoerper-basics', 'hiit-express'] },
};

export type ProgramInfo = { id: string; name: string };

export type BuildOptions = {
  /** Programme, die der Nutzer öffnen darf (z.B. ohne Premium nur die kostenlosen) */
  allowedProgramIds: readonly string[];
  programs: readonly ProgramInfo[];
  now: number;
  /** Start erst am nächsten Montag (Neustart-Effekt) */
  startNextMonday: boolean;
};

/** Was die Angaben zu Alter und Beschwerden für den Plan bedeuten. */
type Constraints = { noJumps: boolean; noIntervals: boolean; gentle: boolean; back: boolean; shoulder: boolean };

function constraintsOf(answers: PlanAnswers): Constraints {
  const lim = answers.body?.limitations ?? [];
  const age = answers.body?.age ?? null;
  const heart = lim.includes('herzkreislauf');
  const older = age !== null && age >= 60;
  return {
    noJumps: lim.includes('knie') || heart || older,
    noIntervals: lim.includes('knie') || heart,
    gentle: heart || older,
    back: lim.includes('ruecken'),
    shoulder: lim.includes('schulter'),
  };
}

function effectiveLevel(answers: PlanAnswers, c: Constraints): PlanLevel {
  return c.gentle ? 'einsteiger' : answers.level;
}

function pickProgram(category: string, level: PlanLevel, time: PlanTime, allowed: readonly string[]): string {
  let choices = PROGRAM_CHOICES[category][level];
  // Abends lieber die ruhige Abend-Mobility
  if (category === 'Mobility' && time === 'abends') choices = ['mobility-abend', ...choices];
  return choices.find((id) => allowed.includes(id)) ?? allowed[0];
}

/** Passt einen Baustein an Orte, Lauferfahrung und Beschwerden an. */
function adapt(slot: Slot, answers: PlanAnswers, c: Constraints): Slot {
  const canRun = answers.places.includes('draussen') || answers.places.includes('studio');
  const hasStudio = answers.places.includes('studio');
  const hasHome = answers.places.includes('zuhause');

  if (slot.kind === 'run') {
    if (!canRun) return { kind: 'home', category: c.noJumps ? 'Core' : 'HIIT' };
    if (slot.type === 'intervall' && (c.noIntervals || answers.runExperience === 'keine')) return { kind: 'run', type: 'locker' };
    return slot;
  }
  if (slot.kind === 'strength') {
    // Ohne Studio und ohne Geräte: Ganzkörper-Programm zu Hause
    if (!hasStudio && (!hasHome || answers.equipment.length === 0)) return { kind: 'home', category: 'Ganzkörper' };
    return slot;
  }
  if (slot.category === 'HIIT' && c.noJumps) return { kind: 'home', category: 'Core' };
  return slot;
}

function strengthSession(answers: PlanAnswers, c: Constraints, focus: string): Omit<PlanSession, 'id' | 'day'> {
  const atHome = !answers.places.includes('studio');
  const level = effectiveLevel(answers, c);
  const equipment = answers.equipment.map((e) => EQUIPMENT_LABELS[e]).join(', ');
  let detail =
    level === 'einsteiger'
      ? '4 bis 5 Übungen, je 3 Sätze mit 10 bis 12 Wiederholungen. Technik vor Gewicht.'
      : '5 bis 6 Übungen, je 3 bis 4 Sätze mit 6 bis 12 Wiederholungen. Gewicht steigern, wenn alle Sätze sauber klappen.';
  if (atHome) detail = `Zu Hause mit ${equipment}. ${detail}`;
  if (c.back) detail += ' Rücken schonen: keine schweren Lasten auf der Wirbelsäule, Rumpf mittrainieren.';
  if (c.shoulder) detail += ' Schulter schonen: kein schweres Drücken über Kopf.';
  return { kind: 'strength', title: `Kraft: ${focus}`, detail, minutes: answers.minutes };
}

function runSession(answers: PlanAnswers, type: 'locker' | 'intervall' | 'lang', minutes: number): Omit<PlanSession, 'id' | 'day'> {
  const beginner = answers.runExperience === 'keine';
  if (type === 'intervall') {
    const reps = answers.level === 'einsteiger' || answers.runExperience === 'bis5' ? 5 : 8;
    return {
      kind: 'run',
      title: 'Intervall-Lauf',
      detail: `10 Min einlaufen, ${reps} × 1 Min zügig mit je 2 Min locker, dann auslaufen.`,
      minutes,
    };
  }
  if (beginner) {
    return {
      kind: 'run',
      title: type === 'lang' ? 'Längere Geh-Lauf-Einheit' : 'Geh-Lauf-Einheit',
      detail: 'Abwechselnd 1 Minute locker laufen und 2 Minuten zügig gehen. Jede Woche etwas mehr laufen.',
      minutes,
    };
  }
  if (type === 'lang') {
    return { kind: 'run', title: 'Langer Lauf', detail: 'Ruhiges Tempo, bei dem du dich noch unterhalten kannst.', minutes };
  }
  return { kind: 'run', title: 'Lockerer Lauf', detail: 'Entspanntes Tempo, du solltest dabei noch sprechen können.', minutes };
}

function longRunMinutes(answers: PlanAnswers): number {
  const extra = { keine: 5, bis5: 15, bis10: 25, mehr: 40 }[answers.runExperience];
  return answers.minutes + extra;
}

function toSession(slot: Slot, answers: PlanAnswers, c: Constraints, options: BuildOptions): Omit<PlanSession, 'id' | 'day'> {
  const nameOf = (id: string) => options.programs.find((p) => p.id === id)?.name ?? id;
  if (slot.kind === 'strength') return strengthSession(answers, c, slot.focus);
  if (slot.kind === 'run') {
    return runSession(answers, slot.type, slot.type === 'lang' ? longRunMinutes(answers) : answers.minutes);
  }
  const programId = pickProgram(slot.category, effectiveLevel(answers, c), answers.time, options.allowedProgramIds);
  return {
    kind: 'program',
    title: nameOf(programId),
    detail: `${slot.category} zu Hause, ohne Geräte${c.noJumps ? ', ohne Sprünge' : ''}`,
    minutes: answers.minutes,
    programId,
  };
}

/** Kurze Zusatzeinheit für Doppel-Tage, passend zu den Zielen. */
function extraSlot(answers: PlanAnswers, main: Slot, c: Constraints): Slot | null {
  if (main.kind === 'run' && main.type === 'lang') return null;
  const canRun = answers.places.includes('draussen') || answers.places.includes('studio');
  const wantsCardio = answers.goals.includes('ausdauer') || answers.goals.includes('abnehmen');
  if (main.kind === 'strength' && wantsCardio && canRun) return { kind: 'run', type: 'locker' };
  if (main.kind === 'run') return { kind: 'home', category: 'Core' };
  return { kind: 'home', category: c.back ? 'Core' : 'Mobility' };
}

function notesFor(answers: PlanAnswers, c: Constraints): string[] {
  const notes: string[] = [];
  const lim = answers.body?.limitations ?? [];
  if (lim.includes('herzkreislauf')) {
    notes.push('Bei Herz-Kreislauf-Beschwerden: Sprich vor dem Start mit deiner Ärztin oder deinem Arzt. Der Plan bleibt bewusst moderat.');
  }
  if (lim.includes('knie')) notes.push('Knie: keine Sprünge und keine Intervalle. Bei Schmerzen die Einheit abbrechen.');
  if (c.back) notes.push('Rücken: Rumpftraining ist eingeplant, schwere Lasten auf der Wirbelsäule meiden.');
  if (c.shoulder) notes.push('Schulter: Drückübungen über Kopf meiden oder nur leicht ausführen.');
  if ((answers.body?.age ?? 0) >= 60) notes.push('Ab 60 setzt der Plan auf gelenkschonende Einheiten und mehr Beweglichkeit.');
  if (notes.length > 0) notes.push('Der Plan ersetzt keine ärztliche Beratung.');
  return notes;
}

export function buildPlan(answers: PlanAnswers, options: BuildOptions): TrainingPlan {
  const days = [...new Set(answers.days)].filter((d) => d >= 0 && d <= 6).sort((a, b) => a - b);
  const goals = answers.goals.slice(0, 2);
  const normalized: PlanAnswers = {
    ...answers,
    goals: goals.length > 0 ? goals : ['fitness'],
    places: answers.places.length > 0 ? answers.places : ['zuhause'],
    days,
  };
  const c = constraintsOf(normalized);
  const slots = combineGoals(normalized.goals, days.length).map((s) => adapt(s, normalized, c));

  const sessions: PlanSession[] = [];
  days.forEach((day, i) => {
    sessions.push({ id: `${day}-0`, day, ...toSession(slots[i], normalized, c, options) });
    // Doppel-Einheiten an jedem zweiten Trainingstag, höchstens drei pro Woche
    if (normalized.doubleSessions && i % 2 === 0 && sessions.filter((s) => s.extra).length < 3) {
      const extra = extraSlot(normalized, slots[i], c);
      if (extra) {
        const adapted = adapt(extra, normalized, c);
        sessions.push({ id: `${day}-1`, day, ...toSession(adapted, normalized, c, options), minutes: 15, extra: true });
      }
    }
  });

  return {
    answers: normalized,
    sessions,
    notes: notesFor(normalized, c),
    createdAt: options.now,
    startsAt: options.startNextMonday ? nextMonday(options.now) : startOfDay(options.now),
  };
}

// ---------------------------------------------------------------------------------------------
// Einzelne Tage selbst belegen

export type SessionTemplate = { key: string; group: string; session: Omit<PlanSession, 'id' | 'day'> };

/** Alle Einheiten, aus denen man einen Tag selbst zusammenstellen kann. */
export function sessionTemplates(answers: PlanAnswers, options: BuildOptions): SessionTemplate[] {
  const c = constraintsOf(answers);
  const list: SessionTemplate[] = [];
  const foci = ['Ganzkörper A', 'Ganzkörper B', 'Oberkörper', 'Unterkörper', 'Push: Brust, Schultern, Trizeps', 'Pull: Rücken, Bizeps', 'Beine und Rumpf'];
  for (const focus of foci) list.push({ key: `kraft-${focus}`, group: 'Kraft', session: strengthSession(answers, c, focus) });

  const runTypes: ('locker' | 'intervall' | 'lang')[] = c.noIntervals ? ['locker', 'lang'] : ['locker', 'intervall', 'lang'];
  for (const type of runTypes) {
    list.push({
      key: `lauf-${type}`,
      group: 'Laufen',
      session: runSession(answers, type, type === 'lang' ? longRunMinutes(answers) : answers.minutes),
    });
  }

  const level = effectiveLevel(answers, c);
  for (const program of options.programs) {
    if (!options.allowedProgramIds.includes(program.id)) continue;
    const category = Object.keys(PROGRAM_CHOICES).find((cat) => PROGRAM_CHOICES[cat].fortgeschritten.includes(program.id) || PROGRAM_CHOICES[cat].einsteiger.includes(program.id));
    if (category === 'HIIT' && c.noJumps) continue;
    if (level === 'einsteiger' && ['hiit-inferno', 'core-burn', 'ganzkoerper-power'].includes(program.id)) continue;
    list.push({
      key: `programm-${program.id}`,
      group: 'Zu Hause',
      session: { kind: 'program', title: program.name, detail: `${category ?? 'Programm'} zu Hause, ohne Geräte`, minutes: answers.minutes, programId: program.id },
    });
  }
  return list;
}

/** Belegt einen Tag neu: keine, eine oder zwei Einheiten. Die Reihenfolge der übrigen Tage bleibt. */
export function setDaySessions(plan: TrainingPlan, day: number, templates: SessionTemplate[]): TrainingPlan {
  const others = plan.sessions.filter((s) => s.day !== day);
  const mine = templates.slice(0, 2).map(
    (t, i): PlanSession => ({ ...t.session, id: `${day}-${i}`, day, extra: i === 1 ? true : undefined, minutes: i === 1 ? Math.min(t.session.minutes, 20) : t.session.minutes }),
  );
  const sessions = [...others, ...mine].sort((a, b) => a.day - b.day || (a.extra ? 1 : 0) - (b.extra ? 1 : 0));
  const days = [...new Set(sessions.map((s) => s.day))].sort((a, b) => a - b);
  return { ...plan, sessions, answers: { ...plan.answers, days } };
}

// ---------------------------------------------------------------------------------------------
// Auswertung im Alltag

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

/** Wochentag (0 = Montag) eines Zeitpunkts. */
export function weekdayOf(at: number): number {
  return (new Date(at).getDay() + 6) % 7;
}

/** Alle für einen Tag geplanten Einheiten (Haupteinheit zuerst), falls der Plan schon gilt. */
export function sessionsForDay(plan: TrainingPlan, at: number): PlanSession[] {
  if (at < plan.startsAt) return [];
  return plan.sessions.filter((s) => s.day === weekdayOf(at));
}

/** Die Haupteinheit des Tages, falls der Plan schon gilt. */
export function sessionForDay(plan: TrainingPlan, at: number): PlanSession | null {
  return sessionsForDay(plan, at)[0] ?? null;
}

/** Satz als Wenn-Dann-Plan, z.B. "Wenn es Montag abends ist, mache ich Kraft: Ganzkörper A." */
export function ifThenSentence(session: PlanSession, time: PlanTime): string {
  if (session.extra) return `Danach, ebenfalls am ${WEEKDAY_NAMES[session.day]}: ${session.title}.`;
  return `Wenn es ${WEEKDAY_NAMES[session.day]} ${TIME_PHRASE[time]} ist, mache ich ${session.title}.`;
}

/** Anzahl verschiedener Trainingstage im Plan. */
export function planDayCount(plan: TrainingPlan): number {
  return new Set(plan.sessions.map((s) => s.day)).size;
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

/** Nächste geplante Haupteinheit nach heute, mit Abstand in Tagen (1 = morgen). */
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
 * Geplante Trainingstage in der Woche ab `weekStartAt` (Montag 00:00), die nicht vor dem Planstart liegen.
 * So zeigt die erste Woche nur die Tage, die nach dem Erstellen noch kommen.
 */
export function plannedDaysThisWeek(plan: TrainingPlan, weekStartAt: number): number {
  const start = new Date(weekStartAt);
  const days = new Set(
    plan.sessions
      .filter((s) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + s.day).getTime() >= plan.startsAt)
      .map((s) => s.day),
  );
  return days.size;
}

// ---------------------------------------------------------------------------------------------
// Migration gespeicherter Pläne

type PlanV1 = {
  answers: { goal: PlanGoal; level: PlanLevel; place: 'studio' | 'zuhause' | 'beides'; days: number[]; minutes: number; time: PlanTime };
  sessions: Omit<PlanSession, 'id'>[];
  createdAt: number;
  startsAt: number;
};

/** Wandelt einen Plan aus Speicher-Version 1 um. Läufe waren in Version 1 immer möglich, daher "draußen". */
export function migratePlanV1(old: PlanV1): TrainingPlan {
  const places: PlanPlace[] =
    old.answers.place === 'beides' ? ['studio', 'zuhause', 'draussen'] : [old.answers.place, 'draussen'];
  return {
    answers: {
      goals: [old.answers.goal],
      level: old.answers.level,
      places,
      equipment: [],
      runExperience: 'bis5',
      days: old.answers.days,
      doubleSessions: false,
      minutes: old.answers.minutes,
      time: old.answers.time,
      body: null,
    },
    sessions: old.sessions.map((s) => ({ ...s, id: `${s.day}-0` })),
    notes: [],
    createdAt: old.createdAt,
    startsAt: old.startsAt,
  };
}
