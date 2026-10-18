import assert from 'node:assert/strict';
import { test } from 'node:test';

import { weekStart, weekStats, streaks, type Activity } from './activity.ts';

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();

const act = (id: string, when: number, type: Activity['type'] = 'strength', durationSeconds = 1800, distanceM = 0): Activity => ({
  id,
  type,
  startedAt: when,
  durationSeconds,
  distanceM,
});

test('die Woche beginnt am Montag um 0 Uhr', () => {
  // 18.10.2026 ist ein Sonntag, die Woche beginnt am 12.10.
  assert.equal(weekStart(at(2026, 10, 18)), at(2026, 10, 12, 0));
  assert.equal(weekStart(at(2026, 10, 12, 0)), at(2026, 10, 12, 0));
  assert.equal(weekStart(at(2026, 10, 14)), at(2026, 10, 12, 0));
});

test('Wochenstatistik summiert nur die Woche und gruppiert nach Tag und Art', () => {
  const start = at(2026, 10, 12, 0);
  const stats = weekStats(
    [
      act('a', at(2026, 10, 12, 8)),
      act('b', at(2026, 10, 14), 'running', 3000, 8000),
      act('c', at(2026, 10, 14, 18), 'home', 1200),
      act('d', at(2026, 10, 18, 23)),
      act('vorher', at(2026, 10, 11, 23)),
      act('nachher', at(2026, 10, 19, 0)),
    ],
    start,
  );

  assert.equal(stats.workouts, 4);
  assert.equal(stats.durationSeconds, 1800 + 3000 + 1200 + 1800);
  assert.equal(stats.distanceM, 8000);
  assert.deepEqual(stats.byType, { strength: 2, home: 1, running: 1 });
  assert.deepEqual(stats.perDay, [1, 0, 2, 0, 0, 0, 1]);
});

test('Serie: aufeinanderfolgende Tage zählen, mehrere Workouts am Tag nur einmal', () => {
  const now = at(2026, 10, 18);
  const result = streaks(
    [act('a', at(2026, 10, 16)), act('b', at(2026, 10, 17, 8)), act('c', at(2026, 10, 17, 20)), act('d', at(2026, 10, 18))],
    now,
  );
  assert.equal(result.current, 3);
  assert.equal(result.longest, 3);
  assert.equal(result.trainedToday, true);
  assert.equal(result.atRisk, false);
});

test('Serie: ein noch fehlendes Workout heute unterbricht sie nicht, ist aber gefährdet', () => {
  const now = at(2026, 10, 18);
  const result = streaks([act('a', at(2026, 10, 16)), act('b', at(2026, 10, 17))], now);
  assert.equal(result.current, 2);
  assert.equal(result.atRisk, true);
});

test('Freeze rettet einen verpassten Tag, der Tag zählt aber nicht mit', () => {
  const now = at(2026, 10, 18);
  const result = streaks([act('a', at(2026, 10, 15)), act('b', at(2026, 10, 17)), act('c', at(2026, 10, 18))], now);
  assert.equal(result.current, 3);
  assert.deepEqual(result.frozenDays, ['2026-10-16']);
  assert.equal(result.freezesLeft, 1);
});

test('Serie reißt, wenn die Freezes des Monats aufgebraucht sind', () => {
  const now = at(2026, 10, 18);
  // 11. aktiv, 12.-15. frei: zwei Freezes (12., 13.), am 14. reißt die Serie, ab dem 16. beginnt eine neue.
  const result = streaks([act('a', at(2026, 10, 11)), act('b', at(2026, 10, 16)), act('c', at(2026, 10, 17)), act('d', at(2026, 10, 18))], now);
  assert.equal(result.current, 3);
  assert.equal(result.longest, 3);
  assert.equal(result.freezesLeft, 0);
});

test('Freezes gelten pro Monat und werden zum Monatswechsel erneuert', () => {
  const now = at(2026, 11, 3);
  // 30.10. aktiv, 31.10. verpasst (Okt-Freeze), 1.11. verpasst (Nov-Freeze), 2.11. aktiv
  const result = streaks([act('a', at(2026, 10, 30)), act('b', at(2026, 11, 2)), act('c', at(2026, 11, 3))], now);
  assert.equal(result.current, 3);
  assert.equal(result.freezesLeft, 1);
});

test('ohne verfügbare Freezes reißt die Serie bei jedem verpassten Tag', () => {
  const now = at(2026, 10, 18);
  const result = streaks([act('a', at(2026, 10, 15)), act('b', at(2026, 10, 17)), act('c', at(2026, 10, 18))], now, 0);
  assert.equal(result.current, 2);
});

test('Serie ohne Workouts', () => {
  const result = streaks([], at(2026, 10, 18));
  assert.equal(result.current, 0);
  assert.equal(result.longest, 0);
  assert.equal(result.atRisk, false);
});

test('Zeitumstellung und Monatsgrenze brechen die Serie nicht', () => {
  assert.equal(streaks([act('a', at(2026, 10, 24)), act('b', at(2026, 10, 25)), act('c', at(2026, 10, 26))], at(2026, 10, 26)).current, 3);
  assert.equal(
    streaks([act('a', at(2026, 10, 30)), act('b', at(2026, 10, 31)), act('c', at(2026, 11, 1)), act('d', at(2026, 11, 2))], at(2026, 11, 2)).current,
    4,
  );
});
