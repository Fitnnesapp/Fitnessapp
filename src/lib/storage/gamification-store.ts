import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { BadgeKey } from '@/lib/logic/badges';

type GamificationState = {
  /** Vergebene Abzeichen mit Zeitpunkt. Ein Abzeichen steht hier höchstens einmal. */
  earned: Record<string, number>;
  /** Neu vergebene Abzeichen, die der Nutzer noch nicht gesehen hat */
  unseen: BadgeKey[];
  hydrated: boolean;

  award: (keys: BadgeKey[]) => void;
  markSeen: () => void;
  reset: () => void;
};

export const useGamification = create<GamificationState>()(
  persist(
    (set, get) => ({
      earned: {},
      unseen: [],
      hydrated: false,

      award: (keys) => {
        const { earned, unseen } = get();
        const fresh = keys.filter((key) => !(key in earned));
        if (fresh.length === 0) return;

        const now = Date.now();
        set({
          earned: { ...earned, ...Object.fromEntries(fresh.map((key) => [key, now])) },
          unseen: [...unseen, ...fresh],
        });
      },

      markSeen: () => set({ unseen: [] }),

      reset: () => set({ earned: {}, unseen: [] }),
    }),
    {
      name: 'fitnessapp-gamification',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ earned, unseen }) => ({ earned, unseen }),
      onRehydrateStorage: () => () => useGamification.setState({ hydrated: true }),
    },
  ),
);
