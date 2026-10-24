import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { JoinedChallenge } from '@/lib/logic/challenges';

type ChallengeState = {
  /** Beigetretene Challenges nach ID */
  joined: Record<string, JoinedChallenge>;
  hydrated: boolean;

  join: (id: string, joined: JoinedChallenge) => void;
  leave: (id: string) => void;
  reset: () => void;
};

/** Version des gespeicherten Formats. Bei Änderungen hochzählen und in `migrate` umwandeln. */
const CHALLENGE_STORE_VERSION = 1;

/** Teilnahme an Challenges, nur lokal. Der Fortschritt wird immer aus dem Verlauf berechnet. */
export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set, get) => ({
      joined: {},
      hydrated: false,

      join: (id, joined) => set({ joined: { ...get().joined, [id]: joined } }),
      leave: (id) => {
        const next = { ...get().joined };
        delete next[id];
        set({ joined: next });
      },
      reset: () => set({ joined: {} }),
    }),
    {
      name: 'fitnessapp-challenges',
      version: CHALLENGE_STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ joined }) => ({ joined }),
      // Version 1 ist die erste Fassung, ältere Stände gibt es nicht
      migrate: (persisted) => persisted as { joined: Record<string, JoinedChallenge> },
      onRehydrateStorage: () => () => useChallengeStore.setState({ hydrated: true }),
    },
  ),
);
