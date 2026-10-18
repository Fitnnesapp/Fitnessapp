import type { RunSession } from '../../types/running.ts';
import type { StrengthWorkout } from '../../types/workout.ts';
import { streaks, type Activity } from './activity.ts';
import { findRecords } from './personal-records.ts';
import { findRunRecords } from './run-stats.ts';

export type YearReview = {
  year: number;
  workouts: number;
  byType: { strength: number; home: number; running: number };
  durationSeconds: number;
  distanceM: number;
  /** Gesamtvolumen im Krafttraining in kg, ohne Aufwärmsätze */
  volumeKg: number;
  /** Tage mit mindestens einem Workout */
  activeDays: number;
  bestMonth: { month: number; count: number } | null;
  /** Wochentag mit den meisten Workouts, Montag = 0 */
  busiestWeekday: number | null;
  longestRunM: number;
  /** Übung mit den meisten Arbeitssätzen */
  topExercise: { exerciseId: string; sets: number } | null;
  recordCount: number;
  longestStreak: number;
};

type Input = {
  year: number;
  activities: Activity[];
  strength: StrengthWorkout[];
  runs: RunSession[];
  /** Zeitpunkt "jetzt", damit die Serie des laufenden Jahres nicht in die Zukunft rechnet */
  now: number;
};

const yearOf = (at: number) => new Date(at).getFullYear();

/** Jahre, in denen es mindestens ein Workout gibt, neueste zuerst. */
export function yearsWithActivity(activities: Activity[]): number[] {
  return [...new Set(activities.map((a) => yearOf(a.startedAt)))].sort((a, b) => b - a);
}

export function yearReview({ year, activities, strength, runs, now }: Input): YearReview {
  const inYear = activities.filter((a) => yearOf(a.startedAt) === year);

  const byType = { strength: 0, home: 0, running: 0 };
  const perMonth = Array<number>(12).fill(0);
  const perWeekday = Array<number>(7).fill(0);
  const days = new Set<string>();
  let durationSeconds = 0;
  let distanceM = 0;

  for (const a of inYear) {
    byType[a.type] += 1;
    durationSeconds += a.durationSeconds;
    distanceM += a.distanceM;
    const d = new Date(a.startedAt);
    perMonth[d.getMonth()] += 1;
    perWeekday[(d.getDay() + 6) % 7] += 1;
    days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }

  const maxMonth = Math.max(...perMonth);
  const maxWeekday = Math.max(...perWeekday);

  // Rekorde werden über den gesamten Verlauf bestimmt und dann dem Jahr zugeordnet
  const strengthRecords = findRecords([...strength].sort((a, b) => a.startedAt - b.startedAt));
  const runRecords = findRunRecords([...runs].sort((a, b) => a.startedAt - b.startedAt));

  let volumeKg = 0;
  let recordCount = 0;
  const setsPerExercise = new Map<string, number>();

  for (const workout of strength) {
    if (yearOf(workout.startedAt) !== year) continue;
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        if (strengthRecords.has(set.id)) recordCount += 1;
        if (set.isWarmup) continue;
        volumeKg += set.weightKg * set.reps;
        setsPerExercise.set(exercise.exerciseId, (setsPerExercise.get(exercise.exerciseId) ?? 0) + 1);
      }
    }
  }

  let longestRunM = 0;
  for (const run of runs) {
    if (yearOf(run.startedAt) !== year) continue;
    longestRunM = Math.max(longestRunM, run.distanceM);
    recordCount += runRecords.get(run.id)?.length ?? 0;
  }

  const top = [...setsPerExercise.entries()].sort((a, b) => b[1] - a[1])[0];

  // Serie nur innerhalb des Jahres, bis zum Jahresende bzw. heute
  const endOfYear = new Date(year, 11, 31, 23, 59).getTime();
  const longestStreak = streaks(inYear, Math.min(endOfYear, now)).longest;

  return {
    year,
    workouts: inYear.length,
    byType,
    durationSeconds,
    distanceM,
    volumeKg: Math.round(volumeKg),
    activeDays: days.size,
    bestMonth: inYear.length > 0 ? { month: perMonth.indexOf(maxMonth), count: maxMonth } : null,
    busiestWeekday: inYear.length > 0 ? perWeekday.indexOf(maxWeekday) : null,
    longestRunM,
    topExercise: top ? { exerciseId: top[0], sets: top[1] } : null,
    recordCount,
    longestStreak,
  };
}
