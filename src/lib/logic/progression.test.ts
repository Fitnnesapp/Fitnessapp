import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { StrengthWorkout } from '../../types/workout.ts';
import { progressionTip, weightStep } from './progression.ts';

const BENCH = { equipment: 'Langhantel', muscleGroup: 'Brust' } as const;
const SQUAT = { equipment: 'Langhantel', muscleGroup: 'Beine' } as const;

const workout = (
  startedAt: number,
  exerciseId: string,
  sets: [weightKg: number, reps: number, rpe?: number, warmup?: boolean][],
): StrengthWorkout => ({
  id: String(startedAt),
  type: 'strength',
  startedAt,
  endedAt: startedAt + 1,
  exercises: [
    {
      exerciseId,
      sets: sets.map(([weightKg, reps, rpe, warmup], i) => ({
        id: `${startedAt}-${i}`,
        weightKg,
        reps,
        rpe: rpe ?? null,
        isWarmup: warmup ?? false,
      })),
    },
  ],
});

test('Ohne Verlauf: Einstiegshinweis', () => {
  assert.equal(progressionTip([], 'bank', BENCH, 'metric').action, 'first');
});

test('Gleichmäßige Sätze unter der Obergrenze: eine Wiederholung mehr', () => {
  const tip = progressionTip([workout(1, 'bank', [[40, 10, undefined, true], [80, 8], [80, 8], [80, 7]])], 'bank', BENCH, 'metric');
  assert.equal(tip.action, 'reps');
  assert.deepEqual(tip.last, { weight: 80, reps: [8, 8, 7] });
  assert.equal(tip.weight, 80);
  assert.equal(tip.reps, 9);
});

test('Obergrenze in allen Sätzen: Gewicht steigt, Beine in größeren Schritten', () => {
  const bench = progressionTip([workout(1, 'bank', [[60, 12], [60, 12]])], 'bank', BENCH, 'metric');
  assert.equal(bench.action, 'weight');
  assert.equal(bench.weight, 62.5);
  assert.equal(bench.reps, 8);
  const squat = progressionTip([workout(1, 'squat', [[100, 12], [100, 13]])], 'squat', SQUAT, 'metric');
  assert.equal(squat.weight, 105);
});

test('Nur das neueste Training zählt, und nur Sätze mit dem Top-Gewicht', () => {
  const tip = progressionTip(
    [workout(1, 'bank', [[60, 12], [60, 12]]), workout(5, 'bank', [[70, 9], [70, 9], [60, 12]])],
    'bank',
    BENCH,
    'metric',
  );
  assert.equal(tip.action, 'reps');
  assert.deepEqual(tip.last?.reps, [9, 9]);
});

test('Am Limit (RPE 10) oder starker Abfall: Gewicht halten', () => {
  assert.equal(progressionTip([workout(1, 'bank', [[80, 12, 10], [80, 12]])], 'bank', BENCH, 'metric').action, 'hold');
  const dropOff = progressionTip([workout(1, 'bank', [[80, 10], [80, 6]])], 'bank', BENCH, 'metric');
  assert.equal(dropOff.action, 'hold');
  assert.equal(dropOff.reps, 7);
});

test('Körpergewicht: Wiederholungen steigern, ab 20 schwerere Variante', () => {
  const push = { equipment: 'Körpergewicht', muscleGroup: 'Brust' } as const;
  assert.equal(progressionTip([workout(1, 'ls', [[0, 12], [0, 11]])], 'ls', push, 'metric').reps, 13);
  assert.equal(progressionTip([workout(1, 'ls', [[0, 20], [0, 22]])], 'ls', push, 'metric').action, 'harder');
});

test('Imperial: Schritte in Pfund, Gewicht in Anzeigeeinheit', () => {
  assert.equal(weightStep(BENCH, 'imperial'), 5);
  assert.equal(weightStep(SQUAT, 'imperial'), 10);
  const tip = progressionTip([workout(1, 'bank', [[60, 12], [60, 12]])], 'bank', BENCH, 'imperial');
  // 60 kg = 132,28 lb, auf 2,5 lb gerundet: 132,5 + 5
  assert.equal(tip.weight, 137.5);
});
