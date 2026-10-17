import assert from 'node:assert/strict';
import { test } from 'node:test';

import { estimateCalories } from './calories.ts';
import { activeSecondsAt, buildTimeline, exerciseCount, locate, programMinutes, totalSeconds } from './timeline.ts';

const step = (name: string, seconds?: number) => ({ name, instruction: '', seconds });

const program = {
  id: 'p',
  name: 'Test',
  description: '',
  category: 'HIIT' as const,
  difficulty: 'Einsteiger' as const,
  workSeconds: 30,
  restSeconds: 10,
  rounds: 2,
  steps: [step('A'), step('B', 20)],
};

test('Ablauf: Vorbereitung, Übungen mit Pausen, keine Pause nach der letzten Übung', () => {
  const timeline = buildTimeline(program);
  assert.deepEqual(
    timeline.map((s) => `${s.kind}:${s.seconds}`),
    ['prepare:5', 'work:30', 'rest:10', 'work:20', 'rest:10', 'work:30', 'rest:10', 'work:20'],
  );
  assert.equal(timeline.at(-1)?.kind, 'work');
});

test('Pause kündigt die nächste Übung an, auch beim Rundenwechsel', () => {
  const timeline = buildTimeline(program);
  const rests = timeline.filter((s) => s.kind === 'rest').map((s) => s.step.name);
  assert.deepEqual(rests, ['B', 'A', 'B']);
});

test('Übungsindex zählt über alle Runden', () => {
  const works = buildTimeline(program).filter((s) => s.kind === 'work');
  assert.deepEqual(
    works.map((s) => s.exerciseIndex),
    [0, 1, 2, 3],
  );
  assert.equal(exerciseCount(program), 4);
});

test('Gesamtdauer und Minutenangabe', () => {
  assert.equal(totalSeconds(buildTimeline(program)), 135);
  // 130 s ohne Vorbereitung
  assert.equal(programMinutes(program), 2);
});

test('locate findet den Abschnitt zur verstrichenen Zeit', () => {
  const timeline = buildTimeline(program);
  assert.equal(locate(timeline, 0)?.segment.kind, 'prepare');
  assert.equal(locate(timeline, 4999)?.index, 0);
  assert.equal(locate(timeline, 5000)?.segment.kind, 'work');
  assert.equal(locate(timeline, 5000)?.remainingMs, 30000);
  assert.equal(locate(timeline, 36000)?.segment.kind, 'rest');
  assert.equal(locate(timeline, 134999)?.segment.kind, 'work');
  assert.equal(locate(timeline, 135000), null);
});

test('Springt die Uhr weiter (z.B. nach gesperrtem Bildschirm), stimmt die Position trotzdem', () => {
  const timeline = buildTimeline(program);
  const position = locate(timeline, 100000);
  assert.equal(position?.segment.kind, 'work');
  assert.equal(position?.segment.exerciseIndex, 2);
});

test('trainierte Sekunden ohne Vorbereitung und begrenzt auf die Gesamtdauer', () => {
  const timeline = buildTimeline(program);
  assert.equal(activeSecondsAt(timeline, 3000), 0);
  assert.equal(activeSecondsAt(timeline, 65000), 60);
  assert.equal(activeSecondsAt(timeline, 999999), 130);
});

test('Kalorienschätzung nach MET-Formel', () => {
  // HIIT: 8 MET × 70 kg × 0,5 h = 280
  assert.equal(estimateCalories('HIIT', 1800, 70), 280);
  assert.equal(estimateCalories('HIIT', 1800, null), 280);
  assert.equal(estimateCalories('Mobility', 3600, 80), 200);
  assert.equal(estimateCalories('Core', -5, 70), 0);
});
