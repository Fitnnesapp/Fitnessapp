/**
 * "Dein Warum": ein selbst formulierter Grund fürs Training. Selbstbestimmte Gründe tragen länger
 * als äußere Ziele (Sheldon & Elliot 1999; Selbstbestimmungstheorie, Ryan & Deci 2000).
 */
export const WHY_MAX_LENGTH = 140;

/** Vorschläge als Anstoß; jeder lässt sich frei umschreiben. */
export const WHY_SUGGESTIONS = [
  'Mit 70 noch die Treppen hochrennen',
  'Mehr Energie im Alltag',
  'Mit meinen Kindern mithalten',
  'Den Kopf frei bekommen',
  'Stärker sein als letztes Jahr',
  'Meinen ersten Halbmarathon laufen',
] as const;

export function cleanWhy(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, WHY_MAX_LENGTH);
}

/**
 * Wann das Warum auf dem Start-Bildschirm erscheint: wenn es hilft, also nach einer Pause
 * (3 oder mehr Tage ohne Einheit) oder am Wochenanfang. Sonst bleibt der Start ruhig.
 */
export function shouldShowWhy(why: string, daysSinceLastActivity: number | null, weekday: number): boolean {
  if (!why) return false;
  if (daysSinceLastActivity === null) return true;
  return daysSinceLastActivity >= 3 || weekday === 1;
}
