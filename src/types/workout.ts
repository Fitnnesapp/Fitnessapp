export type MuscleGroup =
  | 'Brust'
  | 'Rücken'
  | 'Schultern'
  | 'Bizeps'
  | 'Trizeps'
  | 'Beine'
  | 'Gesäß'
  | 'Bauch'
  | 'Waden'
  | 'Unterarme';

export type Equipment = 'Langhantel' | 'Kurzhantel' | 'Maschine' | 'Kabelzug' | 'Körpergewicht' | 'Kettlebell';

export type Difficulty = 'Einsteiger' | 'Fortgeschritten' | 'Profi';

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  difficulty: Difficulty;
  instructions: string;
};

/** Satz während des Trainings: Eingaben bleiben Text, damit Zwischenstände wie "7," tippbar sind. */
export type DraftSet = {
  id: string;
  weight: string;
  reps: string;
  rpe: string;
  isWarmup: boolean;
  done: boolean;
};

export type DraftExercise = {
  exerciseId: string;
  sets: DraftSet[];
};

export type ActiveWorkout = {
  id: string;
  startedAt: number;
  exercises: DraftExercise[];
};

/** Abgeschlossener Satz, Gewicht immer in kg gespeichert. */
export type LoggedSet = {
  id: string;
  weightKg: number;
  reps: number;
  rpe: number | null;
  isWarmup: boolean;
};

export type LoggedExercise = {
  exerciseId: string;
  sets: LoggedSet[];
};

export type StrengthWorkout = {
  id: string;
  type: 'strength';
  startedAt: number;
  endedAt: number;
  exercises: LoggedExercise[];
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  exerciseIds: string[];
};

export type RecordType = 'max_weight' | 'max_reps';

/** Ein Satz, der einen persönlichen Rekord bricht. */
export type SetRecord = {
  setId: string;
  recordTypes: RecordType[];
};
