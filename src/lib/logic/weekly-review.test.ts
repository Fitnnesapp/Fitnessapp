import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Activity, ActivityType } from './activity.ts';
import { bestWeek, isoWeek, lastWeekReview, lifetimeTotals, weeklyTotals } from './weekly-review.ts';

const at = (y: number, m: number, d: number, h = 18) => new Date(y, m - 1, d, h).getTime();
let n = 0;
const act = (startedAt: number, minutes = 30, type: ActivityType = 'strength', distanceM = 0): Activity => ({
  id: `a${++n}`,
  type,
  startedAt,
  durationSeconds: minutes * 60,
  distanceM,
});

// Sonntag, 25.10.2026 (KW 43). Letzte volle Woche: Mo 12.10. bis So 18.10. (KW 42)
const NOW = at(2026, 10, 25, 9);

test('ISO-Kalenderwochen, auch am Jahreswechsel', () => {
  assert.equal(isoWeek(at(2026, 10, 25)), 43);
  assert.equal(isoWeek(at(2026, 10, 19)), 43);
  assert.equal(isoWeek(at(2026, 10, 18)), 42);
  assert.equal(isoWeek(at(2026, 1, 1)), 1); // Donnerstag
  assert.equal(isoWeek(at(2027, 1, 1)), 53); // Freitag gehört noch zur KW 53 von 2026
  assert.equal(isoWeek(at(2025, 12, 29)), 1); // Montag der KW 1 von 2026
});

test('Wochensummen: älteste zuerst, aktuelle Woche zuletzt, über die Zeitumstellung hinweg', () => {
  const list = [act(at(2026, 10, 20), 45), act(at(2026, 10, 14), 30, 'running', 5000), act(at(2026, 10, 16), 20)];
  const totals = weeklyTotals(list, NOW, 3);
  assert.deepEqual(
    totals.map((t) => [t.week, t.sessions, t.minutes, t.distanceM]),
    [
      [41, 0, 0, 0],
      [42, 2, 50, 5000],
      [43, 1, 45, 0],
    ],
  );
});

test('Rückblick auf die letzte volle Woche', () => {
  const list = [
    act(at(2026, 10, 12), 40),
    act(at(2026, 10, 12, 7), 20),
    act(at(2026, 10, 15), 60, 'running', 10000),
    act(at(2026, 10, 20), 90), // diese Woche, zählt nicht
  ];
  const review = lastWeekReview(list, NOW, 3);
  assert.equal(review.week, 42);
  assert.equal(review.sessions, 3);
  assert.equal(review.minutes, 120);
  assert.equal(review.distanceM, 10000);
  assert.equal(review.activeDays, 2);
  assert.equal(review.goalReached, false);
  assert.equal(review.longest?.durationSeconds, 3600);
  assert.equal(review.message, '2 von 3 Tagen. Jeder Tag hat gezählt.');
});

test('Rückblick: Ziel geschafft, übertroffen, Pause', () => {
  const two = [act(at(2026, 10, 13)), act(at(2026, 10, 14))];
  assert.equal(lastWeekReview(two, NOW, 2).message, 'Wochenziel geschafft. Genau so baut sich eine Gewohnheit auf.');
  assert.equal(lastWeekReview(two, NOW, 1).message, 'Ziel übertroffen: 2 Trainingstage statt 1.');
  const pause = lastWeekReview([], NOW, 3);
  assert.equal(pause.message, 'Letzte Woche war Pause. Diese Woche ist ein neuer Anfang.');
  assert.equal(pause.longest, null);
});

test('aktivste Woche, bei Gleichstand die neuere', () => {
  const totals = [
    { start: 1, week: 40, sessions: 2, minutes: 60, distanceM: 0 },
    { start: 2, week: 41, sessions: 1, minutes: 90, distanceM: 0 },
    { start: 3, week: 42, sessions: 3, minutes: 90, distanceM: 0 },
  ];
  assert.equal(bestWeek(totals)?.week, 42);
  assert.equal(bestWeek([{ start: 1, week: 40, sessions: 0, minutes: 0, distanceM: 0 }]), null);
});

test('Gesamtbilanz zählt Trainingstage nur einmal', () => {
  const list = [act(at(2026, 10, 12, 7), 20), act(at(2026, 10, 12, 18), 40, 'running', 3000), act(at(2026, 10, 13), 30)];
  assert.deepEqual(lifetimeTotals(list), { sessions: 3, minutes: 90, distanceM: 3000, activeDays: 2 });
});
