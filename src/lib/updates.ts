import * as Updates from 'expo-updates';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { shouldCheckForUpdate, type UpdatePhase } from '@/lib/logic/updates';

type UpdateState = { phase: UpdatePhase; lastCheckAt: number | null };

/** Laufzeit-Zustand der Update-Prüfung (nicht gespeichert). */
export const useUpdateStore = create<UpdateState>()(() => ({ phase: 'idle', lastCheckAt: null }));

/** Updates sind nur in installierten Builds mit konfiguriertem Update-Server aktiv, nie im Browser oder in der Entwicklung. */
export const updatesActive = Platform.OS !== 'web' && Updates.isEnabled && !__DEV__;

/**
 * Prüft auf eine neue Version und lädt sie im Hintergrund. Sie wird beim nächsten Kaltstart
 * automatisch aktiv; "Jetzt neu starten" aktiviert sie sofort.
 */
export async function checkForAppUpdate(force = false): Promise<void> {
  if (!updatesActive) return;
  const { phase, lastCheckAt } = useUpdateStore.getState();
  const now = Date.now();
  if (phase === 'checking' || phase === 'downloading' || phase === 'ready') return;
  if (!force && !shouldCheckForUpdate(lastCheckAt, now)) return;

  useUpdateStore.setState({ phase: 'checking', lastCheckAt: now });
  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) {
      useUpdateStore.setState({ phase: 'current' });
      return;
    }
    useUpdateStore.setState({ phase: 'downloading' });
    const fetched = await Updates.fetchUpdateAsync();
    useUpdateStore.setState({ phase: fetched.isNew ? 'ready' : 'current' });
  } catch {
    useUpdateStore.setState({ phase: 'error' });
  }
}

export async function applyAppUpdate(): Promise<void> {
  if (!updatesActive) return;
  await Updates.reloadAsync();
}

/** Kurze Versionsangabe fürs Profil, z.B. "1.0.0 · Update vom 06.11.". */
export function updateIdentity(): { createdAt: Date | null; channel: string | null } {
  return { createdAt: Updates.isEmbeddedLaunch ? null : Updates.createdAt, channel: Updates.channel };
}
