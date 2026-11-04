import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { EXERCISES, setCustomExercises } from '@/data/exercises';
import { createCustomExercise, validateCustomExercise, type CustomExerciseInput } from '@/lib/logic/custom-exercises';
import type { Exercise } from '@/types/workout';

type CustomExercisesState = {
  exercises: Exercise[];
  hydrated: boolean;
  /** Legt die Übung an. Ergebnis: neue ID oder Fehlertext. */
  add: (input: CustomExerciseInput) => { id: string } | { error: string };
  /** Ändert Name, Muskel, Equipment oder Notiz; die ID bleibt, der Verlauf also erhalten. */
  update: (id: string, input: CustomExerciseInput) => { id: string } | { error: string };
  remove: (id: string) => void;
  reset: () => void;
};

/** Version des gespeicherten Formats. Bei Änderungen hochzählen und in `migrate` umwandeln. */
const CUSTOM_EXERCISES_STORE_VERSION = 1;

/** Eigene Übungen, nur lokal. getExercise() findet sie wie mitgelieferte Übungen. */
export const useCustomExercises = create<CustomExercisesState>()(
  persist(
    (set, get) => ({
      exercises: [],
      hydrated: false,
      add: (input) => {
        const current = get().exercises;
        const error = validateCustomExercise(input, [...EXERCISES, ...current]);
        if (error) return { error };
        const exercise = createCustomExercise(input, Date.now());
        const next = [...current, exercise];
        setCustomExercises(next);
        set({ exercises: next });
        return { id: exercise.id };
      },
      update: (id, input) => {
        const current = get().exercises;
        const others = current.filter((exercise) => exercise.id !== id);
        const error = validateCustomExercise(input, [...EXERCISES, ...others]);
        if (error) return { error };
        const updated = { ...createCustomExercise(input, Date.now()), id };
        const next = current.map((exercise) => (exercise.id === id ? updated : exercise));
        setCustomExercises(next);
        set({ exercises: next });
        return { id };
      },
      remove: (id) => {
        const next = get().exercises.filter((exercise) => exercise.id !== id);
        setCustomExercises(next);
        set({ exercises: next });
      },
      reset: () => {
        setCustomExercises([]);
        set({ exercises: [] });
      },
    }),
    {
      name: 'fitnessapp-custom-exercises',
      version: CUSTOM_EXERCISES_STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ exercises }) => ({ exercises }),
      // Version 1 ist die erste Fassung, ältere Stände gibt es nicht
      migrate: (persisted) => persisted as { exercises: Exercise[] },
      onRehydrateStorage: () => (state) => {
        setCustomExercises(state?.exercises ?? []);
        useCustomExercises.setState({ hydrated: true });
      },
    },
  ),
);
