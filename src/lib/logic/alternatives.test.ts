import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Exercise } from '../../types/workout.ts';
import { alternativesFor } from './alternatives.ts';

const ex = (
  id: string,
  muscleGroup: Exercise['muscleGroup'],
  equipment: Exercise['equipment'],
  difficulty: Exercise['difficulty'],
): Exercise => ({
  id,
  name: id,
  muscleGroup,
  equipment,
  difficulty,
  instructions: '',
});

const ALL = [
  ex('bank', 'Brust', 'Langhantel', 'Fortgeschritten'),
  ex('schraeg', 'Brust', 'Langhantel', 'Fortgeschritten'),
  ex('khbank', 'Brust', 'Kurzhantel', 'Einsteiger'),
  ex('dips', 'Brust', 'Körpergewicht', 'Fortgeschritten'),
  ex('butterfly', 'Brust', 'Maschine', 'Einsteiger'),
  ex('rudern', 'Rücken', 'Langhantel', 'Fortgeschritten'),
];

test('Gleiche Muskelgruppe, anderes Gerät und gleiches Niveau zuerst', () => {
  const result = alternativesFor(ALL[0], ALL).map((e) => e.id);
  assert.deepEqual(result, ['dips', 'butterfly', 'khbank', 'schraeg']);
});

test('Nie die Übung selbst oder andere Muskelgruppen, Limit greift', () => {
  const result = alternativesFor(ALL[5], ALL);
  assert.deepEqual(result, []);
  assert.equal(alternativesFor(ALL[0], ALL, 2).length, 2);
});
