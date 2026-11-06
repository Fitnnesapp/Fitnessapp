import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Program } from '../../types/home.ts';
import { quickestProgram } from './quick-win.ts';

const program = (id: string, workSeconds: number, rounds: number, difficulty: Program['difficulty'] = 'Einsteiger'): Program => ({
  id,
  name: id,
  description: '',
  category: 'HIIT',
  difficulty,
  workSeconds,
  restSeconds: 0,
  rounds,
  steps: [{ name: 'Übung', instruction: '' }],
});

test('wählt die kürzeste erlaubte Einheit', () => {
  const programs = [program('lang', 600, 2), program('kurz', 300, 1), program('premium', 60, 1)];
  const result = quickestProgram(programs, (id) => id !== 'premium');
  assert.equal(result?.program.id, 'kurz');
  assert.equal(result?.minutes, 5);
});

test('bei gleicher Dauer gewinnt die Einsteiger-Einheit', () => {
  const programs = [program('profi', 300, 1, 'Fortgeschritten'), program('einsteiger', 300, 1, 'Einsteiger')];
  assert.equal(quickestProgram(programs, () => true)?.program.id, 'einsteiger');
});

test('ohne erlaubte Einheit gibt es keinen Vorschlag', () => {
  assert.equal(quickestProgram([program('a', 300, 1)], () => false), null);
  assert.equal(quickestProgram([], () => true), null);
});
