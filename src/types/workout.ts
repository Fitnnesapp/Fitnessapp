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
  /** Vorgabe aus einem fertigen Workout (seit Speicherversion 1, optional) */
  target?: { reps: string; restSeconds: number };
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

/** Ort, für den ein fertiges Kraft-Workout gedacht ist. */
export type RoutineSetting = 'Studio' | 'Zuhause';

/** Eine Übung in einem fertigen Workout mit Zielvorgabe. */
export type RoutineItem = {
  exerciseId: string;
  sets: number;
  /** Zielbereich, z.B. "8–10" oder "30 s" */
  reps: string;
  restSeconds: number;
};

/** Fertiges, kuratiertes Kraft-Workout zum Sofortstart. */
export type Routine = {
  id: string;
  name: string;
  description: string;
  focus: 'Ganzkörper' | 'Oberkörper' | 'Push' | 'Pull' | 'Beine' | 'Rumpf';
  setting: RoutineSetting;
  difficulty: Difficulty;
  items: RoutineItem[];
};

export type RecordType = 'max_weight' | 'max_reps';

/** Ein Satz, der einen persönlichen Rekord bricht. */
export type SetRecord = {
  setId: string;
  recordTypes: RecordType[];
};
