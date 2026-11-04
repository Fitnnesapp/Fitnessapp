import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { StrengthWorkout } from '../../types/workout.ts';
import { compareWithPrevious } from './compare.ts';

const w = (id: string, startedAt: number, exercises: Record<string, [number, number][]>): StrengthWorkout => ({
  id,
  type: 'strength',
  startedAt,
  endedAt: startedAt + 1,
  exercises: Object.entries(exercises).map(([exerciseId, sets]) => ({
    exerciseId,
    sets: sets.map(([weightKg, reps], i) => ({ id: `${id}-${exerciseId}-${i}`, weightKg, reps, rpe: null, isWarmup: false })),
  })),
});

test('Vergleicht mit dem jüngsten ähnlichen Workout, nur gemeinsame Übungen', () => {
  const history = [
    w('alt', 1, { bank: [[60, 10]], rudern: [[50, 10]] }),
    w('beine', 2, { kniebeuge: [[100, 5]] }),
    w('neu', 3, { bank: [[65, 10]], rudern: [[50, 12]], curls: [[20, 10]] }),
  ];
  const result = compareWithPrevious(history, 'neu');
  assert.equal(result?.previous.id, 'alt');
  // vorher 600 + 500 = 1100, jetzt 650 + 600 = 1250 (Curls zählen nicht)
  assert.equal(result?.volumeDeltaKg, 150);
  assert.equal(result?.volumePct, 14);
  assert.deepEqual(
    result?.exercises.sort((a, b) => a.exerciseId.localeCompare(b.exerciseId)),
    [
      { exerciseId: 'bank', topKgDelta: 5, repsDelta: 0 },
      { exerciseId: 'rudern', topKgDelta: 0, repsDelta: 2 },
    ],
  );
});

test('Ohne ähnliches früheres Workout gibt es keinen Vergleich', () => {
  const history = [w('a', 1, { kniebeuge: [[100, 5]] }), w('b', 2, { bank: [[60, 10]], rudern: [[50, 10]] })];
  assert.equal(compareWithPrevious(history, 'b'), null);
  assert.equal(compareWithPrevious(history, 'gibtsnicht'), null);
  // Späteres Workout zählt nicht als Vergleich
  assert.equal(compareWithPrevious([w('x', 5, { bank: [[1, 1]] }), w('y', 1, { bank: [[1, 1]] })], 'y'), null);
});
