export type ProgramCategory = 'HIIT' | 'Core' | 'Mobility' | 'Ganzkörper';

export type ProgramDifficulty = 'Einsteiger' | 'Fortgeschritten';

export type ProgramStep = {
  name: string;
  instruction: string;
  /** Dauer dieser Übung in Sekunden, sonst gilt workSeconds des Programms */
  seconds?: number;
};

export type Program = {
  id: string;
  name: string;
  description: string;
  category: ProgramCategory;
  difficulty: ProgramDifficulty;
  workSeconds: number;
  restSeconds: number;
  rounds: number;
  steps: ProgramStep[];
};

export type SegmentKind = 'prepare' | 'work' | 'rest';

/** Ein Abschnitt des Ablaufs: Vorbereitung, Übung oder Pause. */
export type Segment = {
  kind: SegmentKind;
  seconds: number;
  /** Position der Übung innerhalb der gesamten Abfolge (über alle Runden), 0-basiert */
  exerciseIndex: number;
  round: number;
  step: ProgramStep;
};

/** Abgeschlossenes Home-Workout. */
export type HomeSession = {
  id: string;
  type: 'home';
  programId: string;
  startedAt: number;
  endedAt: number;
  /** Tatsächlich trainierte Sekunden (Übungen und Pausen, ohne angehaltene Zeit) */
  activeSeconds: number;
  caloriesEstimate: number;
  /** Subjektive Anstrengung von 1 bis 10, optional */
  effort: number | null;
  completed: boolean;
};
