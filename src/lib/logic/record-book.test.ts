import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { StrengthWorkout } from '../../types/workout.ts';
import { recordBook } from './record-book.ts';

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

test('Bestes Gewicht, 1RM-Schätzung, meiste Wiederholungen und Anzahl je Übung', () => {
  const book = recordBook([
    w(1, 'bank', [[100, 10, true], [80, 8], [80, 10]]),
    w(2, 'bank', [[85, 5], [70, 12]]),
    w(3, 'liegestuetze', [[0, 25]]),
  ]);
  const bank = book.find((r) => r.exerciseId === 'bank');
  assert.deepEqual(bank?.best, { weightKg: 85, reps: 5, at: 2 });
  // Epley: 80 × (1 + 10/30) = 106,7 schlägt 85 × (1 + 5/30) = 99,2
  assert.deepEqual(bank?.oneRepMax, { kg: 106.7, at: 1 });
  assert.equal(bank?.maxReps, 12);
  assert.equal(bank?.sessions, 2);
  assert.equal(bank?.lastAt, 2);
  // Meist trainierte Übung zuerst
  assert.equal(book[0].exerciseId, 'bank');
  const push = book.find((r) => r.exerciseId === 'liegestuetze');
  assert.equal(push?.oneRepMax, null);
  assert.equal(push?.maxReps, 25);
});

test('Leerer Verlauf ergibt ein leeres Rekordbuch', () => {
  assert.deepEqual(recordBook([]), []);
});
