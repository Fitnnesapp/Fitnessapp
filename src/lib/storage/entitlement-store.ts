import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { NO_ENTITLEMENT, type Entitlement } from '@/lib/logic/entitlements';

type EntitlementState = {
  entitlement: Entitlement;
  hydrated: boolean;
  set: (entitlement: Entitlement) => void;
  reset: () => void;
};

/** Lokal zwischengespeicherter Abo-Stand. So bleibt Premium auch ohne Internet freigeschaltet. */
export const useEntitlementStore = create<EntitlementState>()(
  persist(
    (set) => ({
      entitlement: NO_ENTITLEMENT,
      hydrated: false,
      set: (entitlement) => set({ entitlement }),
      reset: () => set({ entitlement: NO_ENTITLEMENT }),
    }),
    {
      name: 'fitnessapp-entitlement',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ entitlement }) => ({ entitlement }),
      onRehydrateStorage: () => () => useEntitlementStore.setState({ hydrated: true }),
    },
  ),
);
