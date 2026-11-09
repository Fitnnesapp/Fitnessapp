import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { migratePlanV1, migratePlanV2, type TrainingPlan } from '@/lib/logic/plan';

type PlanState = {
  plan: TrainingPlan | null;
  /** Der Einstieg wurde gezeigt (Plan erstellt oder bewusst übersprungen) */
  onboardingDone: boolean;
  hydrated: boolean;

  setPlan: (plan: TrainingPlan) => void;
  skipOnboarding: () => void;
  /** Beendet den aktuellen Plan, der Einstieg erscheint nicht erneut */
  clearPlan: () => void;
  reset: () => void;
};

/** Version des gespeicherten Formats. Bei Änderungen hochzählen und in `migrate` umwandeln. */
const PLAN_STORE_VERSION = 3;

/** Persönlicher Trainingsplan, ausschließlich lokal gespeichert. */
export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      plan: null,
      onboardingDone: false,
      hydrated: false,

      setPlan: (plan) => set({ plan, onboardingDone: true }),
      skipOnboarding: () => set({ onboardingDone: true }),
      clearPlan: () => set({ plan: null, onboardingDone: true }),
      reset: () => set({ plan: null, onboardingDone: false }),
    }),
    {
      name: 'fitnessapp-plan',
      version: PLAN_STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ plan, onboardingDone }) => ({ plan, onboardingDone }),
      migrate: (persisted, version) => {
        const state = persisted as { plan: unknown; onboardingDone: boolean };
        // Version 1 → 2: ein Ziel und ein Ort wurden zu Listen, Einheiten haben eine ID
        let plan = state.plan as TrainingPlan | null;
        if (version < 2 && state.plan) plan = migratePlanV1(state.plan as Parameters<typeof migratePlanV1>[0]);
        // Version 2 → 3: Ausdauer-Art (Laufen, Rad, beides); bestehende Pläne bleiben beim Laufen
        if (version < 3 && plan) plan = migratePlanV2(plan);
        return { ...state, plan };
      },
      onRehydrateStorage: () => () => usePlanStore.setState({ hydrated: true }),
    },
  ),
);
