import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Activity } from './activity.ts';
import { suggestWorkout } from './suggestions.ts';

const DAY = 86400000;
const NOW = new Date(2026, 9, 18, 10).getTime();
const ago = (days: number) => NOW - days * DAY;

const act = (id: string, startedAt: number, type: Activity['type'] = 'home'): Activity => ({
  id,
  type,
  startedAt,
  durationSeconds: 1800,
  distanceM: type === 'running' ? 5000 : 0,
});

const groupOf = (id: string) => ({ bank: 'Brust', rudern: 'Rücken', kniebeuge: 'Beine', druecken: 'Schultern' })[id as 'bank'];

const lift = (id: string, daysAgo: number, exerciseId: string) => ({
  id,
  type: 'strength' as const,
  startedAt: ago(daysAgo),
  endedAt: ago(daysAgo) + 1000,
  exercises: [{ exerciseId, sets: [{ id: `${id}-s`, weightKg: 50, reps: 10, rpe: null, isWarmup: false }] }],
});

const suggest = (activities: Activity[], strength: ReturnType<typeof lift>[] = []) =>
  suggestWorkout({ activities, strength, now: NOW, muscleGroupOf: groupOf });

test('ganz neu: leichter Einstieg', () => {
  const s = suggest([]);
  assert.deepEqual(s.target, { kind: 'program', programId: 'hiit-express' });
});

test('heute schon trainiert: Erholung, keine Aktion', () => {
  const s = suggest([act('a', ago(0))]);
  assert.equal(s.target, null);
});

test('drei Tage am Stück: lockere Einheit', () => {
  const s = suggest([act('a', ago(1)), act('b', ago(2)), act('c', ago(3))]);
  assert.deepEqual(s.target, { kind: 'program', programId: 'mobility-morgen' });
  assert.match(s.reason, /3 Tagen/);
});

test('zwei Tage am Stück reichen noch nicht für Erholung', () => {
  const s = suggest([act('a', ago(1)), act('b', ago(2))]);
  assert.notDeepEqual(s.target, { kind: 'program', programId: 'mobility-morgen' });
});

test('fehlende Muskelgruppe: Kraft mit Fokus darauf', () => {
  const strength = [lift('w1', 3, 'bank'), lift('w2', 5, 'rudern'), lift('w3', 6, 'druecken')];
  const s = suggest([act('a', ago(3), 'strength')], strength);
  assert.deepEqual(s.target, { kind: 'strength' });
  assert.match(s.title, /Beine/);
});

test('lange kein Lauf: lockerer Lauf', () => {
  const strength = [lift('w1', 3, 'bank'), lift('w2', 4, 'rudern'), lift('w3', 5, 'kniebeuge'), lift('w4', 6, 'druecken')];
  const s = suggest([act('r', ago(10), 'running'), act('a', ago(3), 'strength')], strength);
  assert.deepEqual(s.target, { kind: 'run' });
  assert.match(s.reason, /10 Tagen/);
});

test('Vorschläge führen nie zu einem Premium-Programm', () => {
  const free = ['hiit-express', 'mobility-morgen', 'core-basics'];
  for (const activities of [[], [act('a', ago(1)), act('b', ago(2)), act('c', ago(3))], [act('a', ago(4))]]) {
    const target = suggest(activities).target;
    if (target?.kind === 'program') assert.ok(free.includes(target.programId));
  }
});

test('Standard: kurzes Core-Training', () => {
  const strength = [lift('w1', 3, 'bank'), lift('w2', 4, 'rudern'), lift('w3', 5, 'kniebeuge'), lift('w4', 6, 'druecken')];
  const s = suggest([act('a', ago(3), 'strength')], strength);
  assert.deepEqual(s.target, { kind: 'program', programId: 'core-basics' });
});
