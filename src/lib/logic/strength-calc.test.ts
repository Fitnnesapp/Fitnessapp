import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { StrengthWorkout } from '../../types/workout.ts';
import {
  bestOneRepMax,
  BARS,
  estimateOneRepMax,
  percentTable,
  PLATES,
  platesPerSide,
  roundDownToStep,
  roundToStep,
} from './strength-calc.ts';

test('1RM nach Epley, eine Wiederholung ist das 1RM selbst', () => {
  assert.equal(estimateOneRepMax(100, 1), 100);
  assert.equal(estimateOneRepMax(100, 10), 133.3);
  assert.equal(estimateOneRepMax(80, 8), 101.3);
});

test('ungültige oder zu hohe Wiederholungen ergeben keine Schätzung', () => {
  assert.equal(estimateOneRepMax(0, 5), null);
  assert.equal(estimateOneRepMax(100, 0), null);
  assert.equal(estimateOneRepMax(100, 13), null);
  assert.equal(estimateOneRepMax(100, 2.5), null);
  assert.equal(estimateOneRepMax(Number.NaN, 5), null);
});

test('auf ladbare Stufen runden', () => {
  assert.equal(roundToStep(101.3, 2.5), 102.5);
  assert.equal(roundToStep(101.2, 2.5), 100);
  assert.equal(roundToStep(103.8, 2.5), 105);
  assert.equal(roundToStep(222, 5), 220);
});

test('Prozenttabelle beginnt bei 100 % und ist gerundet', () => {
  const table = percentTable(100, 2.5);
  assert.deepEqual(table[0], { percent: 100, reps: 1, weight: 100 });
  assert.deepEqual(table[4], { percent: 80, reps: 8, weight: 80 });
  assert.deepEqual(table[2], { percent: 90, reps: 4, weight: 90 });
  // abgerundet: 100 % liegt nie über dem geschätzten 1RM
  assert.equal(percentTable(101.3, 2.5)[0].weight, 100);
  assert.equal(percentTable(101.3, 2.5)[3].weight, 85);
  assert.equal(percentTable(100, 2.5)[3].weight, 85);
});

test('abrunden auf ladbare Stufen ohne Gleitkomma-Fehler', () => {
  assert.equal(roundDownToStep(102.4, 2.5), 100);
  assert.equal(roundDownToStep(85, 2.5), 85);
  assert.equal(roundDownToStep(0.85 * 100, 2.5), 85);
  assert.equal(roundDownToStep(229, 5), 225);
});

test('Scheiben pro Seite: 100 kg an der 20-kg-Stange', () => {
  assert.deepEqual(platesPerSide(100, 20, PLATES.metric), { perSide: [25, 15], loaded: 100, missing: 0 });
});

test('Scheiben mit 1,25 kg ohne Rundungsfehler', () => {
  assert.deepEqual(platesPerSide(62.5, 20, PLATES.metric), { perSide: [20, 1.25], loaded: 62.5, missing: 0 });
});

test('nicht exakt ladbares Gewicht meldet den Rest', () => {
  assert.deepEqual(platesPerSide(61, 20, PLATES.metric), { perSide: [20], loaded: 60, missing: 1 });
});

test('Ziel unter dem Stangengewicht ergibt eine leere Stange', () => {
  assert.deepEqual(platesPerSide(15, 20, PLATES.metric), { perSide: [], loaded: 20, missing: 0 });
});

test('imperial: 225 lb an der 45-lb-Stange sind zwei 45er pro Seite', () => {
  assert.deepEqual(platesPerSide(225, BARS.imperial[0], PLATES.imperial), { perSide: [45, 45], loaded: 225, missing: 0 });
});

test('bestes geschätztes 1RM über alle Arbeitssätze, Aufwärmsätze zählen nicht', () => {
  const history: StrengthWorkout[] = [
    {
      id: 'a',
      type: 'strength',
      startedAt: 1,
      endedAt: 2,
      exercises: [
        {
          exerciseId: 'bank',
          sets: [
            { id: '1', weightKg: 120, reps: 1, rpe: null, isWarmup: true },
            { id: '2', weightKg: 80, reps: 8, rpe: null, isWarmup: false },
          ],
        },
      ],
    },
    {
      id: 'b',
      type: 'strength',
      startedAt: 5,
      endedAt: 6,
      exercises: [
        { exerciseId: 'bank', sets: [{ id: '3', weightKg: 90, reps: 3, rpe: null, isWarmup: false }] },
        { exerciseId: 'kniebeuge', sets: [{ id: '4', weightKg: 150, reps: 5, rpe: null, isWarmup: false }] },
      ],
    },
  ];
  assert.deepEqual(bestOneRepMax(history, 'bank'), { oneRepMaxKg: 101.3, weightKg: 80, reps: 8, at: 1 });
  assert.equal(bestOneRepMax(history, 'fehlt'), null);
});
