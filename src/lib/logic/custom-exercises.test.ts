import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Exercise } from '@/types/workout';

import {
  cleanExerciseName,
  createCustomExercise,
  CUSTOM_EXERCISE_LIMITS,
  exerciseUsage,
  isCustomExercise,
  validateCustomExercise,
} from './custom-exercises.ts';

const builtIn: Exercise = {
  id: 'bankdruecken',
  name: 'Bankdrücken',
  muscleGroup: 'Brust',
  equipment: 'Langhantel',
  difficulty: 'Fortgeschritten',
  instructions: '',
};

test('Name wird bereinigt und begrenzt', () => {
  assert.equal(cleanExerciseName('  Brust   presse  '), 'Brust presse');
  const exercise = createCustomExercise(
    { name: 'x'.repeat(80), muscleGroup: 'Brust', equipment: 'Maschine', instructions: '  Sitz  4 ' },
    1_700_000_000_000,
    0.5,
  );
  assert.equal(exercise.name.length, CUSTOM_EXERCISE_LIMITS.nameMax);
  assert.equal(exercise.instructions, 'Sitz 4');
  assert.equal(exercise.custom, true);
  assert.ok(isCustomExercise(exercise.id));
  assert.ok(!isCustomExercise('bankdruecken'));
});

test('Validierung: zu kurz, doppelt (ohne Groß/Klein), Obergrenze', () => {
  const input = { name: 'B', muscleGroup: 'Brust', equipment: 'Maschine' } as const;
  assert.match(validateCustomExercise(input, [builtIn]) ?? '', /Namen/);
  assert.match(validateCustomExercise({ ...input, name: ' bankDRÜCKEN ' }, [builtIn]) ?? '', /gibt es schon/);
  assert.equal(validateCustomExercise({ ...input, name: 'Brustpresse' }, [builtIn]), null);

  const many = Array.from({ length: CUSTOM_EXERCISE_LIMITS.maxCount }, (_, i) =>
    createCustomExercise({ name: `Übung ${i}`, muscleGroup: 'Brust', equipment: 'Maschine' }, i, 0),
  );
  assert.match(validateCustomExercise({ ...input, name: 'Noch eine' }, many) ?? '', /höchstens/);
});

test('IDs sind eindeutig, auch bei gleichem Zeitpunkt', () => {
  const a = createCustomExercise({ name: 'A b', muscleGroup: 'Beine', equipment: 'Maschine' }, 5, 0.1);
  const b = createCustomExercise({ name: 'A c', muscleGroup: 'Beine', equipment: 'Maschine' }, 5, 0.2);
  assert.notEqual(a.id, b.id);
});

test('Verwendung: Workouts, Vorlagen, laufendes Workout, Ziele', () => {
  const id = 'eigene-uebung-x';
  const empty = { history: [], templates: [], active: null, goals: [] };
  assert.equal(exerciseUsage(id, empty).used, false);

  const usage = exerciseUsage(id, {
    history: [{ exercises: [{ exerciseId: id }] }, { exercises: [{ exerciseId: 'kniebeuge' }] }, { exercises: [{ exerciseId: id }] }],
    templates: [{ exerciseIds: ['a', id] }],
    active: { exercises: [{ exerciseId: id }] },
    goals: [],
  });
  assert.deepEqual(usage, { workouts: 2, templates: 1, inActive: true, goal: false, used: true });
  assert.equal(exerciseUsage(id, { ...empty, goals: [{ exerciseId: id }] }).used, true);
});
