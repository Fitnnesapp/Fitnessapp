import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Apple-Health-Anbindung: ein-/ausgeschaltet und welche Einheiten schon übertragen wurden.
 * Gerätebezogen, deshalb nicht in der Datensicherung (auf einem neuen iPhone kommt Health über iCloud mit).
 */
type HealthSyncState = {
  /** Zeitpunkt des Verbindens; nur Einheiten ab hier werden übertragen. null = aus */
  connectedAt: number | null;
  /** Bereits übertragene Einheiten (ID → Zeitpunkt), verhindert Duplikate */
  exported: Record<string, number>;
  lastSyncAt: number | null;
  lastError: string | null;
  hydrated: boolean;

  connect: (at: number, includeLastDays?: number) => void;
  disconnect: () => void;
  markExported: (id: string, at: number) => void;
  setError: (message: string | null) => void;
  reset: () => void;
};

const HEALTH_SYNC_STORE_VERSION = 1;

export const useHealthSync = create<HealthSyncState>()(
  persist(
    (set, get) => ({
      connectedAt: null,
      exported: {},
      lastSyncAt: null,
      lastError: null,
      hydrated: false,

      // Beim Verbinden auf Wunsch die letzten Tage mitnehmen, aber nicht den ganzen Verlauf
      connect: (at, includeLastDays = 0) =>
        set({ connectedAt: at - includeLastDays * 24 * 60 * 60 * 1000, lastError: null }),
      disconnect: () => set({ connectedAt: null, lastError: null }),
      markExported: (id, at) => set({ exported: { ...get().exported, [id]: at }, lastSyncAt: at, lastError: null }),
      setError: (message) => set({ lastError: message }),
      reset: () => set({ connectedAt: null, exported: {}, lastSyncAt: null, lastError: null }),
    }),
    {
      name: 'fitnessapp-health-sync',
      version: HEALTH_SYNC_STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ connectedAt, exported, lastSyncAt }) => ({ connectedAt, exported, lastSyncAt }),
      // Version 1 ist die erste Fassung
      migrate: (persisted) => persisted as Pick<HealthSyncState, 'connectedAt' | 'exported' | 'lastSyncAt'>,
      onRehydrateStorage: () => () => useHealthSync.setState({ hydrated: true }),
    },
  ),
);
