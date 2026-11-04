import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatRaceTime, predictRaces, riegel, runBestsSummary } from './run-insights.ts';

const NOW = Date.UTC(2026, 10, 4);
const DAY = 86_400_000;

const run = (
  id: string,
  daysAgo: number,
  distanceM: number,
  durationSeconds: number,
  k5: number | null = null,
  k1: number | null = null,
) => ({
  id,
  startedAt: NOW - daysAgo * DAY,
  distanceM,
  durationSeconds,
  bests: { k1, k5, k10: null },
});

test('Bestzeiten und Summen über alle Läufe', () => {
  const summary = runBestsSummary([run('a', 1, 5200, 1700, 1600, 300), run('b', 5, 8000, 2800, 1650, 290)]);
  assert.deepEqual(summary, { k1: 290, k5: 1600, k10: null, longestM: 8000, totalM: 13200, count: 2 });
  assert.deepEqual(runBestsSummary([]), { k1: null, k5: null, k10: null, longestM: 0, totalM: 0, count: 0 });
});

test('Riegel: doppelte Strecke kostet etwas mehr als doppelte Zeit', () => {
  // 25:00 auf 5 km → 10 km ≈ 52:07
  assert.equal(Math.round(riegel(1500, 5000, 10000)), 3127);
});

test('Prognose nutzt den stärksten Lauf der letzten 120 Tage', () => {
  const prediction = predictRaces(
    [run('alt', 200, 5000, 1200, 1200), run('schwach', 3, 5000, 1800, 1800), run('stark', 10, 6000, 1860, 1500)],
    NOW,
  );
  assert.ok(prediction);
  assert.equal(prediction.basis.runId, 'stark');
  assert.equal(prediction.basis.meters, 5000);
  assert.deepEqual(
    prediction.races.map((race) => race.label),
    ['5 km', '10 km', 'Halbmarathon', 'Marathon'],
  );
  assert.equal(prediction.races[0].seconds, 1500);
});

test('Zu kurze Läufe ergeben keine Prognose, große Sprünge werden ausgelassen', () => {
  assert.equal(predictRaces([run('kurz', 1, 2000, 600)], NOW), null);
  const prediction = predictRaces([run('a', 1, 3000, 900)], NOW);
  // 3 km × 9 = 27 km: Marathon fällt weg
  assert.deepEqual(
    prediction?.races.map((race) => race.label),
    ['5 km', '10 km', 'Halbmarathon'],
  );
});

test('Zeitformat', () => {
  assert.equal(formatRaceTime(1500), '25:00');
  assert.equal(formatRaceTime(6727), '1:52:07');
});
