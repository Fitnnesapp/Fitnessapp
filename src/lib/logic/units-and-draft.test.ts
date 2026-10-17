import assert from 'node:assert/strict';
import { test } from 'node:test';

import { finalizeDraft } from './draft.ts';
import { displayToKg, formatWeight, kgToDisplay, parseNumber } from './units.ts';
import { exerciseProgress, lastWorkingSet, summarizeWorkout } from './workout-stats.ts';

test('parseNumber akzeptiert Komma und Punkt', () => {
  assert.equal(parseNumber('7,5'), 7.5);
  assert.equal(parseNumber('7.5'), 7.5);
  assert.equal(parseNumber(''), null);
  assert.equal(parseNumber('abc'), null);
  assert.equal(parseNumber('-3'), null);
});

test('Einheiten rechnen hin und zurück ohne Drift', () => {
  const lb = kgToDisplay(100, 'imperial');
  assert.equal(lb, 220.46);
  assert.equal(displayToKg(220.46, 'imperial'), 100);
  assert.equal(formatWeight(62.5, 'metric'), '62,5 kg');
});

const draft = {
  id: 'w1',
  startedAt: 1000,
  exercises: [
    {
      exerciseId: 'bank',
      sets: [
        { id: 's1', weight: '60', reps: '8', rpe: '8', isWarmup: false, done: true },
        { id: 's2', weight: '60', reps: '', rpe: '', isWarmup: false, done: true },
        { id: 's3', weight: '60', reps: '8', rpe: '', isWarmup: false, done: false },
        { id: 's4', weight: '', reps: '12', rpe: '', isWarmup: true, done: true },
      ],
    },
    { exerciseId: 'kniebeuge', sets: [{ id: 's5', weight: '80', reps: '5', rpe: '', isWarmup: false, done: false }] },
  ],
};

test('finalizeDraft übernimmt nur erledigte, gültige Sätze', () => {
  const workout = finalizeDraft(draft, 'metric', 5000);
  assert.equal(workout.exercises.length, 1);
  assert.deepEqual(
    workout.exercises[0].sets.map((s) => s.id),
    ['s1', 's4'],
  );
  assert.equal(workout.exercises[0].sets[1].weightKg, 0);
});

test('Gewicht wird in kg gespeichert, auch wenn in lb eingegeben', () => {
  const workout = finalizeDraft(draft, 'imperial', 5000);
  assert.equal(workout.exercises[0].sets[0].weightKg, 27.22);
});

test('Zusammenfassung: Volumen ohne Aufwärmsätze, Dauer, Muskelgruppen', () => {
  const workout = finalizeDraft(draft, 'metric', 61000);
  const summary = summarizeWorkout(workout, () => 'Brust');
  assert.equal(summary.volumeKg, 480);
  assert.equal(summary.workingSets, 1);
  assert.equal(summary.durationMs, 60000);
  assert.deepEqual(summary.muscleGroups, ['Brust']);
});

const history = [3, 1, 2].map((n) => ({
  id: `w${n}`,
  type: 'strength' as const,
  startedAt: n * 1000,
  endedAt: n * 1000 + 100,
  exercises: [
    {
      exerciseId: 'bank',
      sets: [
        { id: `a${n}`, weightKg: 50 + n * 5, reps: 8, rpe: null, isWarmup: false },
        { id: `b${n}`, weightKg: 20, reps: 12, rpe: null, isWarmup: true },
      ],
    },
  ],
}));

test('Fortschritt liefert das Höchstgewicht je Workout, zeitlich sortiert', () => {
  const points = exerciseProgress(history, 'bank');
  assert.deepEqual(
    points.map((p) => p.maxWeightKg),
    [55, 60, 65],
  );
});

test('lastWorkingSet findet den letzten Arbeitssatz des neuesten Workouts', () => {
  assert.equal(lastWorkingSet(history, 'bank')?.weightKg, 65);
  assert.equal(lastWorkingSet(history, 'unbekannt'), null);
});
