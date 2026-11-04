import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Kennung der aktuellen "Neu in der App"-Karte. Bei neuen Funktionen hochzählen, dann erscheint sie erneut. */
export const CURRENT_NEWS = '2026-11';

type NewsState = {
  /** Zuletzt weggeklickte Ausgabe, null = noch keine */
  seen: string | null;
  hydrated: boolean;
  markSeen: () => void;
  reset: () => void;
};

/** Version des gespeicherten Formats. Bei Änderungen hochzählen und in `migrate` umwandeln. */
const NEWS_STORE_VERSION = 1;

/** Merkt sich, welche "Neu"-Karte schon gesehen wurde. Nur lokal. */
export const useNewsStore = create<NewsState>()(
  persist(
    (set) => ({
      seen: null,
      hydrated: false,
      markSeen: () => set({ seen: CURRENT_NEWS }),
      reset: () => set({ seen: null }),
    }),
    {
      name: 'fitnessapp-news',
      version: NEWS_STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ seen }) => ({ seen }),
      // Version 1 ist die erste Fassung, ältere Stände gibt es nicht
      migrate: (persisted) => persisted as { seen: string | null },
      onRehydrateStorage: () => () => useNewsStore.setState({ hydrated: true }),
    },
  ),
);
