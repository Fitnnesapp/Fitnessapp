import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type UnitsPreference = 'metric' | 'imperial';

type SettingsState = {
  displayName: string;
  units: UnitsPreference;
  /** true, sobald der Speicher vom Gerät geladen wurde */
  hydrated: boolean;
  setDisplayName: (name: string) => void;
  setUnits: (units: UnitsPreference) => void;
  reset: () => void;
};

const DEFAULTS = { displayName: '', units: 'metric' as UnitsPreference };

/** Alle Einstellungen liegen ausschließlich lokal auf dem Gerät, es gibt keine Netzwerkzugriffe. */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      hydrated: false,
      setDisplayName: (displayName) => set({ displayName }),
      setUnits: (units) => set({ units }),
      reset: () => set(DEFAULTS),
    }),
    {
      name: 'fitnessapp-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ displayName, units }) => ({ displayName, units }),
      onRehydrateStorage: () => () => useSettings.setState({ hydrated: true }),
    },
  ),
);
