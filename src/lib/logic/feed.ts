import type { HomeSession } from '../../types/home.ts';
import type { RunRecordType, RunSession, TrackPoint } from '../../types/running.ts';
import type { StrengthWorkout } from '../../types/workout.ts';
import { findRecords } from './personal-records.ts';
import { findRunRecords, paceSecPerKm } from './run-stats.ts';

/**
 * Aktivitäts-Feed nach Strava-Vorbild: jede abgeschlossene Einheit als Karte mit Titel,
 * wenigen großen Kennzahlen und Rekorden. Bewusst begrenzt (kein endloses Scrollen):
 * der Start-Bildschirm zeigt die letzten Einheiten, der ganze Verlauf liegt unter "Fortschritt".
 */

export const FEED_LIMIT = 5;

export type DayPart = 'morgen' | 'mittag' | 'nachmittag' | 'abend' | 'nacht';

export type FeedItem =
  | {
      kind: 'run';
      id: string;
      at: number;
      title: string;
      distanceM: number;
      durationSeconds: number;
      paceSecPerKm: number | null;
      elevationGainM: number;
      records: RunRecordType[];
      points: TrackPoint[];
    }
  | {
      kind: 'strength';
      id: string;
      at: number;
      title: string;
      durationMs: number;
      volumeKg: number;
      workingSets: number;
      /** Übungen mit Anzahl der Arbeitssätze, in Trainingsreihenfolge */
      exercises: { exerciseId: string; sets: number }[];
      /** Anzahl der Sätze mit persönlichem Rekord */
      recordCount: number;
    }
  | {
      kind: 'home';
      id: string;
      at: number;
      title: string;
      activeSeconds: number;
      caloriesEstimate: number;
      completed: boolean;
    };

/** Tageszeit einer Uhrzeit (lokale Zeit). */
export function dayPart(at: number): DayPart {
  const hour = new Date(at).getHours();
  if (hour >= 5 && hour < 11) return 'morgen';
  if (hour >= 11 && hour < 14) return 'mittag';
  if (hour >= 14 && hour < 18) return 'nachmittag';
  if (hour >= 18 && hour < 22) return 'abend';
  return 'nacht';
}

const RUN_TITLES: Record<DayPart, string> = {
  morgen: 'Morgenlauf',
  mittag: 'Mittagslauf',
  nachmittag: 'Nachmittagslauf',
  abend: 'Abendlauf',
  nacht: 'Nachtlauf',
};

const STRENGTH_TITLES: Record<DayPart, string> = {
  morgen: 'Krafttraining am Morgen',
  mittag: 'Krafttraining am Mittag',
  nachmittag: 'Krafttraining am Nachmittag',
  abend: 'Krafttraining am Abend',
  nacht: 'Krafttraining in der Nacht',
};

/** Automatischer Titel wie bei Strava: "Abendlauf", bei Kraft die trainierten Muskelgruppen. */
export function strengthTitle(at: number, muscleGroups: string[]): string {
  const groups = [...new Set(muscleGroups)];
  if (groups.length === 0) return STRENGTH_TITLES[dayPart(at)];
  if (groups.length === 1) return groups[0];
  if (groups.length === 2) return `${groups[0]} & ${groups[1]}`;
  return `${groups[0]}, ${groups[1]} & mehr`;
}

export function runTitle(at: number): string {
  return RUN_TITLES[dayPart(at)];
}

const startOfDay = (at: number) => {
  const d = new Date(at);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

/** Kurzes Datum für die Karte: "Heute", "Gestern", Wochentag innerhalb einer Woche, sonst "12. Oktober". */
export function feedDayLabel(at: number, now: number): string {
  const days = Math.round((startOfDay(now) - startOfDay(at)) / 86_400_000);
  if (days <= 0) return 'Heute';
  if (days === 1) return 'Gestern';
  const d = new Date(at);
  if (days < 7) return WEEKDAYS[d.getDay()];
  const label = `${d.getDate()}. ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() === new Date(now).getFullYear() ? label : `${label} ${d.getFullYear()}`;
}

type FeedInput = {
  strength: StrengthWorkout[];
  home: HomeSession[];
  runs: RunSession[];
  muscleGroupOf: (exerciseId: string) => string | undefined;
  programName: (programId: string) => string | undefined;
  limit?: number;
};

/** Baut den Feed, neueste Einheit zuerst. Rekorde werden über den ganzen Verlauf bestimmt. */
export function buildFeed({ strength, home, runs, muscleGroupOf, programName, limit = FEED_LIMIT }: FeedInput): FeedItem[] {
  const strengthAsc = [...strength].sort((a, b) => a.startedAt - b.startedAt);
  const runsAsc = [...runs].sort((a, b) => a.startedAt - b.startedAt);
  const setRecords = findRecords(strengthAsc);
  const runRecords = findRunRecords(runsAsc);

  const items: FeedItem[] = [
    ...strength.map((w): FeedItem => {
      const exercises = w.exercises
        .map((e) => ({ exerciseId: e.exerciseId, sets: e.sets.filter((s) => !s.isWarmup).length }))
        .filter((e) => e.sets > 0);
      const working = w.exercises.flatMap((e) => e.sets.filter((s) => !s.isWarmup));
      const groups = w.exercises.map((e) => muscleGroupOf(e.exerciseId)).filter((g): g is string => Boolean(g));
      return {
        kind: 'strength',
        id: w.id,
        at: w.startedAt,
        title: strengthTitle(w.startedAt, groups),
        durationMs: Math.max(0, w.endedAt - w.startedAt),
        volumeKg: Math.round(working.reduce((sum, s) => sum + s.weightKg * s.reps, 0) * 100) / 100,
        workingSets: working.length,
        exercises,
        recordCount: working.filter((s) => setRecords.has(s.id)).length,
      };
    }),
    ...home.map(
      (s): FeedItem => ({
        kind: 'home',
        id: s.id,
        at: s.startedAt,
        title: programName(s.programId) ?? 'Home-Workout',
        activeSeconds: s.activeSeconds,
        caloriesEstimate: s.caloriesEstimate,
        completed: s.completed,
      }),
    ),
    ...runs.map(
      (r): FeedItem => ({
        kind: 'run',
        id: r.id,
        at: r.startedAt,
        title: runTitle(r.startedAt),
        distanceM: r.distanceM,
        durationSeconds: r.durationSeconds,
        paceSecPerKm: paceSecPerKm(r.distanceM, r.durationSeconds),
        elevationGainM: r.elevationGainM,
        records: runRecords.get(r.id) ?? [],
        points: r.points,
      }),
    ),
  ];

  return items.sort((a, b) => b.at - a.at).slice(0, Math.max(0, limit));
}
