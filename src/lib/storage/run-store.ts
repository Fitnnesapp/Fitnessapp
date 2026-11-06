import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  activeElapsedAt,
  computeBests,
  elevationGain,
  evaluatePoint,
  idleBetween,
  isStandingStill,
  MAX_RIDE_SPEED_MS,
  MAX_SPEED_MS,
  toTrackPoint,
} from '@/lib/logic/run-stats';
import { createManualRun, type ManualRunInput } from '@/lib/logic/manual-run';
import type { ActiveRun, RawLocation, RunSession, Sport } from '@/types/running';

import { debouncedStorage, flushPendingWrites } from './debounced-storage';

/** Läufe kürzer als das (in Metern) werden beim Beenden nicht gespeichert. */
const MIN_SAVED_DISTANCE_M = 20;

type RunState = {
  active: ActiveRun | null;
  history: RunSession[];
  hydrated: boolean;

  startRun: (sport?: Sport, autoPause?: boolean) => void;
  pauseRun: () => void;
  resumeRun: () => void;
  /** Übernimmt neue GPS-Messungen in den laufenden Lauf. Im Status pausiert werden sie ignoriert. */
  addLocations: (locations: RawLocation[]) => void;
  /** Beendet den Lauf. Gibt die Id des gespeicherten Laufs zurück, oder null wenn er zu kurz war. */
  finishRun: () => Promise<string | null>;
  discardRun: () => void;
  deleteRun: (id: string) => void;
  /** Speichert einen ohne GPS nachgetragenen Lauf (vorher validateManualRun). */
  addManualRun: (input: ManualRunInput) => string;
  /** Korrigiert einen nachgetragenen Lauf; aufgezeichnete GPS-Läufe bleiben unverändert. */
  updateManualRun: (id: string, input: ManualRunInput) => void;
  reset: () => void;
};

/** Version des gespeicherten Formats. Bei Änderungen hochzählen und in `migrate` umwandeln. */
const RUN_STORE_VERSION = 2;

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** Läufe, lokal gespeichert. Der laufende Lauf übersteht dadurch App-Neustarts. */
export const useRunStore = create<RunState>()(
  persist(
    (set, get) => ({
      active: null,
      history: [],
      hydrated: false,

      startRun: (sport = 'run', autoPause = false) => {
        const now = Date.now();
        set({
          active: {
            sport,
            autoPause,
            idleMs: 0,
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
          // Standzeit ist in elapsedBase schon abgezogen, deshalb zurücksetzen
          active: { ...active, status: 'paused', elapsedBase: activeElapsedAt(active, now), runningSince: null, idleMs: 0 },
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
        let idleMs = active.idleMs ?? 0;

        for (const raw of [...locations].sort((a, b) => a.t - b.t)) {
          // Messungen aus der Zeit vor dem letzten Fortsetzen gehören nicht zur aktiven Zeit
          if (active.runningSince !== null && raw.t < active.runningSince) continue;

          const previous = points[points.length - 1];
          let point = toTrackPoint(raw, activeElapsedAt({ ...active, idleMs }, raw.t));
          const result = evaluatePoint(
            points[points.length - 1] ?? null,
            point,
            active.sport === 'ride' ? MAX_RIDE_SPEED_MS : MAX_SPEED_MS,
          );
          if (!result.accepted) continue;

          // Auto-Pause: Standzeit vor diesem Punkt abziehen und die aktive Zeit des Punkts neu berechnen
          if (active.autoPause && previous) {
            const idle = idleBetween(previous, point, result.stepM);
            if (idle > 0) {
              idleMs += idle;
              point = { ...point, e: Math.max(previous.e, activeElapsedAt({ ...active, idleMs }, raw.t)) };
            }
          }

          points.push(point);
          distanceM += result.stepM;
        }

        if (points.length !== active.points.length) set({ active: { ...active, points, distanceM, idleMs } });
      },

      finishRun: async () => {
        const { active, history } = get();
        if (!active) return null;

        const endedAt = Date.now();
        // Auto-Pause: wer nach dem Ziel noch steht, bevor er auf Beenden tippt, bekommt diese Zeit nicht angerechnet
        const last = active.points[active.points.length - 1];
        const countUntil = active.autoPause && last && isStandingStill(last.t, endedAt) ? last.t : endedAt;
        const durationSeconds = Math.round(activeElapsedAt(active, countUntil) / 1000);
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
            // Laufbestzeiten über 1, 5 und 10 km gelten nur für Läufe
            bests: active.sport === 'ride' ? { k1: null, k5: null, k10: null } : computeBests(active.points),
            points: active.points,
            ...(active.sport === 'ride' ? { sport: 'ride' as const } : {}),
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

      addManualRun: (input) => {
        const run = createManualRun(input, newId());
        set({ history: [...get().history, run] });
        void flushPendingWrites();
        return run.id;
      },

      updateManualRun: (id, input) => {
        set({
          history: get().history.map((run) => (run.id === id && run.manual ? createManualRun(input, id) : run)),
        });
        void flushPendingWrites();
      },

      reset: () => set({ active: null, history: [] }),
    }),
    {
      name: 'fitnessapp-runs',
      version: RUN_STORE_VERSION,
      storage: createJSONStorage(() => debouncedStorage),
      // 0 → 1: optionales Feld `manual` für nachgetragene Läufe
      // 1 → 2: optionales Feld `sport` (Lauf oder Rad); fehlt es, ist es ein Lauf. Bestehende Läufe bleiben unverändert
      migrate: (persisted) => persisted as Pick<RunState, 'active' | 'history'>,
      partialize: ({ active, history }) => ({ active, history }),
      onRehydrateStorage: () => () => useRunStore.setState({ hydrated: true }),
    },
  ),
);
