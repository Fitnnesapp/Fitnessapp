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
