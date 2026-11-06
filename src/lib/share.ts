import { Platform, Share } from 'react-native';

/** Teilen ist auf dem Handy immer möglich, im Browser nur, wenn er das Teilen-Menü anbietet. */
export function canShare(): boolean {
  if (Platform.OS !== 'web') return true;
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/** Öffnet das Teilen-Menü des Systems mit einem Text. Abbrechen ist kein Fehler. */
export async function shareText(message: string): Promise<void> {
  try {
    await Share.share({ message });
  } catch {
    // Abgebrochen oder nicht verfügbar: nichts zu tun
  }
}
