import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { HomeSession } from '@/types/home';

type HomeState = {
  sessions: HomeSession[];
  hydrated: boolean;

  addSession: (session: HomeSession) => void;
  setEffort: (id: string, effort: number | null) => void;
  deleteSession: (id: string) => void;
  reset: () => void;
};

/** Abgeschlossene Home-Workouts, lokal gespeichert. */
export const useHomeSessions = create<HomeState>()(
  persist(
    (set, get) => ({
      sessions: [],
      hydrated: false,

      addSession: (session) => set({ sessions: [...get().sessions, session] }),

      setEffort: (id, effort) =>
        set({ sessions: get().sessions.map((s) => (s.id === id ? { ...s, effort } : s)) }),

      deleteSession: (id) => set({ sessions: get().sessions.filter((s) => s.id !== id) }),

      reset: () => set({ sessions: [] }),
    }),
    {
      name: 'fitnessapp-home',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ sessions }) => ({ sessions }),
      onRehydrateStorage: () => () => useHomeSessions.setState({ hydrated: true }),
    },
  ),
);
