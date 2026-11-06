export const REMINDER_HOUR = 19;

type ReminderInput = {
  enabled: boolean;
  currentStreak: number;
  trainedToday: boolean;
  now: number;
};

/**
 * Zeitpunkt der nächsten Erinnerung bei drohendem Serienverlust, oder null wenn keine nötig ist.
 *
 * Erinnert wird höchstens einmal täglich um 19 Uhr und nur, wenn es eine Serie gibt. Wurde heute schon
 * trainiert oder ist 19 Uhr vorbei, gilt die Erinnerung dem nächsten Tag. Trainiert man dann früher,
 * wird sie beim nächsten Abgleich wieder verschoben, sie erscheint also nicht nach einem Training.
 */
export function nextReminderAt({ enabled, currentStreak, trainedToday, now }: ReminderInput): number | null {
  if (!enabled || currentStreak <= 0) return null;

  const d = new Date(now);
  const today = new Date(d.getFullYear(), d.getMonth(), d.getDate(), REMINDER_HOUR).getTime();
  if (!trainedToday && now < today) return today;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, REMINDER_HOUR).getTime();
}

export function reminderText(currentStreak: number): { title: string; body: string } {
  return {
    title: 'Kurze Einheit heute?',
    body: `Deine Serie von ${currentStreak} ${currentStreak === 1 ? 'Tag' : 'Tagen'} wartet. Schon ein kleines Workout hält sie am Leben.`,
  };
}

/** Uhrzeit der Plan-Erinnerung je Tageszeit: etwas vor dem typischen Trainingsbeginn. */
export const PLAN_REMINDER_TIME: Record<'morgens' | 'mittags' | 'abends', { hour: number; minute: number }> = {
  morgens: { hour: 7, minute: 0 },
  mittags: { hour: 11, minute: 30 },
  abends: { hour: 17, minute: 30 },
};

export type PlanReminderInput = {
  enabled: boolean;
  /** Wochentage mit Einheit, 0 = Montag */
  planDays: readonly number[];
  time: 'morgens' | 'mittags' | 'abends';
  /** Ab hier gilt der Plan */
  startsAt: number;
  trainedToday: boolean;
  now: number;
};

/**
 * Nächste Plan-Erinnerung: am nächsten Plan-Tag zur gewählten Tageszeit, heute nur, wenn die Zeit noch
 * kommt und heute noch nicht trainiert wurde. null ohne Plan-Tage oder wenn ausgeschaltet.
 */
export function nextPlanReminderAt(input: PlanReminderInput): number | null {
  if (!input.enabled || input.planDays.length === 0) return null;
  const { hour, minute } = PLAN_REMINDER_TIME[input.time];
  const d = new Date(input.now);
  for (let offset = 0; offset <= 7; offset++) {
    const at = new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset, hour, minute).getTime();
    const weekday = (new Date(at).getDay() + 6) % 7;
    if (at <= input.now || at < input.startsAt || !input.planDays.includes(weekday)) continue;
    if (offset === 0 && input.trainedToday) continue;
    return at;
  }
  return null;
}

export type ScheduledReminder = { at: number; title: string; body: string };

/** Es ist immer höchstens eine Erinnerung geplant: die frühere von Plan- und Serien-Erinnerung. */
export function pickReminder(
  plan: ScheduledReminder | null,
  streak: ScheduledReminder | null,
): ScheduledReminder | null {
  if (!plan) return streak;
  if (!streak) return plan;
  return plan.at <= streak.at ? plan : streak;
}

/** Kam heute schon eine Plan-Erinnerung? Dann entfällt die Serien-Erinnerung am selben Tag. */
export function planReminderPassedToday(input: Omit<PlanReminderInput, 'enabled' | 'trainedToday'>): boolean {
  const { hour, minute } = PLAN_REMINDER_TIME[input.time];
  const d = new Date(input.now);
  const todayAt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute).getTime();
  const weekday = (d.getDay() + 6) % 7;
  return input.planDays.includes(weekday) && todayAt >= input.startsAt && input.now >= todayAt;
}

export const sameDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString();
