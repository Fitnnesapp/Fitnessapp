import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { StrengthGoal } from '@/lib/logic/goals';

type GoalsState = {
  goals: StrengthGoal[];
  hydrated: boolean;

  /** Legt ein Ziel an; ein bestehendes Ziel für dieselbe Übung wird ersetzt. */
  setGoal: (exerciseId: string, targetKg: number, startKg: number) => void;
  removeGoal: (exerciseId: string) => void;
  reset: () => void;
};

/** Version des gespeicherten Formats. Bei Änderungen hochzählen und in `migrate` umwandeln. */
const GOALS_STORE_VERSION = 1;

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** Persönliche Kraftziele, nur lokal. Der Fortschritt wird immer aus dem Verlauf berechnet. */
export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: [],
      hydrated: false,

      setGoal: (exerciseId, targetKg, startKg) =>
        set({
          goals: [
            ...get().goals.filter((goal) => goal.exerciseId !== exerciseId),
            { id: newId(), exerciseId, targetKg, startKg, createdAt: Date.now() },
          ],
        }),
      removeGoal: (exerciseId) => set({ goals: get().goals.filter((goal) => goal.exerciseId !== exerciseId) }),
      reset: () => set({ goals: [] }),
    }),
    {
      name: 'fitnessapp-goals',
      version: GOALS_STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ goals }) => ({ goals }),
      // Version 1 ist die erste Fassung, ältere Stände gibt es nicht
      migrate: (persisted) => persisted as { goals: StrengthGoal[] },
      onRehydrateStorage: () => () => useGoalsStore.setState({ hydrated: true }),
    },
  ),
);
