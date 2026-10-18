import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

const DELAY_MS = 2000;

const pending = new Map<string, string>();
let timer: ReturnType<typeof setTimeout> | null = null;

/** Schreibt alle ausstehenden Werte sofort. Wird beim Beenden eines Laufs und beim Verlassen der App aufgerufen. */
export async function flushPendingWrites(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  const entries = [...pending.entries()];
  pending.clear();
  await Promise.all(entries.map(([key, value]) => AsyncStorage.setItem(key, value)));
}

AppState.addEventListener('change', (state) => {
  if (state !== 'active') void flushPendingWrites();
});

/**
 * AsyncStorage mit Zwischenpuffer. Beim Lauftracking kommen alle paar Sekunden neue GPS-Punkte;
 * den ganzen Lauf bei jedem Punkt neu zu schreiben wäre bei tausenden Punkten zu teuer.
 */
export const debouncedStorage = {
  getItem: async (key: string): Promise<string | null> => pending.get(key) ?? AsyncStorage.getItem(key),

  setItem: async (key: string, value: string): Promise<void> => {
    pending.set(key, value);
    if (!timer) timer = setTimeout(() => void flushPendingWrites(), DELAY_MS);
  },

  removeItem: async (key: string): Promise<void> => {
    pending.delete(key);
    await AsyncStorage.removeItem(key);
  },
};
