import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import bundled from '@/data/events.json';
import { parseEvents, type FitnessEvent } from '@/lib/logic/events';

/**
 * Einzige Netzwerkverbindung der App (vom Projekt ausdrücklich so entschieden):
 * die öffentliche Event-Liste aus dem GitHub-Repo, nur lesend.
 * Es werden keine Daten über den Nutzer gesendet. Ohne Internet gilt die zuletzt geladene
 * Fassung, beim allerersten Start die mit der App ausgelieferte.
 */
export const EVENTS_FEED_URL = 'https://raw.githubusercontent.com/Fitnnesapp/fitnessapp/main/src/data/events.json';

/** Höchstens alle 12 Stunden neu laden */
const REFRESH_AFTER_MS = 12 * 60 * 60 * 1000;
const TIMEOUT_MS = 8000;

const BUNDLED: FitnessEvent[] = parseEvents(bundled) ?? [];

type EventsState = {
  /** Zuletzt erfolgreich geladene Liste, null = noch nie geladen */
  cached: FitnessEvent[] | null;
  fetchedAt: number | null;
  loading: boolean;
  hydrated: boolean;

  /** Lädt die Liste neu, wenn sie älter als 12 Stunden ist (oder `force`). Fehler werden still ignoriert. */
  refresh: (force?: boolean) => Promise<void>;
};

const EVENTS_STORE_VERSION = 1;

export const useEventsStore = create<EventsState>()(
  persist(
    (set, get) => ({
      cached: null,
      fetchedAt: null,
      loading: false,
      hydrated: false,

      refresh: async (force = false) => {
        const { fetchedAt, loading } = get();
        if (loading) return;
        if (!force && fetchedAt !== null && Date.now() - fetchedAt < REFRESH_AFTER_MS) return;

        set({ loading: true });
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
          const response = await fetch(EVENTS_FEED_URL, { signal: controller.signal, headers: { Accept: 'application/json' } });
          if (!response.ok) return;
          const parsed = parseEvents(await response.json());
          if (parsed) set({ cached: parsed, fetchedAt: Date.now() });
        } catch {
          // Offline oder Server nicht erreichbar: die vorhandene Liste bleibt
        } finally {
          clearTimeout(timer);
          set({ loading: false });
        }
      },
    }),
    {
      name: 'fitnessapp-events',
      version: EVENTS_STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ cached, fetchedAt }) => ({ cached, fetchedAt }),
      // Version 1 ist die erste Fassung, ältere Stände gibt es nicht
      migrate: (persisted) => persisted as { cached: FitnessEvent[] | null; fetchedAt: number | null },
      onRehydrateStorage: () => () => useEventsStore.setState({ hydrated: true }),
    },
  ),
);

/** Die beste verfügbare Liste: geladen, sonst die mitgelieferte. */
export function useEvents(): FitnessEvent[] {
  return useEventsStore((state) => state.cached) ?? BUNDLED;
}
