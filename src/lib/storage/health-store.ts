import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Limitation } from '@/lib/logic/plan';

/**
 * Gesundheitsangaben (Art. 9 DSGVO): nur mit ausdrücklicher, separater Einwilligung,
 * ausschließlich lokal, jederzeit widerrufbar. Beim Widerruf werden alle Angaben gelöscht.
 * Bewusst sparsam: nur, was der Plan wirklich nutzt (Alter, Beschwerden; das Gewicht liegt
 * für die Kalorienschätzung in den Einstellungen).
 */
type HealthState = {
  /** Zeitpunkt der Einwilligung, null = keine */
  consentAt: number | null;
  age: number | null;
  limitations: Limitation[];
  hydrated: boolean;

  giveConsent: (at: number) => void;
  setAge: (age: number | null) => void;
  setLimitations: (limitations: Limitation[]) => void;
  /** Widerruf: Einwilligung und alle Angaben löschen */
  revoke: () => void;
};

const HEALTH_STORE_VERSION = 1;

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      consentAt: null,
      age: null,
      limitations: [],
      hydrated: false,

      giveConsent: (at) => set({ consentAt: at }),
      // Ohne Einwilligung werden keine Angaben gespeichert
      setAge: (age) => (get().consentAt ? set({ age }) : undefined),
      setLimitations: (limitations) => (get().consentAt ? set({ limitations }) : undefined),
      revoke: () => set({ consentAt: null, age: null, limitations: [] }),
    }),
    {
      name: 'fitnessapp-health',
      version: HEALTH_STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ consentAt, age, limitations }) => ({ consentAt, age, limitations }),
      // Version 1 ist die erste Fassung, ältere Stände gibt es nicht
      migrate: (persisted) => persisted as { consentAt: number | null; age: number | null; limitations: Limitation[] },
      onRehydrateStorage: () => () => useHealthStore.setState({ hydrated: true }),
    },
  ),
);
