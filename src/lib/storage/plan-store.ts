import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { TrainingPlan } from '@/lib/logic/plan';

type PlanState = {
  plan: TrainingPlan | null;
  /** Der Einstieg wurde gezeigt (Plan erstellt oder bewusst übersprungen) */
  onboardingDone: boolean;
  hydrated: boolean;

  setPlan: (plan: TrainingPlan) => void;
  skipOnboarding: () => void;
  reset: () => void;
};

/** Version des gespeicherten Formats. Bei Änderungen hochzählen und in `migrate` umwandeln. */
const PLAN_STORE_VERSION = 1;

/** Persönlicher Trainingsplan, ausschließlich lokal gespeichert. */
export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      plan: null,
      onboardingDone: false,
      hydrated: false,

      setPlan: (plan) => set({ plan, onboardingDone: true }),
      skipOnboarding: () => set({ onboardingDone: true }),
      reset: () => set({ plan: null, onboardingDone: false }),
    }),
    {
      name: 'fitnessapp-plan',
      version: PLAN_STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ plan, onboardingDone }) => ({ plan, onboardingDone }),
      // Version 1 ist die erste Fassung, ältere Stände gibt es nicht
      migrate: (persisted) => persisted as { plan: TrainingPlan | null; onboardingDone: boolean },
      onRehydrateStorage: () => () => usePlanStore.setState({ hydrated: true }),
    },
  ),
);
