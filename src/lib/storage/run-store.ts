import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  activeElapsedAt,
  computeBests,
  elevationGain,
  evaluatePoint,
  toTrackPoint,
} from '@/lib/logic/run-stats';
import type { ActiveRun, RawLocation, RunSession } from '@/types/running';

import { debouncedStorage, flushPendingWrites } from './debounced-storage';

/** Läufe kürzer als das (in Metern) werden beim Beenden nicht gespeichert. */
const MIN_SAVED_DISTANCE_M = 20;

type RunState = {
  active: ActiveRun | null;
  history: RunSession[];
  hydrated: boolean;

  startRun: () => void;
  pauseRun: () => void;
  resumeRun: () => void;
  /** Übernimmt neue GPS-Messungen in den laufenden Lauf. Im Status pausiert werden sie ignoriert. */
  addLocations: (locations: RawLocation[]) => void;
  /** Beendet den Lauf. Gibt die Id des gespeicherten Laufs zurück, oder null wenn er zu kurz war. */
  finishRun: () => Promise<string | null>;
  discardRun: () => void;
  deleteRun: (id: string) => void;
  reset: () => void;
};

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** Läufe, lokal gespeichert. Der laufende Lauf übersteht dadurch App-Neustarts. */
export const useRunStore = create<RunState>()(
  persist(
    (set, get) => ({
      active: null,
      history: [],
      hydrated: false,

      startRun: () => {
        const now = Date.now();
        set({
          active: {
            id: newId(),
            startedAt: now,
            status: 'running',
            elapsedBase: 0,
            runningSince: now,
            points: [],
            distanceM: 0,
          },
        });
      },

      pauseRun: () => {
        const { active } = get();
        if (!active || active.status !== 'running') return;
        const now = Date.now();
        set({
          active: { ...active, status: 'paused', elapsedBase: activeElapsedAt(active, now), runningSince: null },
        });
      },

      resumeRun: () => {
        const { active } = get();
        if (!active || active.status !== 'paused') return;
        set({ active: { ...active, status: 'running', runningSince: Date.now() } });
      },

      addLocations: (locations) => {
        const { active } = get();
        if (!active || active.status !== 'running') return;

        const points = [...active.points];
        let distanceM = active.distanceM;

        for (const raw of [...locations].sort((a, b) => a.t - b.t)) {
          // Messungen aus der Zeit vor dem letzten Fortsetzen gehören nicht zur aktiven Zeit
          if (active.runningSince !== null && raw.t < active.runningSince) continue;

          const point = toTrackPoint(raw, activeElapsedAt(active, raw.t));
          const result = evaluatePoint(points[points.length - 1] ?? null, point);
          if (!result.accepted) continue;

          points.push(point);
          distanceM += result.stepM;
        }

        if (points.length !== active.points.length) set({ active: { ...active, points, distanceM } });
      },

      finishRun: async () => {
        const { active, history } = get();
        if (!active) return null;

        const endedAt = Date.now();
        const durationSeconds = Math.round(activeElapsedAt(active, endedAt) / 1000);
        const saved = active.distanceM >= MIN_SAVED_DISTANCE_M;

        if (saved) {
          const session: RunSession = {
            id: active.id,
            type: 'running',
            startedAt: active.startedAt,
            endedAt,
            distanceM: Math.round(active.distanceM),
            durationSeconds,
            elevationGainM: elevationGain(active.points),
            bests: computeBests(active.points),
            points: active.points,
          };
          set({ active: null, history: [...history, session] });
        } else {
          set({ active: null });
        }

        // Ergebnis sofort auf das Gerät schreiben, nicht erst nach der Pufferzeit
        await flushPendingWrites();
        return saved ? active.id : null;
      },

      discardRun: () => {
        set({ active: null });
        void flushPendingWrites();
      },

      deleteRun: (id) => set({ history: get().history.filter((run) => run.id !== id) }),

      reset: () => set({ active: null, history: [] }),
    }),
    {
      name: 'fitnessapp-runs',
      storage: createJSONStorage(() => debouncedStorage),
      partialize: ({ active, history }) => ({ active, history }),
      onRehydrateStorage: () => () => useRunStore.setState({ hydrated: true }),
    },
  ),
);
