import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type UnitsPreference = 'metric' | 'imperial';

type SettingsState = {
  displayName: string;
  units: UnitsPreference;
  /** Körpergewicht in kg für die Kalorienschätzung, null = Standardwert */
  bodyWeightKg: number | null;
  /** Erinnerung bei drohendem Serienverlust */
  streakReminder: boolean;
  /** true, sobald der Speicher vom Gerät geladen wurde */
  hydrated: boolean;
  setDisplayName: (name: string) => void;
  setUnits: (units: UnitsPreference) => void;
  setBodyWeightKg: (kg: number | null) => void;
  setStreakReminder: (enabled: boolean) => void;
  reset: () => void;
};

const DEFAULTS = { displayName: '', units: 'metric' as UnitsPreference, bodyWeightKg: null as number | null, streakReminder: false };

/** Alle Einstellungen liegen ausschließlich lokal auf dem Gerät, es gibt keine Netzwerkzugriffe. */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      hydrated: false,
      setDisplayName: (displayName) => set({ displayName }),
      setUnits: (units) => set({ units }),
      setBodyWeightKg: (bodyWeightKg) => set({ bodyWeightKg }),
      setStreakReminder: (streakReminder) => set({ streakReminder }),
      reset: () => set(DEFAULTS),
    }),
    {
      name: 'fitnessapp-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ displayName, units, bodyWeightKg, streakReminder }) => ({
        displayName,
        units,
        bodyWeightKg,
        streakReminder,
      }),
      onRehydrateStorage: () => () => useSettings.setState({ hydrated: true }),
    },
  ),
);
