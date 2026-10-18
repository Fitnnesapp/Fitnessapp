import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Activity } from './activity.ts';
import { yearReview, yearsWithActivity } from './year-review.ts';

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();
const NOW = at(2026, 12, 31);

const act = (id: string, when: number, type: Activity['type'], durationSeconds = 1800, distanceM = 0): Activity => ({
  id,
  type,
  startedAt: when,
  durationSeconds,
  distanceM,
});

const workout = (id: string, when: number, exerciseId: string, sets: [number, number, boolean?][]) => ({
  id,
  type: 'strength' as const,
  startedAt: when,
  endedAt: when + 1000,
  exercises: [
    {
      exerciseId,
      sets: sets.map(([weightKg, reps, isWarmup], i) => ({ id: `${id}-${i}`, weightKg, reps, rpe: null, isWarmup: isWarmup ?? false })),
    },
  ],
});

const run = (id: string, when: number, distanceM: number, k5: number | null) => ({
  id,
  type: 'running' as const,
  startedAt: when,
  endedAt: when + 1000,
  distanceM,
  durationSeconds: 1800,
  elevationGainM: 0,
  bests: { k1: null, k5, k10: null },
  points: [],
});

test('nur Workouts des gewählten Jahres zählen', () => {
  const activities = [act('a', at(2025, 12, 31), 'strength'), act('b', at(2026, 1, 1), 'home'), act('c', at(2026, 6, 10), 'running', 2000, 5000)];
  const review = yearReview({ year: 2026, activities, strength: [], runs: [], now: NOW });
  assert.equal(review.workouts, 2);
  assert.deepEqual(review.byType, { strength: 0, home: 1, running: 1 });
  assert.equal(review.durationSeconds, 1800 + 2000);
  assert.equal(review.distanceM, 5000);
});

test('Jahre mit Aktivität, neueste zuerst', () => {
  assert.deepEqual(yearsWithActivity([act('a', at(2024, 3, 1), 'home'), act('b', at(2026, 3, 1), 'home'), act('c', at(2026, 5, 1), 'home')]), [2026, 2024]);
});

test('bester Monat, aktivster Wochentag und aktive Tage', () => {
  // 5.10.2026 ist ein Montag
  const activities = [
    act('a', at(2026, 10, 5), 'home'),
    act('b', at(2026, 10, 12), 'home'),
    act('c', at(2026, 10, 12, 18), 'home'),
    act('d', at(2026, 3, 3), 'home'),
  ];
  const review = yearReview({ year: 2026, activities, strength: [], runs: [], now: NOW });
  assert.deepEqual(review.bestMonth, { month: 9, count: 3 });
  assert.equal(review.busiestWeekday, 0);
  assert.equal(review.activeDays, 3);
});

test('Volumen, Lieblingsübung und Rekorde im Krafttraining', () => {
  const strength = [
    workout('w1', at(2025, 5, 1), 'bank', [[60, 8]]),
    workout('w2', at(2026, 2, 1), 'bank', [[62.5, 8], [100, 10, true]]),
    workout('w3', at(2026, 3, 1), 'kniebeuge', [[80, 5], [80, 5], [80, 5]]),
  ];
  const activities = strength.map((w) => act(w.id, w.startedAt, 'strength'));
  const review = yearReview({ year: 2026, activities, strength, runs: [], now: NOW });

  assert.equal(review.volumeKg, 62.5 * 8 + 80 * 5 * 3);
  assert.deepEqual(review.topExercise, { exerciseId: 'kniebeuge', sets: 3 });
  // 62,5 kg schlägt die 60 kg aus dem Vorjahr
  assert.equal(review.recordCount, 1);
});

test('längster Lauf und Lauf-Rekorde des Jahres', () => {
  const runs = [run('r1', at(2025, 4, 1), 5000, 1700), run('r2', at(2026, 4, 1), 8000, 1600), run('r3', at(2026, 5, 1), 6000, 1650)];
  const activities = runs.map((r) => act(r.id, r.startedAt, 'running', 1800, r.distanceM));
  const review = yearReview({ year: 2026, activities, strength: [], runs, now: NOW });
  assert.equal(review.longestRunM, 8000);
  // r2: längster Lauf und schnellste 5 km; r3 bricht nichts
  assert.equal(review.recordCount, 2);
});

test('längste Serie bleibt im Jahr und endet am Jahresende', () => {
  const activities = [act('a', at(2025, 12, 30), 'home'), act('b', at(2025, 12, 31), 'home'), act('c', at(2026, 1, 1), 'home'), act('d', at(2026, 1, 2), 'home')];
  const review = yearReview({ year: 2026, activities, strength: [], runs: [], now: NOW });
  assert.equal(review.longestStreak, 2);
});

test('leeres Jahr', () => {
  const review = yearReview({ year: 2026, activities: [], strength: [], runs: [], now: NOW });
  assert.equal(review.workouts, 0);
  assert.equal(review.bestMonth, null);
  assert.equal(review.busiestWeekday, null);
  assert.equal(review.topExercise, null);
});
