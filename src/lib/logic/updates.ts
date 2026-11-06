/** Wie oft die App höchstens nach einer neuen Version fragt, wenn sie wieder in den Vordergrund kommt. */
export const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;

export function shouldCheckForUpdate(lastCheckAt: number | null, now: number): boolean {
  return lastCheckAt === null || now - lastCheckAt >= UPDATE_CHECK_INTERVAL_MS || now < lastCheckAt;
}

export type UpdatePhase = 'idle' | 'checking' | 'downloading' | 'ready' | 'current' | 'error';

/** Kurzer Statustext für das Profil. */
export function updateStatusText(phase: UpdatePhase): string {
  switch (phase) {
    case 'checking':
      return 'Suche nach Updates …';
    case 'downloading':
      return 'Neue Version wird geladen …';
    case 'ready':
      return 'Neue Version bereit. Sie startet beim nächsten Öffnen oder sofort per Neustart.';
    case 'current':
      return 'Du hast die neueste Version.';
    case 'error':
      return 'Gerade keine Verbindung. Die App prüft später automatisch erneut.';
    default:
      return 'Updates kommen automatisch, sobald die App online ist.';
  }
}
