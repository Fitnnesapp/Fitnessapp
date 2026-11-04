import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type UnitsPreference = 'metric' | 'imperial';
/** Darstellung: dem System folgen oder fest hell/dunkel */
export type Appearance = 'system' | 'light' | 'dark';

type SettingsState = {
  displayName: string;
  units: UnitsPreference;
  /** Körpergewicht in kg für die Kalorienschätzung, null = Standardwert */
  bodyWeightKg: number | null;
  /** Erinnerung bei drohendem Serienverlust */
  streakReminder: boolean;
  appearance: Appearance;
  /** true, sobald der Speicher vom Gerät geladen wurde */
  hydrated: boolean;
  setDisplayName: (name: string) => void;
  setUnits: (units: UnitsPreference) => void;
  setBodyWeightKg: (kg: number | null) => void;
  setStreakReminder: (enabled: boolean) => void;
  setAppearance: (appearance: Appearance) => void;
  reset: () => void;
};

const DEFAULTS = {
  displayName: '',
  units: 'metric' as UnitsPreference,
  bodyWeightKg: null as number | null,
  streakReminder: false,
  appearance: 'system' as Appearance,
};

type PersistedSettings = Pick<SettingsState, 'displayName' | 'units' | 'bodyWeightKg' | 'streakReminder' | 'appearance'>;

/** Version des gespeicherten Formats. Bei Änderungen hochzählen und in `migrate` umwandeln. */
const SETTINGS_STORE_VERSION = 1;

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
      setAppearance: (appearance) => set({ appearance }),
      reset: () => set(DEFAULTS),
    }),
    {
      name: 'fitnessapp-settings',
      version: SETTINGS_STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ displayName, units, bodyWeightKg, streakReminder, appearance }): PersistedSettings => ({
        displayName,
        units,
        bodyWeightKg,
        streakReminder,
        appearance,
      }),
      // Version 0 → 1: neue Einstellung "Darstellung", bestehende Werte bleiben, Standard folgt dem System
      migrate: (persisted) => ({ ...DEFAULTS, ...(persisted as Partial<PersistedSettings>) }),
      onRehydrateStorage: () => () => useSettings.setState({ hydrated: true }),
    },
  ),
);
