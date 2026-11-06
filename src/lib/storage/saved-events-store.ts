import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type SavedEventsState = {
  /** Gemerkte Events nach ID mit Zeitpunkt des Merkens */
  saved: Record<string, number>;
  hydrated: boolean;
  toggle: (eventId: string) => void;
  reset: () => void;
};

/** Version des gespeicherten Formats. Bei Änderungen hochzählen und in `migrate` umwandeln. */
const SAVED_EVENTS_STORE_VERSION = 1;

/** Events, auf die du hintrainierst. Nur lokal, es wird nichts an Veranstalter gesendet. */
export const useSavedEvents = create<SavedEventsState>()(
  persist(
    (set, get) => ({
      saved: {},
      hydrated: false,
      toggle: (eventId) => {
        const next = { ...get().saved };
        if (next[eventId]) delete next[eventId];
        else next[eventId] = Date.now();
        set({ saved: next });
      },
      reset: () => set({ saved: {} }),
    }),
    {
      name: 'fitnessapp-saved-events',
      version: SAVED_EVENTS_STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ saved }) => ({ saved }),
      // Version 1 ist die erste Fassung, ältere Stände gibt es nicht
      migrate: (persisted) => persisted as { saved: Record<string, number> },
      onRehydrateStorage: () => () => useSavedEvents.setState({ hydrated: true }),
    },
  ),
);
