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
  /** Wochenziel in Trainingstagen, wenn kein Plan aktiv ist */
  weeklyGoalDays: number;
  /** true, sobald der Speicher vom Gerät geladen wurde */
  hydrated: boolean;
  setDisplayName: (name: string) => void;
  setUnits: (units: UnitsPreference) => void;
  setBodyWeightKg: (kg: number | null) => void;
  setStreakReminder: (enabled: boolean) => void;
  setAppearance: (appearance: Appearance) => void;
  setWeeklyGoalDays: (days: number) => void;
  reset: () => void;
};

const DEFAULTS = {
  displayName: '',
  units: 'metric' as UnitsPreference,
  bodyWeightKg: null as number | null,
  streakReminder: false,
  appearance: 'system' as Appearance,
  weeklyGoalDays: 3,
};

type PersistedSettings = Pick<
  SettingsState,
  'displayName' | 'units' | 'bodyWeightKg' | 'streakReminder' | 'appearance' | 'weeklyGoalDays'
>;

/** Version des gespeicherten Formats. Bei Änderungen hochzählen und in `migrate` umwandeln. */
const SETTINGS_STORE_VERSION = 2;

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
      setWeeklyGoalDays: (days) => set({ weeklyGoalDays: Math.min(7, Math.max(1, Math.round(days))) }),
      reset: () => set(DEFAULTS),
    }),
    {
      name: 'fitnessapp-settings',
      version: SETTINGS_STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ displayName, units, bodyWeightKg, streakReminder, appearance, weeklyGoalDays }): PersistedSettings => ({
        displayName,
        units,
        bodyWeightKg,
        streakReminder,
        appearance,
        weeklyGoalDays,
      }),
      // Version 0 → 1: neue Einstellung "Darstellung" (Standard: System)
      // Version 1 → 2: Wochenziel ohne Plan (Standard: 3 Tage). Bestehende Werte bleiben jeweils erhalten.
      migrate: (persisted) => ({ ...DEFAULTS, ...(persisted as Partial<PersistedSettings>) }),
      onRehydrateStorage: () => () => useSettings.setState({ hydrated: true }),
    },
  ),
);
