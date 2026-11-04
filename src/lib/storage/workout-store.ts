import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { finalizeDraft } from '@/lib/logic/draft';
import { draftFromWorkout } from '@/lib/logic/repeat';
import { targetReps } from '@/lib/logic/routines';
import { kgToDisplay, type Units } from '@/lib/logic/units';
import { lastWorkingSet } from '@/lib/logic/workout-stats';
import type { ActiveWorkout, DraftSet, StrengthWorkout, WorkoutTemplate } from '@/types/workout';

import { useSettings } from './settings-store';

type WorkoutState = {
  /** Laufendes Workout. Wird bei jeder Änderung gespeichert, übersteht also Neustarts. */
  active: ActiveWorkout | null;
  history: StrengthWorkout[];
  templates: WorkoutTemplate[];
  hydrated: boolean;

  startWorkout: (exerciseIds?: string[]) => void;
  /** Startet ein fertiges Workout: pro Übung die vorgegebene Satzzahl, vorbelegt mit dem letzten Training oder dem Ziel. */
  startRoutine: (
    items: { exerciseId: string; sets: number; targetReps: number | null; reps: string; restSeconds: number }[],
  ) => void;
  /** Startet ein gespeichertes Workout erneut mit gleichen Übungen und vorbelegten Sätzen. false, wenn es nicht existiert. */
  repeatWorkout: (workoutId: string) => boolean;
  discardWorkout: () => void;
  /** Beendet das Workout und gibt die Id des gespeicherten Workouts zurück, oder null wenn kein Satz erledigt wurde. */
  finishWorkout: () => string | null;
  addExercise: (exerciseId: string) => void;
  removeExercise: (exerciseIndex: number) => void;
  /** Verschiebt eine Übung um eine Position nach oben */
  moveExerciseUp: (exerciseIndex: number) => void;
  /** Tauscht eine Übung ohne erledigte Sätze gegen eine andere, Satzzahl und Vorgabe bleiben. */
  replaceExercise: (exerciseIndex: number, exerciseId: string) => void;
  addSet: (exerciseIndex: number) => void;
  /** Fügt Aufwärmsätze (Anzeigeeinheit) vor den Arbeitssätzen ein. */
  addWarmupSets: (exerciseIndex: number, sets: { weight: number; reps: number }[]) => void;
  removeSet: (exerciseIndex: number, setId: string) => void;
  updateSet: (exerciseIndex: number, setId: string, patch: Partial<Omit<DraftSet, 'id'>>) => void;

  deleteWorkout: (id: string) => void;
  saveTemplate: (name: string, exerciseIds: string[]) => void;
  deleteTemplate: (id: string) => void;
  reset: () => void;
};

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

function emptySet(): DraftSet {
  return { id: newId(), weight: '', reps: '', rpe: '', isWarmup: false, done: false };
}

/** Belegt einen neuen Satz mit den Werten des letzten Trainings dieser Übung vor. */
function prefilledSet(history: StrengthWorkout[], exerciseId: string, units: Units): DraftSet {
  const last = lastWorkingSet(history, exerciseId);
  if (!last) return emptySet();

  return {
    ...emptySet(),
    weight: last.weightKg > 0 ? String(kgToDisplay(last.weightKg, units)) : '',
    reps: String(last.reps),
  };
}

const INITIAL = { active: null, history: [], templates: [] };
export const WORKOUT_STORE_VERSION = 1;

export const useWorkouts = create<WorkoutState>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      hydrated: false,

      startWorkout: (exerciseIds = []) => {
        const { history } = get();
        const units = useSettings.getState().units;

        set({
          active: {
            id: newId(),
            startedAt: Date.now(),
            exercises: exerciseIds.map((exerciseId) => ({
              exerciseId,
              sets: [prefilledSet(history, exerciseId, units)],
            })),
          },
        });
      },

      startRoutine: (items) => {
        const { history } = get();
        const units = useSettings.getState().units;

        set({
          active: {
            id: newId(),
            startedAt: Date.now(),
            exercises: items.map(({ exerciseId, sets, targetReps, reps, restSeconds }) => ({
              exerciseId,
              target: { reps, restSeconds },
              sets: Array.from({ length: Math.max(1, sets) }, () => {
                const prefilled = prefilledSet(history, exerciseId, units);
                if (prefilled.reps === '' && targetReps !== null) prefilled.reps = String(targetReps);
                return prefilled;
              }),
            })),
          },
        });
      },

      repeatWorkout: (workoutId) => {
        const source = get().history.find((w) => w.id === workoutId);
        if (!source || get().active) return false;

        const exercises = draftFromWorkout(source, useSettings.getState().units, newId);
        set({ active: { id: newId(), startedAt: Date.now(), exercises } });
        return true;
      },

      discardWorkout: () => set({ active: null }),

      finishWorkout: () => {
        const { active, history } = get();
        if (!active) return null;

        const finished = finalizeDraft(active, useSettings.getState().units, Date.now());
        if (finished.exercises.length === 0) return null;

        set({ active: null, history: [...history, finished] });
        return finished.id;
      },

      addExercise: (exerciseId) => {
        const { active, history } = get();
        if (!active) return;

        const units = useSettings.getState().units;
        set({
          active: {
            ...active,
            exercises: [...active.exercises, { exerciseId, sets: [prefilledSet(history, exerciseId, units)] }],
          },
        });
      },

      removeExercise: (exerciseIndex) => {
        const { active } = get();
        if (!active) return;
        set({ active: { ...active, exercises: active.exercises.filter((_, i) => i !== exerciseIndex) } });
      },

      moveExerciseUp: (exerciseIndex) => {
        const { active } = get();
        if (!active || exerciseIndex <= 0 || exerciseIndex >= active.exercises.length) return;
        const exercises = [...active.exercises];
        [exercises[exerciseIndex - 1], exercises[exerciseIndex]] = [exercises[exerciseIndex], exercises[exerciseIndex - 1]];
        set({ active: { ...active, exercises } });
      },

      replaceExercise: (exerciseIndex, exerciseId) => {
        const { active, history } = get();
        const entry = active?.exercises[exerciseIndex];
        if (!active || !entry || entry.sets.some((set) => set.done)) return;
        const units = useSettings.getState().units;
        const replaced = {
          ...entry,
          exerciseId,
          sets: entry.sets.map((old) => {
            const fresh = { ...prefilledSet(history, exerciseId, units), isWarmup: old.isWarmup };
            const goal = entry.target ? targetReps(entry.target.reps) : null;
            if (fresh.reps === '' && goal !== null) fresh.reps = String(goal);
            return fresh;
          }),
        };
        set({ active: { ...active, exercises: active.exercises.map((e, i) => (i === exerciseIndex ? replaced : e)) } });
      },

      addWarmupSets: (exerciseIndex, warmups) => {
        const { active } = get();
        const entry = active?.exercises[exerciseIndex];
        if (!active || !entry || warmups.length === 0) return;
        const added: DraftSet[] = warmups.map((warmup) => ({
          ...emptySet(),
          weight: String(warmup.weight),
          reps: String(warmup.reps),
          isWarmup: true,
        }));
        const updated = { ...entry, sets: [...added, ...entry.sets] };
        set({ active: { ...active, exercises: active.exercises.map((e, i) => (i === exerciseIndex ? updated : e)) } });
      },

      addSet: (exerciseIndex) => {
        const { active } = get();
        if (!active) return;

        set({
          active: {
            ...active,
            exercises: active.exercises.map((exercise, i) => {
              if (i !== exerciseIndex) return exercise;
              // Neuer Satz übernimmt Gewicht und Wiederholungen des vorherigen
              const previous = exercise.sets[exercise.sets.length - 1];
              const next = previous
                ? { ...emptySet(), weight: previous.weight, reps: previous.reps }
                : emptySet();
              return { ...exercise, sets: [...exercise.sets, next] };
            }),
          },
        });
      },

      removeSet: (exerciseIndex, setId) => {
        const { active } = get();
        if (!active) return;

        set({
          active: {
            ...active,
            exercises: active.exercises.map((exercise, i) =>
              i === exerciseIndex ? { ...exercise, sets: exercise.sets.filter((s) => s.id !== setId) } : exercise,
            ),
          },
        });
      },

      updateSet: (exerciseIndex, setId, patch) => {
        const { active } = get();
        if (!active) return;

        set({
          active: {
            ...active,
            exercises: active.exercises.map((exercise, i) =>
              i === exerciseIndex
                ? { ...exercise, sets: exercise.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }
                : exercise,
            ),
          },
        });
      },

      deleteWorkout: (id) => set({ history: get().history.filter((w) => w.id !== id) }),

      saveTemplate: (name, exerciseIds) =>
        set({ templates: [...get().templates, { id: newId(), name: name.trim(), exerciseIds }] }),

      deleteTemplate: (id) => set({ templates: get().templates.filter((t) => t.id !== id) }),

      reset: () => set(INITIAL),
    }),
    {
      name: 'fitnessapp-workouts',
      // Version 1: Übungen im laufenden Workout können eine optionale Vorgabe (target) haben.
      // Ältere Daten bleiben unverändert gültig, die Migration übernimmt sie wie sie sind.
      version: WORKOUT_STORE_VERSION,
      migrate: (persisted) => persisted as Pick<WorkoutState, 'active' | 'history' | 'templates'>,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ active, history, templates }) => ({ active, history, templates }),
      onRehydrateStorage: () => () => useWorkouts.setState({ hydrated: true }),
    },
  ),
);

export function getWorkout(history: StrengthWorkout[], id: string | undefined): StrengthWorkout | undefined {
  return history.find((workout) => workout.id === id);
}
