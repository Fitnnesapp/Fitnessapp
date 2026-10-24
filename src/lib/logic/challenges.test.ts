import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Activity } from './activity.ts';
import {
  challengeProgress,
  challengeStatus,
  challengeWindow,
  measure,
  targetOnJoin,
  type Challenge,
} from './challenges.ts';

const ARC: Challenge = {
  id: 'arc',
  name: 'Arc',
  tagline: '',
  description: '',
  icon: 'snow',
  metric: 'activeDays',
  window: { kind: 'fixed', start: '2026-10-01', end: '2026-12-31' },
  target: 52,
  stages: ['a', 'b', 'c', 'd'],
};

const ROLLING: Challenge = { ...ARC, id: 'roll', window: { kind: 'rolling', days: 30 }, target: 20 };

const at = (m: number, d: number, h = 18) => new Date(2026, m - 1, d, h).getTime();
const act = (m: number, d: number, over: Partial<Activity> = {}): Activity => ({
  id: `${m}-${d}-${over.type ?? 'home'}`,
  type: 'home',
  startedAt: at(m, d),
  durationSeconds: 1800,
  distanceM: 0,
  ...over,
});

test('fester Zeitraum schließt den letzten Tag ein', () => {
  const { start, end } = challengeWindow(ARC);
  assert.equal(start, new Date(2026, 9, 1).getTime());
  assert.equal(end, new Date(2027, 0, 1).getTime());
});

test('Status vor, während und nach der Challenge', () => {
  assert.equal(challengeStatus(ARC, at(9, 30)), 'upcoming');
  assert.equal(challengeStatus(ARC, at(10, 24)), 'active');
  assert.equal(challengeStatus(ARC, new Date(2027, 0, 1, 1).getTime()), 'ended');
  assert.equal(challengeStatus(ROLLING, at(10, 24)), 'active');
});

test('Trainingstage zählen mehrere Workouts am selben Tag einmal', () => {
  const acts = [act(10, 2), act(10, 2, { type: 'strength' }), act(10, 3), act(9, 30)];
  assert.equal(measure('activeDays', acts, at(10, 1, 0), at(12, 31, 23)), 2);
  assert.equal(measure('workouts', acts, at(10, 1, 0), at(12, 31, 23)), 3);
});

test('Laufkilometer zählen nur Distanz, abgerundet auf 100 m', () => {
  const acts = [act(11, 2, { type: 'running', distanceM: 5049 }), act(11, 4, { type: 'running', distanceM: 10000 })];
  assert.equal(measure('runKm', acts, at(11, 1, 0), at(11, 30, 23)), 15);
});

test('pünktlicher Beitritt bekommt das volle Ziel', () => {
  assert.equal(targetOnJoin(ARC, [], at(9, 20)), 52);
  assert.equal(targetOnJoin(ROLLING, [], at(10, 24)), 20);
});

test('später Beitritt: Geschafftes plus anteiliges Ziel, höchstens das volle Ziel', () => {
  // 24.10.: 69 von 92 Tagen übrig, 4 Trainingstage schon geschafft
  const acts = [act(10, 2), act(10, 5), act(10, 9), act(10, 20)];
  const target = targetOnJoin(ARC, acts, at(10, 24, 12));
  assert.equal(target, 4 + Math.ceil((52 * 69) / 92));
  assert.ok(target <= 52);
});

test('Fortschritt mit Etappen und Tempo', () => {
  const acts = Array.from({ length: 14 }, (_, i) => act(10, i + 1));
  const p = challengeProgress(ARC, { joinedAt: at(10, 1, 8), target: 52 }, acts, at(10, 24, 20));
  assert.equal(p.value, 14);
  assert.equal(p.stage, 0); // 14/52 = 27 %, erste Etappe
  assert.equal(p.completed, false);
  assert.equal(p.daysLeft, 69);
  assert.equal(p.aheadBy, 0.4); // Soll nach 24 von 92 Tagen: 52 × 24 / 92 = 13,6
  assert.equal(p.message, 'Genau im Zeitplan. Weiter so!');
});

test('Ziel erreicht ergibt letzte Etappe', () => {
  const acts = Array.from({ length: 20 }, (_, i) => act(10, i + 1));
  const p = challengeProgress(ROLLING, { joinedAt: at(10, 1, 7), target: 20 }, acts, at(10, 24));
  assert.equal(p.completed, true);
  assert.equal(p.stage, 3);
  assert.equal(p.ratio, 1);
});

test('rollende Challenge zählt erst ab dem Beitritt', () => {
  const acts = [act(10, 1), act(10, 25)];
  const p = challengeProgress(ROLLING, { joinedAt: at(10, 24, 9), target: 20 }, acts, at(10, 26));
  assert.equal(p.value, 1);
});

test('Rückstand wird als aufholbar beschrieben', () => {
  const acts = Array.from({ length: 8 }, (_, i) => act(10, i + 1));
  const p = challengeProgress(ARC, { joinedAt: at(10, 1, 8), target: 52 }, acts, at(10, 24, 20));
  assert.equal(p.message, 'Noch 6 Trainingstage bis zum Zeitplan. Gut aufholbar.');
});

test('später Beitritt startet im Zeitplan', () => {
  const acts = [act(10, 2), act(10, 5), act(10, 9), act(10, 20)];
  const joinedAt = at(10, 24, 12);
  const target = targetOnJoin(ARC, acts, joinedAt);
  const p = challengeProgress(ARC, { joinedAt, target }, acts, at(10, 24, 13));
  assert.ok(Math.abs(p.aheadBy) < 1, String(p.aheadBy));
  assert.equal(p.message, 'Genau im Zeitplan. Weiter so!');
});

test('ohne Einheit ermutigt die Nachricht zum Start', () => {
  const p = challengeProgress(ROLLING, { joinedAt: at(10, 24, 9), target: 20 }, [], at(10, 24, 10));
  assert.equal(p.value, 0);
  assert.match(p.message, /Anfang/);
});
