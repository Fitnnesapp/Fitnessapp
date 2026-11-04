import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cleanNote, finalizeDraft } from './draft.ts';
import { displayToKg, formatWeight, kgToDisplay, parseNumber } from './units.ts';
import { compactSets, exerciseLog, exerciseProgress, lastWorkingSet, recentExerciseIds, summarizeWorkout } from './workout-stats.ts';

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

test('Fortschritt enthält geschätztes 1RM und Volumen ohne Aufwärmsätze', () => {
  const [first] = exerciseProgress(history, 'bank');
  // 55 kg × 8: Epley 55 × (1 + 8/30) = 69,7
  assert.equal(first.oneRepMaxKg, 69.7);
  assert.equal(first.volumeKg, 440);
});

test('lastWorkingSet findet den letzten Arbeitssatz des neuesten Workouts', () => {
  assert.equal(lastWorkingSet(history, 'bank')?.weightKg, 65);
  assert.equal(lastWorkingSet(history, 'unbekannt'), null);
});

test('Notiz: wird gekürzt übernommen, leere Notiz entfällt', () => {
  assert.equal(finalizeDraft({ ...draft, note: '  Schulter zwickt  ' }, 'metric', 61000).note, 'Schulter zwickt');
  assert.equal('note' in finalizeDraft({ ...draft, note: '   ' }, 'metric', 61000), false);
  assert.equal(cleanNote('x'.repeat(600))?.length, 500);
  assert.equal(cleanNote(undefined), undefined);
});

test('Übungsverlauf: neueste zuerst, ohne Aufwärmsätze, begrenzt', () => {
  const set = (id: string, weightKg: number, reps: number, isWarmup = false) => ({ id, weightKg, reps, rpe: null, isWarmup });
  const workout = (id: string, startedAt: number, exerciseId: string, sets: ReturnType<typeof set>[]) => ({
    id,
    type: 'strength' as const,
    startedAt,
    endedAt: startedAt + 1,
    exercises: [{ exerciseId, sets }],
  });
  const history = [
    workout('a', 100, 'bank', [set('1', 40, 10, true), set('2', 80, 8), set('3', 80, 7)]),
    workout('b', 300, 'bank', [set('4', 82.5, 6)]),
    workout('c', 200, 'kniebeuge', [set('5', 100, 5)]),
    workout('d', 400, 'bank', [set('6', 20, 10, true)]),
  ];
  const log = exerciseLog(history, 'bank');
  assert.deepEqual(
    log.map((entry) => entry.workoutId),
    ['b', 'a'],
  );
  assert.equal(log[1].warmups, 1);
  assert.equal(log[1].volumeKg, 80 * 8 + 80 * 7);
  assert.equal(exerciseLog(history, 'bank', 1).length, 1);
});

test('Sätze kompakt: gleiche Gewichte gebündelt, ohne Gewicht als Wiederholungen', () => {
  const kg = (value: number) => formatWeight(value, 'metric');
  assert.equal(
    compactSets(
      [
        { weightKg: 80, reps: 8 },
        { weightKg: 80, reps: 8 },
        { weightKg: 85, reps: 5 },
        { weightKg: 80, reps: 10 },
      ],
      kg,
    ),
    '80 kg × 8, 8 · 85 kg × 5 · 80 kg × 10',
  );
  assert.equal(compactSets([{ weightKg: 0, reps: 12 }, { weightKg: 0, reps: 10 }], kg), '12, 10 Wdh.');
});

test('Zuletzt trainierte Übungen: neueste zuerst, ohne Doppelte und Ausgeschlossene', () => {
  const workout = (id: string, startedAt: number, ids: string[]) => ({
    id,
    type: 'strength' as const,
    startedAt,
    endedAt: startedAt,
    exercises: ids.map((exerciseId) => ({ exerciseId, sets: [] })),
  });
  const history = [workout('a', 1, ['bank', 'rudern']), workout('b', 2, ['kniebeuge', 'bank'])];
  assert.deepEqual(recentExerciseIds(history), ['kniebeuge', 'bank', 'rudern']);
  assert.deepEqual(recentExerciseIds(history, 2), ['kniebeuge', 'bank']);
  assert.deepEqual(recentExerciseIds(history, 8, ['bank']), ['kniebeuge', 'rudern']);
});
