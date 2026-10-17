const KNOWN_MESSAGES: [pattern: RegExp, text: string][] = [
  [/invalid login credentials/i, 'E-Mail oder Passwort ist falsch.'],
  [/email not confirmed/i, 'Bitte bestätige zuerst deine E-Mail-Adresse über den Link in der Bestätigungsmail.'],
  [/user already registered/i, 'Mit dieser E-Mail gibt es bereits ein Konto.'],
  [/password should be at least/i, 'Das Passwort ist zu kurz.'],
  [/rate limit|too many requests/i, 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.'],
  [/network request failed|failed to fetch/i, 'Keine Verbindung zum Server. Prüfe deine Internetverbindung.'],
  [/provider is not enabled|unsupported provider/i, 'Diese Anmeldeart ist im Supabase-Projekt noch nicht aktiviert.'],
];

export function authErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const known = KNOWN_MESSAGES.find(([pattern]) => pattern.test(raw));
  return known ? known[1] : 'Das hat nicht geklappt. Bitte versuche es erneut.';
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export const MIN_PASSWORD_LENGTH = 8;
