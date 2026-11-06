import assert from 'node:assert/strict';
import { test } from 'node:test';

import { pendingHealthExports } from './health-export.ts';

const sources = {
  strength: [{ id: 's1', startedAt: 100, endedAt: 200 }],
  home: [
    { id: 'h1', startedAt: 300, endedAt: 400, category: 'HIIT' as const, caloriesEstimate: 120 },
    { id: 'h2', startedAt: 500, endedAt: 600, category: undefined, caloriesEstimate: 0 },
  ],
  gps: [
    { id: 'r1', startedAt: 50, endedAt: 90, distanceM: 5000, points: [] },
    { id: 'b1', startedAt: 700, endedAt: 900, distanceM: 20000, sport: 'ride' as const, points: [] },
    { id: 'kaputt', startedAt: 950, endedAt: 950, distanceM: 10, points: [] },
  ],
};

test('Abbildung auf Health-Workouttypen, sortiert, ohne leere Einheiten', () => {
  const pending = pendingHealthExports(sources, {}, 0);
  assert.deepEqual(
    pending.map((e) => [e.id, e.kind]),
    [
      ['r1', 'running'],
      ['s1', 'traditionalStrengthTraining'],
      ['h1', 'highIntensityIntervalTraining'],
      ['h2', 'functionalStrengthTraining'],
      ['b1', 'cycling'],
    ],
  );
  assert.equal(pending.find((e) => e.id === 'h1')?.energyKcal, 120);
  assert.equal(pending.find((e) => e.id === 'h2')?.energyKcal, undefined);
  assert.equal(pending.find((e) => e.id === 'b1')?.distanceM, 20000);
});

test('Keine Duplikate und nur Einheiten ab dem Verbinden', () => {
  const pending = pendingHealthExports(sources, { s1: 1, b1: 2 }, 250);
  assert.deepEqual(
    pending.map((e) => e.id),
    ['h1', 'h2'],
  );
});
