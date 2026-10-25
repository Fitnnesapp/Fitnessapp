import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { HomeSession } from '../../types/home.ts';
import type { RunSession } from '../../types/running.ts';
import type { StrengthWorkout } from '../../types/workout.ts';
import { buildFeed, dayPart, feedDayLabel, runTitle, strengthTitle } from './feed.ts';

const at = (y: number, m: number, d: number, h: number, min = 0) => new Date(y, m - 1, d, h, min).getTime();

const strength = (id: string, startedAt: number, sets: { weightKg: number; reps: number; isWarmup?: boolean }[], exerciseId = 'bank'): StrengthWorkout => ({
  id,
  type: 'strength',
  startedAt,
  endedAt: startedAt + 45 * 60_000,
  exercises: [{ exerciseId, sets: sets.map((s, i) => ({ id: `${id}-${i}`, rpe: null, isWarmup: false, ...s })) }],
});

const run = (id: string, startedAt: number, distanceM: number, durationSeconds: number): RunSession => ({
  id,
  type: 'running',
  startedAt,
  endedAt: startedAt + durationSeconds * 1000,
  distanceM,
  durationSeconds,
  elevationGainM: 12,
  bests: { k1: null, k5: null, k10: null },
  points: [],
});

const home = (id: string, startedAt: number): HomeSession => ({
  id,
  type: 'home',
  programId: 'hiit-1',
  startedAt,
  endedAt: startedAt + 20 * 60_000,
  activeSeconds: 1200,
  caloriesEstimate: 180,
  effort: null,
  completed: true,
});

const base = {
  muscleGroupOf: (id: string) => (id === 'bank' ? 'Brust' : id === 'dips' ? 'Trizeps' : undefined),
  programName: (id: string) => (id === 'hiit-1' ? 'HIIT Starter' : undefined),
};

test('Tageszeiten und Lauftitel wie bei Strava', () => {
  assert.equal(dayPart(at(2026, 10, 25, 7)), 'morgen');
  assert.equal(dayPart(at(2026, 10, 25, 12)), 'mittag');
  assert.equal(dayPart(at(2026, 10, 25, 16)), 'nachmittag');
  assert.equal(dayPart(at(2026, 10, 25, 19)), 'abend');
  assert.equal(dayPart(at(2026, 10, 25, 23)), 'nacht');
  assert.equal(dayPart(at(2026, 10, 25, 3)), 'nacht');
  assert.equal(runTitle(at(2026, 10, 25, 7)), 'Morgenlauf');
  assert.equal(runTitle(at(2026, 10, 25, 19, 30)), 'Abendlauf');
});

test('Krafttitel nennt die Muskelgruppen, sonst die Tageszeit', () => {
  assert.equal(strengthTitle(at(2026, 10, 25, 18), []), 'Krafttraining am Abend');
  assert.equal(strengthTitle(at(2026, 10, 25, 18), ['Brust', 'Brust']), 'Brust');
  assert.equal(strengthTitle(at(2026, 10, 25, 18), ['Brust', 'Trizeps']), 'Brust & Trizeps');
  assert.equal(strengthTitle(at(2026, 10, 25, 18), ['Brust', 'Trizeps', 'Schultern']), 'Brust, Trizeps & mehr');
});

test('Datum: Heute, Gestern, Wochentag, sonst Tag und Monat', () => {
  const now = at(2026, 10, 25, 9);
  assert.equal(feedDayLabel(at(2026, 10, 25, 7), now), 'Heute');
  assert.equal(feedDayLabel(at(2026, 10, 24, 22), now), 'Gestern');
  assert.equal(feedDayLabel(at(2026, 10, 21, 18), now), 'Mittwoch');
  assert.equal(feedDayLabel(at(2026, 10, 12, 18), now), '12. Oktober');
  assert.equal(feedDayLabel(at(2025, 12, 31, 18), now), '31. Dezember 2025');
});

test('Feed mischt alle Trainingsarten, neueste zuerst, und ist begrenzt', () => {
  const feed = buildFeed({
    ...base,
    strength: [strength('s1', at(2026, 10, 20, 18), [{ weightKg: 60, reps: 8 }])],
    home: [home('h1', at(2026, 10, 22, 7))],
    runs: [run('r1', at(2026, 10, 24, 19), 5000, 1500), run('r2', at(2026, 10, 18, 7), 3000, 1000)],
    limit: 3,
  });
  assert.deepEqual(
    feed.map((f) => f.id),
    ['r1', 'h1', 's1'],
  );
  const first = feed[0];
  assert.equal(first.kind, 'run');
  if (first.kind === 'run') {
    assert.equal(first.title, 'Abendlauf');
    assert.equal(first.paceSecPerKm, 300);
  }
  assert.equal(feed[1].title, 'HIIT Starter');
});

test('Kraftkarte zählt nur Arbeitssätze und erkennt Rekorde über den ganzen Verlauf', () => {
  const feed = buildFeed({
    ...base,
    // absichtlich neueste zuerst übergeben: Rekorde müssen trotzdem zeitlich richtig bestimmt werden
    strength: [
      strength('s2', at(2026, 10, 24, 18), [
        { weightKg: 40, reps: 10, isWarmup: true },
        { weightKg: 65, reps: 8 },
        { weightKg: 60, reps: 10 },
      ]),
      strength('s1', at(2026, 10, 20, 18), [{ weightKg: 60, reps: 8 }]),
    ],
    home: [],
    runs: [],
  });
  const latest = feed[0];
  assert.equal(latest.kind, 'strength');
  if (latest.kind === 'strength') {
    assert.equal(latest.title, 'Brust');
    assert.equal(latest.workingSets, 2);
    assert.equal(latest.volumeKg, 65 * 8 + 60 * 10);
    assert.equal(latest.recordCount, 2);
    assert.deepEqual(latest.exercises, [{ exerciseId: 'bank', sets: 2 }]);
  }
  const first = feed[1];
  assert.equal(first.kind === 'strength' && first.recordCount, 0);
});

test('Laufrekord: längste Strecke, der erste Lauf ist nur die Basis', () => {
  const feed = buildFeed({
    ...base,
    strength: [],
    home: [],
    runs: [run('r1', at(2026, 10, 10, 7), 5000, 1500), run('r2', at(2026, 10, 12, 7), 8000, 2600)],
  });
  const byId = new Map(feed.map((f) => [f.id, f]));
  const r2 = byId.get('r2');
  const r1 = byId.get('r1');
  assert.deepEqual(r2?.kind === 'run' && r2.records, ['longest_distance']);
  assert.deepEqual(r1?.kind === 'run' && r1.records, []);
});

test('leerer Verlauf ergibt einen leeren Feed', () => {
  assert.deepEqual(buildFeed({ ...base, strength: [], home: [], runs: [] }), []);
});
