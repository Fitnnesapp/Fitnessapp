import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { MuscleGroup, Routine, StrengthWorkout } from '../../types/workout.ts';
import {
  lastTrainedByMuscle,
  preferencesFromPlan,
  routineMinutes,
  routineMuscles,
  routineSetCount,
  suggestRoutine,
  targetReps,
} from './routines.ts';

const MUSCLES: Record<string, MuscleGroup> = {
  bank: 'Brust',
  rudern: 'Rücken',
  kniebeuge: 'Beine',
  seitheben: 'Schultern',
};
const muscleOf = (id: string) => MUSCLES[id];

const routine = (id: string, items: [string, number][], extra: Partial<Routine> = {}): Routine => ({
  id,
  name: id,
  description: '',
  focus: 'Ganzkörper',
  setting: 'Studio',
  difficulty: 'Einsteiger',
  items: items.map(([exerciseId, sets]) => ({ exerciseId, sets, reps: '8–10', restSeconds: 80 })),
  ...extra,
});

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 10, 4, 10);

const workout = (startedAt: number, exerciseIds: string[], warmupOnly = false): StrengthWorkout => ({
  id: String(startedAt),
  type: 'strength',
  startedAt,
  endedAt: startedAt + 3_600_000,
  exercises: exerciseIds.map((exerciseId) => ({
    exerciseId,
    sets: [{ id: `${startedAt}-${exerciseId}`, weightKg: 50, reps: 8, rpe: null, isWarmup: warmupOnly }],
  })),
});

test('Dauer: Sätze mal (Arbeit + Pause) plus Rüstzeit, auf 5 Minuten gerundet', () => {
  // 2 Übungen à 5 Sätze: 10 × 120 s + 2 × 60 s = 1320 s = 22 min → 20
  assert.equal(routineMinutes(routine('a', [['bank', 5], ['rudern', 5]])), 20);
  // sehr kurz → mindestens 10
  assert.equal(routineMinutes(routine('b', [['bank', 1]])), 10);
});

test('Satzanzahl summiert alle Übungen', () => {
  assert.equal(routineSetCount(routine('a', [['bank', 3], ['rudern', 4]])), 7);
});

test('Zielwiederholungen: untere Grenze, auch mit Sekunden und Zusatztext', () => {
  assert.equal(targetReps('8–10'), 8);
  assert.equal(targetReps('30–45 s'), 30);
  assert.equal(targetReps('10 je Bein'), 10);
  assert.equal(targetReps('5'), 5);
  assert.equal(targetReps('max'), null);
});

test('Muskelgruppen nach Sätzen sortiert, unbekannte Übungen ignoriert', () => {
  const r = routine('a', [['bank', 2], ['rudern', 4], ['bank', 3], ['unbekannt', 5]]);
  assert.deepEqual(routineMuscles(r, muscleOf), [
    { muscle: 'Brust', sets: 5 },
    { muscle: 'Rücken', sets: 4 },
  ]);
});

test('Zuletzt trainiert zählt nur Arbeitssätze', () => {
  const last = lastTrainedByMuscle([workout(NOW - 2 * DAY, ['bank']), workout(NOW - DAY, ['rudern'], true)], muscleOf);
  assert.equal(last.get('Brust'), NOW - 2 * DAY);
  assert.equal(last.has('Rücken'), false);
});

test('Vorschlag wählt die am besten erholten Hauptmuskeln', () => {
  const push = routine('push', [['bank', 4], ['seitheben', 3]]);
  const legs = routine('legs', [['kniebeuge', 5]]);
  const history = [workout(NOW - DAY, ['kniebeuge']), workout(NOW - 4 * DAY, ['bank', 'seitheben'])];
  const suggestion = suggestRoutine([legs, push], history, NOW, muscleOf);
  assert.equal(suggestion?.routine.id, 'push');
  assert.match(suggestion?.reason ?? '', /seit 4 Tagen erholt/);
  assert.match(suggestion?.reason ?? '', /Brust und Schultern sind/);
});

test('Ohne Verlauf: erstes Workout mit Startbegründung', () => {
  const suggestion = suggestRoutine([routine('a', [['bank', 3]]), routine('b', [['rudern', 3]])], [], NOW, muscleOf);
  assert.equal(suggestion?.routine.id, 'a');
  assert.match(suggestion?.reason ?? '', /guter Start/);
});

test('Nie trainierte Muskeln werden als neuer Reiz begründet', () => {
  const suggestion = suggestRoutine(
    [routine('brust', [['bank', 3]]), routine('beine', [['kniebeuge', 3]])],
    [workout(NOW - DAY, ['bank'])],
    NOW,
    muscleOf,
  );
  assert.equal(suggestion?.routine.id, 'beine');
  assert.match(suggestion?.reason ?? '', /Neuer Reiz: Beine/);
});

test('Ort und Niveau filtern, fallen aber nie ins Leere', () => {
  const studio = routine('studio', [['bank', 3]]);
  const home = routine('home', [['rudern', 3]], { setting: 'Zuhause' });
  const hard = routine('hard', [['kniebeuge', 3]], { setting: 'Zuhause', difficulty: 'Fortgeschritten' });
  assert.equal(suggestRoutine([studio, home, hard], [], NOW, muscleOf, { setting: 'Zuhause', difficulty: 'Einsteiger' })?.routine.id, 'home');
  // Kein Workout für den Ort: alle Workouts sind erlaubt
  assert.equal(suggestRoutine([studio], [], NOW, muscleOf, { setting: 'Zuhause' })?.routine.id, 'studio');
  assert.equal(suggestRoutine([], [], NOW, muscleOf), null);
});

test('Plan-Antworten werden zu Vorschlags-Vorlieben', () => {
  assert.deepEqual(preferencesFromPlan(undefined), {});
  assert.deepEqual(preferencesFromPlan({ places: ['zuhause', 'draussen'], level: 'einsteiger' }), {
    setting: 'Zuhause',
    difficulty: 'Einsteiger',
  });
  assert.deepEqual(preferencesFromPlan({ places: ['studio', 'zuhause'], level: 'fortgeschritten' }), {
    setting: undefined,
    difficulty: undefined,
  });
});

test('Rumpf-Workouts werden nur ohne Alternative vorgeschlagen, Begründung nennt nur erholte Muskeln', () => {
  const core = routine('core', [['seitheben', 6]], { focus: 'Rumpf' });
  const push = routine('push', [['bank', 3], ['rudern', 3]]);
  const history = [workout(NOW - 3 * DAY, ['bank']), workout(NOW - 2 * 3_600_000, ['rudern'])];
  const suggestion = suggestRoutine([core, push], history, NOW, muscleOf);
  assert.equal(suggestion?.routine.id, 'push');
  assert.equal(suggestion?.reason, 'Brust ist seit 3 Tagen erholt und bereit.');
  assert.equal(suggestRoutine([core], history, NOW, muscleOf)?.routine.id, 'core');
});
