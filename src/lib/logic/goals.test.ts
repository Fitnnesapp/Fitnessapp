import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { StrengthWorkout } from '../../types/workout.ts';
import { bestWeight, goalProgress, validateGoal, type StrengthGoal } from './goals.ts';

const w = (startedAt: number, exerciseId: string, sets: [number, number, boolean?][]): StrengthWorkout => ({
  id: String(startedAt),
  type: 'strength',
  startedAt,
  endedAt: startedAt + 1,
  exercises: [
    {
      exerciseId,
      sets: sets.map(([weightKg, reps, warmup], i) => ({
        id: `${startedAt}-${i}`,
        weightKg,
        reps,
        rpe: null,
        isWarmup: warmup ?? false,
      })),
    },
  ],
});

const goal: StrengthGoal = { id: 'g', exerciseId: 'bank', targetKg: 100, startKg: 80, createdAt: 10 };

test('Bestes Gewicht ohne Aufwärmsätze', () => {
  assert.equal(bestWeight([w(1, 'bank', [[120, 1, true], [80, 5]])], 'bank'), 80);
  assert.equal(bestWeight([], 'bank'), 0);
});

test('Fortschritt als Anteil am Zielgewicht', () => {
  const progress = goalProgress(goal, [w(5, 'bank', [[80, 5]]), w(20, 'bank', [[90, 3]])]);
  assert.equal(progress.currentKg, 90);
  assert.equal(progress.ratio, 0.9);
  assert.equal(progress.remainingKg, 10);
  assert.equal(progress.achieved, false);
  assert.equal(progress.achievedAt, null);
});

test('Erreicht: Zeitpunkt des ersten Workouts mit Zielgewicht', () => {
  const progress = goalProgress(goal, [w(20, 'bank', [[95, 3]]), w(30, 'bank', [[100, 1]]), w(40, 'bank', [[102.5, 1]])]);
  assert.equal(progress.achieved, true);
  assert.equal(progress.ratio, 1);
  assert.equal(progress.achievedAt, 30);
});

test('Zieleingabe wird geprüft', () => {
  assert.match(validateGoal(null, 80) ?? '', /Zielgewicht/);
  assert.match(validateGoal(80, 80) ?? '', /schon geschafft/);
  assert.match(validateGoal(300, 80) ?? '', /sehr großer Sprung/);
  assert.equal(validateGoal(100, 80), null);
  assert.equal(validateGoal(40, 0), null);
});
