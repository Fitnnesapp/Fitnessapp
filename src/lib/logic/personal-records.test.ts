import assert from 'node:assert/strict';
import { test } from 'node:test';

import { findRecords } from './personal-records.ts';

type SetInit = { id: string; weightKg: number; reps: number; isWarmup?: boolean };

const workout = (exerciseId: string, sets: SetInit[]) => ({
  exercises: [
    {
      exerciseId,
      sets: sets.map((s) => ({ rpe: null, isWarmup: false, ...s })),
    },
  ],
});

test('der erste Satz einer Übung ist nur die Basis, kein Rekord', () => {
  const records = findRecords([workout('bank', [{ id: 'a', weightKg: 60, reps: 8 }])]);
  assert.equal(records.size, 0);
});

test('gleicher Wert ist kein neuer Rekord', () => {
  const records = findRecords([
    workout('bank', [{ id: 'a', weightKg: 60, reps: 8 }]),
    workout('bank', [{ id: 'b', weightKg: 60, reps: 8 }]),
  ]);
  assert.equal(records.size, 0);
});

test('höheres Gewicht ist ein Gewichtsrekord', () => {
  const records = findRecords([
    workout('bank', [{ id: 'a', weightKg: 60, reps: 8 }]),
    workout('bank', [{ id: 'b', weightKg: 62.5, reps: 5 }]),
  ]);
  assert.deepEqual(records.get('b'), ['max_weight']);
});

test('mehr Wiederholungen beim gleichen Gewicht sind ein Wiederholungsrekord', () => {
  const records = findRecords([
    workout('bank', [{ id: 'a', weightKg: 60, reps: 8 }]),
    workout('bank', [{ id: 'b', weightKg: 60, reps: 9 }]),
  ]);
  assert.deepEqual(records.get('b'), ['max_reps']);
});

test('weniger Gewicht oder weniger Wiederholungen sind kein Rekord', () => {
  const records = findRecords([
    workout('bank', [{ id: 'a', weightKg: 60, reps: 8 }]),
    workout('bank', [
      { id: 'b', weightKg: 55, reps: 12 },
      { id: 'c', weightKg: 60, reps: 7 },
    ]),
  ]);
  assert.equal(records.size, 0);
});

test('Aufwärmsätze zählen nie', () => {
  const records = findRecords([
    workout('bank', [{ id: 'a', weightKg: 60, reps: 8 }]),
    workout('bank', [{ id: 'b', weightKg: 100, reps: 10, isWarmup: true }]),
  ]);
  assert.equal(records.size, 0);
});

test('Übungen werden getrennt betrachtet', () => {
  const records = findRecords([
    workout('bank', [{ id: 'a', weightKg: 100, reps: 5 }]),
    workout('kniebeuge', [{ id: 'b', weightKg: 60, reps: 5 }]),
  ]);
  assert.equal(records.size, 0);
});

test('Sätze im selben Workout vergleichen sich der Reihe nach', () => {
  const records = findRecords([
    workout('bank', [
      { id: 'a', weightKg: 60, reps: 8 },
      { id: 'b', weightKg: 60, reps: 9 },
      { id: 'c', weightKg: 60, reps: 9 },
    ]),
  ]);
  assert.deepEqual([...records.keys()], ['b']);
});
