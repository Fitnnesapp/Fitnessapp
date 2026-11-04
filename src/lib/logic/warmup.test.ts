import assert from 'node:assert/strict';
import { test } from 'node:test';

import { warmupSets } from './warmup.ts';

test('Langhantel: 50/70/85 %, auf 2,5 kg gerundet', () => {
  assert.deepEqual(warmupSets(100, 'Langhantel', 'metric'), [
    { weight: 50, reps: 8 },
    { weight: 70, reps: 5 },
    { weight: 85, reps: 3 },
  ]);
});

test('Leichte Stange: nie unter 20 kg, keine doppelten Sätze', () => {
  assert.deepEqual(warmupSets(40, 'Langhantel', 'metric'), [
    { weight: 20, reps: 8 },
    { weight: 27.5, reps: 5 },
    { weight: 35, reps: 3 },
  ]);
  assert.deepEqual(warmupSets(25, 'Langhantel', 'metric'), [
    { weight: 20, reps: 8 },
    { weight: 22.5, reps: 3 },
  ]);
});

test('Kurzhantel: zwei Sätze, 2-kg-Schritte', () => {
  assert.deepEqual(warmupSets(24, 'Kurzhantel', 'metric'), [
    { weight: 12, reps: 10 },
    { weight: 18, reps: 5 },
  ]);
});

test('Imperial in 5-lb-Schritten, Stange 45 lb', () => {
  assert.deepEqual(warmupSets(225, 'Langhantel', 'imperial'), [
    { weight: 115, reps: 8 },
    { weight: 160, reps: 5 },
    { weight: 190, reps: 3 },
  ]);
});

test('Kein Aufwärmen bei Körpergewicht oder sehr leichtem Gewicht', () => {
  assert.deepEqual(warmupSets(0, 'Körpergewicht', 'metric'), []);
  assert.deepEqual(warmupSets(8, 'Kurzhantel', 'metric'), []);
});
