import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { HomeSession } from '../../types/home.ts';
import type { RunSession } from '../../types/running.ts';
import type { StrengthWorkout } from '../../types/workout.ts';
import { draftFromWorkout, repeatOptions } from './repeat.ts';

const strength = (id: string, startedAt: number, exerciseIds: string[]): StrengthWorkout => ({
  id,
  type: 'strength',
  startedAt,
  endedAt: startedAt + 1,
  exercises: exerciseIds.map((exerciseId) => ({
    exerciseId,
    sets: [
      { id: `${id}-${exerciseId}-w`, weightKg: 40, reps: 10, rpe: null, isWarmup: true },
      { id: `${id}-${exerciseId}-1`, weightKg: 60, reps: 8, rpe: 8, isWarmup: false },
    ],
  })),
});

const home = (id: string, startedAt: number, programId: string): HomeSession => ({
  id,
  type: 'home',
  programId,
  startedAt,
  endedAt: startedAt + 1,
  activeSeconds: 600,
  caloriesEstimate: 80,
  effort: null,
  completed: true,
});

const run = (id: string, startedAt: number): RunSession => ({
  id,
  type: 'running',
  startedAt,
  endedAt: startedAt + 1,
  distanceM: 5000,
  durationSeconds: 1500,
  elevationGainM: 0,
  bests: { k1: null, k5: null, k10: null },
  points: [],
});

test('neueste zuerst, gleiche Einheiten nur einmal, begrenzt', () => {
  const options = repeatOptions(
    [strength('s1', 10, ['bank', 'dips']), strength('s2', 50, ['bank', 'dips']), strength('s3', 20, ['kniebeuge'])],
    [home('h1', 40, 'hiit'), home('h2', 30, 'hiit')],
    [run('r1', 60), run('r2', 5)],
    4,
  );
  assert.deepEqual(
    options.map((o) => (o.kind === 'strength' ? o.workoutId : o.kind === 'home' ? o.programId : 'run')),
    ['run', 's2', 'hiit', 's3'],
  );
});

test('Kraftoption nennt Übungen und Satzanzahl', () => {
  const [option] = repeatOptions([strength('s1', 10, ['bank', 'dips'])], [], []);
  assert.deepEqual(option, { kind: 'strength', workoutId: 's1', at: 10, exerciseIds: ['bank', 'dips'], sets: 4 });
});

test('Standardgrenze sind drei Einträge, leere Workouts zählen nicht', () => {
  const empty: StrengthWorkout = { id: 'leer', type: 'strength', startedAt: 99, endedAt: 100, exercises: [] };
  const options = repeatOptions(
    [empty, strength('a', 1, ['a']), strength('b', 2, ['b']), strength('c', 3, ['c']), strength('d', 4, ['d'])],
    [],
    [],
  );
  assert.equal(options.length, 3);
  assert.ok(options.every((o) => o.kind === 'strength' && o.workoutId !== 'leer'));
});

test('Entwurf übernimmt Sätze, Gewichte und Aufwärmsätze, aber nichts ist abgehakt', () => {
  let n = 0;
  const draft = draftFromWorkout(strength('s1', 10, ['bank']), 'metric', () => `id${++n}`);
  assert.deepEqual(draft, [
    {
      exerciseId: 'bank',
      sets: [
        { id: 'id1', weight: '40', reps: '10', rpe: '', isWarmup: true, done: false },
        { id: 'id2', weight: '60', reps: '8', rpe: '', isWarmup: false, done: false },
      ],
    },
  ]);
});

test('Körpergewicht bleibt leer, imperial wird umgerechnet', () => {
  const workout: StrengthWorkout = {
    id: 'x',
    type: 'strength',
    startedAt: 1,
    endedAt: 2,
    exercises: [
      {
        exerciseId: 'klimmzug',
        sets: [
          { id: 'a', weightKg: 0, reps: 10, rpe: null, isWarmup: false },
          { id: 'b', weightKg: 20, reps: 5, rpe: null, isWarmup: false },
        ],
      },
    ],
  };
  const draft = draftFromWorkout(workout, 'imperial', () => 'id');
  assert.equal(draft[0].sets[0].weight, '');
  assert.notEqual(draft[0].sets[1].weight, '20');
  assert.ok(Number(draft[0].sets[1].weight) > 40);
});
