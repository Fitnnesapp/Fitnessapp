import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { RunSession } from '../../types/running.ts';
import type { StrengthWorkout } from '../../types/workout.ts';
import { memberSince, monthYear, personalBests } from './personal-bests.ts';

const workout = (id: string, at: number, exerciseId: string, sets: [number, number, boolean?][]): StrengthWorkout => ({
  id,
  type: 'strength',
  startedAt: at,
  endedAt: at + 1,
  exercises: [{ exerciseId, sets: sets.map(([w, r, warm], i) => ({ id: `${id}${i}`, weightKg: w, reps: r, rpe: null, isWarmup: !!warm })) }],
});

const run = (id: string, at: number, distanceM: number, k1: number | null, k5: number | null): RunSession => ({
  id,
  type: 'running',
  startedAt: at,
  endedAt: at + 1,
  distanceM,
  durationSeconds: 1,
  elevationGainM: 0,
  bests: { k1, k5, k10: null },
  points: [],
});

test('ohne Training gibt es keine Bestleistungen', () => {
  assert.deepEqual(personalBests([], []), { heaviest: null, longestRun: null, fastest1k: null, fastest5k: null });
  assert.equal(memberSince([]), null);
});

test('schwerstes Gewicht ohne Aufwärmsätze, bei Gleichstand mehr Wiederholungen', () => {
  const bests = personalBests(
    [
      workout('a', 1, 'kniebeuge', [[140, 1, true], [100, 5]]),
      workout('b', 2, 'bank', [[100, 8]]),
      workout('c', 3, 'klimmzug', [[0, 12]]),
    ],
    [],
  );
  assert.deepEqual(bests.heaviest, { exerciseId: 'bank', weightKg: 100, reps: 8, at: 2 });
});

test('Laufbestwerte: längste Strecke und schnellste Zeiten', () => {
  const bests = personalBests([], [run('a', 1, 5000, 290, 1500), run('b', 2, 10000, 300, 1560), run('c', 3, 3000, 270, null)]);
  assert.deepEqual(bests.longestRun, { distanceM: 10000, at: 2 });
  assert.deepEqual(bests.fastest1k, { seconds: 270, at: 3 });
  assert.deepEqual(bests.fastest5k, { seconds: 1500, at: 1 });
});

test('Dabei seit: erste Einheit, Monat und Jahr auf Deutsch', () => {
  const at = new Date(2026, 2, 14).getTime();
  assert.equal(memberSince([{ id: 'x', type: 'home', startedAt: at + 5, durationSeconds: 1, distanceM: 0 }, { id: 'y', type: 'home', startedAt: at, durationSeconds: 1, distanceM: 0 }]), at);
  assert.equal(monthYear(at), 'März 2026');
});
