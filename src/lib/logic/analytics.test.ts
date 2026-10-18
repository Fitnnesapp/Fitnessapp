import assert from 'node:assert/strict';
import { test } from 'node:test';

import { muscleVolume } from './analytics.ts';

const DAY = 86400000;
const NOW = 1_800_000_000_000;

const workout = (id: string, daysAgo: number, exerciseId: string, sets: [number, number, boolean?][]) => ({
  id,
  type: 'strength' as const,
  startedAt: NOW - daysAgo * DAY,
  endedAt: NOW - daysAgo * DAY + 1000,
  exercises: [
    {
      exerciseId,
      sets: sets.map(([weightKg, reps, isWarmup], i) => ({
        id: `${id}-${i}`,
        weightKg,
        reps,
        rpe: null,
        isWarmup: isWarmup ?? false,
      })),
    },
  ],
});

const groupOf = (id: string) => ({ bank: 'Brust', kniebeuge: 'Beine' })[id as 'bank' | 'kniebeuge'];

test('Volumen je Muskelgruppe, absteigend, ohne Aufwärmsätze', () => {
  const result = muscleVolume(
    [
      workout('a', 1, 'bank', [[60, 10], [100, 10, true]]),
      workout('b', 2, 'kniebeuge', [[100, 10]]),
      workout('c', 3, 'bank', [[50, 10]]),
    ],
    30,
    NOW,
    groupOf,
  );
  assert.deepEqual(result, [
    { group: 'Brust', volumeKg: 1100 },
    { group: 'Beine', volumeKg: 1000 },
  ]);
});

test('nur Workouts im Zeitfenster zählen', () => {
  const result = muscleVolume([workout('alt', 40, 'bank', [[60, 10]]), workout('neu', 5, 'bank', [[60, 5]])], 30, NOW, groupOf);
  assert.deepEqual(result, [{ group: 'Brust', volumeKg: 300 }]);
});

test('unbekannte Übungen werden übersprungen', () => {
  assert.deepEqual(muscleVolume([workout('a', 1, 'unbekannt', [[60, 10]])], 30, NOW, groupOf), []);
});
