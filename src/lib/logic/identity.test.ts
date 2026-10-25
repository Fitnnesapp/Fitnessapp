import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Activity, ActivityType } from './activity.ts';
import { compareWithLastWeek, trainingIdentity } from './identity.ts';

const at = (y: number, m: number, d: number, h: number) => new Date(y, m - 1, d, h).getTime();
let n = 0;
const act = (type: ActivityType, startedAt: number, minutes = 30): Activity => ({
  id: `a${++n}`,
  type,
  startedAt,
  durationSeconds: minutes * 60,
  distanceM: 0,
});

// Sonntag, 25.10.2026, 9 Uhr; die Woche begann am Montag, 19.10.
const NOW = at(2026, 10, 25, 9);

test('ohne Einheiten gibt es noch keine Identität', () => {
  assert.equal(trainingIdentity([], NOW), null);
});

test('überwiegend Läufe ergibt Team Lauf', () => {
  const list = [act('running', at(2026, 10, 20, 7)), act('running', at(2026, 10, 22, 7)), act('strength', at(2026, 10, 23, 18))];
  assert.deepEqual(trainingIdentity(list, NOW), { team: 'Lauf', sessions: 3 });
});

test('gemischtes Training ergibt Team Allround', () => {
  const list = [act('running', at(2026, 10, 20, 7)), act('strength', at(2026, 10, 22, 7)), act('home', at(2026, 10, 23, 18))];
  assert.deepEqual(trainingIdentity(list, NOW), { team: 'Allround', sessions: 3 });
});

test('Einheiten älter als 90 Tage zählen nicht', () => {
  const list = [act('home', at(2026, 6, 1, 7)), act('strength', at(2026, 10, 20, 7))];
  assert.deepEqual(trainingIdentity(list, NOW), { team: 'Kraft', sessions: 1 });
});

test('Vergleich nur bis zum gleichen Zeitpunkt der Vorwoche', () => {
  const list = [
    act('strength', at(2026, 10, 20, 18), 45), // diese Woche
    act('running', at(2026, 10, 13, 18), 30), // Vorwoche, vor dem gleichen Zeitpunkt
    act('running', at(2026, 10, 18, 18), 60), // Vorwoche Sonntagabend: nach 9 Uhr, zählt nicht
  ];
  const result = compareWithLastWeek(list, NOW);
  assert.equal(result.minutes, 45);
  assert.equal(result.lastMinutes, 30);
  assert.equal(result.message, '15 Min mehr als letzte Woche bis heute.');
});

test('weniger als letzte Woche wird neutral formuliert, nie als Verlust', () => {
  const list = [act('strength', at(2026, 10, 20, 18), 20), act('strength', at(2026, 10, 13, 18), 50)];
  const result = compareWithLastWeek(list, NOW);
  assert.equal(result.message, 'Letzte Woche bis heute: 50 Min. Jede Minute zählt.');
  assert.ok(!/verloren|weniger|schlechter/i.test(result.message ?? ''));
});

test('erste Woche mit Training und leere Wochen', () => {
  assert.equal(compareWithLastWeek([act('home', at(2026, 10, 21, 7))], NOW).message, 'Mehr als letzte Woche bis heute. Starker Start!');
  assert.equal(compareWithLastWeek([], NOW).message, null);
});
