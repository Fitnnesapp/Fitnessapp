import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Challenge, JoinedChallenge } from '@/lib/logic/challenges';

type ChallengeState = {
  /** Beigetretene Challenges nach ID */
  joined: Record<string, JoinedChallenge>;
  /** Selbst erstellte Challenges (laufen ab dem Beitritt) */
  custom: Challenge[];
  hydrated: boolean;

  join: (id: string, joined: JoinedChallenge) => void;
  leave: (id: string) => void;
  /** Legt eine eigene Challenge an und tritt ihr sofort bei */
  addCustom: (challenge: Challenge, joined: JoinedChallenge) => void;
  /** Entfernt eine eigene Challenge samt Teilnahme */
  removeCustom: (id: string) => void;
  reset: () => void;
};

type PersistedChallenges = { joined: Record<string, JoinedChallenge>; custom: Challenge[] };

/** Version des gespeicherten Formats. Bei Änderungen hochzählen und in `migrate` umwandeln. */
const CHALLENGE_STORE_VERSION = 2;

/** Teilnahme an Challenges, nur lokal. Der Fortschritt wird immer aus dem Verlauf berechnet. */
export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set, get) => ({
      joined: {},
      custom: [],
      hydrated: false,

      join: (id, joined) => set({ joined: { ...get().joined, [id]: joined } }),
      leave: (id) => {
        const next = { ...get().joined };
        delete next[id];
        set({ joined: next });
      },
      addCustom: (challenge, joined) =>
        set({ custom: [...get().custom, challenge], joined: { ...get().joined, [challenge.id]: joined } }),
      removeCustom: (id) => {
        const next = { ...get().joined };
        delete next[id];
        set({ joined: next, custom: get().custom.filter((c) => c.id !== id) });
      },
      reset: () => set({ joined: {}, custom: [] }),
    }),
    {
      name: 'fitnessapp-challenges',
      version: CHALLENGE_STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ joined, custom }): PersistedChallenges => ({ joined, custom }),
      // Version 1 → 2: eigene Challenges (Liste kommt leer dazu, Teilnahmen bleiben erhalten)
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<PersistedChallenges>;
        return { joined: state.joined ?? {}, custom: Array.isArray(state.custom) ? state.custom : [] };
      },
      onRehydrateStorage: () => () => useChallengeStore.setState({ hydrated: true }),
    },
  ),
);

/** Challenge aus der App oder selbst erstellt. */
export function useChallengeById(id: string | undefined): Challenge | undefined {
  return useChallengeStore((state) => state.custom.find((c) => c.id === id));
}
