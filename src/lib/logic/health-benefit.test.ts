import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  benefitHistory,
  benefitMessage,
  enduranceIntensity,
  planWeeklyBenefit,
  weeklyBenefit,
  weeksMet,
  weeksMetInYear,
} from './health-benefit.ts';

const monday = new Date(2026, 10, 2).getTime();
const day = (n: number, h = 18) => new Date(2026, 10, 2 + n, h).getTime();

test('Intensive Minuten zählen doppelt, Mobility gar nicht, Krafttage nach Kalendertag', () => {
  const benefit = weeklyBenefit(
    [
      { startedAt: day(0), durationSeconds: 30 * 60, intensity: 'intensiv', strengthening: false },
      { startedAt: day(1), durationSeconds: 40 * 60, intensity: 'moderat', strengthening: false },
      { startedAt: day(1, 7), durationSeconds: 20 * 60, intensity: 'keine', strengthening: false },
      { startedAt: day(2, 8), durationSeconds: 50 * 60, intensity: 'keine', strengthening: true },
      { startedAt: day(2, 19), durationSeconds: 20 * 60, intensity: 'moderat', strengthening: true },
      { startedAt: day(-1), durationSeconds: 120 * 60, intensity: 'intensiv', strengthening: true },
    ],
    monday,
  );
  assert.deepEqual(benefit, { aerobicMinutes: 120, strengthDays: 1, aerobicMet: false, strengthMet: false });
});

test('Intensität: Laufen intensiv, Rad nach Tempo', () => {
  assert.equal(enduranceIntensity('run', 5000, 1800), 'intensiv');
  assert.equal(enduranceIntensity('ride', 20000, 3600), 'intensiv');
  assert.equal(enduranceIntensity('ride', 15000, 3600), 'moderat');
  assert.equal(enduranceIntensity('ride', 1000, 0), 'keine');
});

test('Nachricht: positiv, mit konkretem Vorschlag', () => {
  assert.match(
    benefitMessage({ aerobicMinutes: 95, strengthDays: 1, aerobicMet: false, strengthMet: false }),
    /noch 55 Ausdauerminuten \(z\.B\. 30 Min\. lockeres Laufen\) und noch ein Krafttag/,
  );
  assert.match(benefitMessage({ aerobicMinutes: 200, strengthDays: 2, aerobicMet: true, strengthMet: true }), /beide/);
});

test('Erfüllte Wochen der letzten 12, aktuelle Woche zählt nicht', () => {
  const week = (n: number, d: number) => new Date(2026, 10, 2 - 7 * n + d, 18).getTime();
  const full = (n: number) => [
    { startedAt: week(n, 0), durationSeconds: 80 * 60, intensity: 'intensiv' as const, strengthening: false },
    { startedAt: week(n, 1), durationSeconds: 45 * 60, intensity: 'keine' as const, strengthening: true },
    { startedAt: week(n, 3), durationSeconds: 45 * 60, intensity: 'keine' as const, strengthening: true },
  ];
  const entries = [...full(0), ...full(1), ...full(3), ...full(13)];
  assert.equal(weeksMet(entries, monday), 2);
});

test('Plan-Nutzen: Läufe und HIIT doppelt, Krafttage nach Wochentag', () => {
  const plan = planWeeklyBenefit([
    { day: 0, kind: 'strength', minutes: 60 },
    { day: 2, kind: 'run', minutes: 40 },
    { day: 4, kind: 'strength', minutes: 60 },
    { day: 4, kind: 'program', minutes: 15, category: 'Mobility' },
    { day: 5, kind: 'program', minutes: 20, category: 'HIIT' },
  ]);
  assert.deepEqual(plan, { aerobicMinutes: 120, strengthDays: 2, aerobicMet: false, strengthMet: true });
  assert.equal(planWeeklyBenefit([{ day: 1, kind: 'run', minutes: 80 }]).aerobicMet, true);
});

test('Verlauf: 12 Wochen, älteste zuerst, aktuelle zuletzt', () => {
  const entries = [{ startedAt: new Date(2026, 10, 3, 18).getTime(), durationSeconds: 3600, intensity: 'intensiv' as const, strengthening: true }];
  const history = benefitHistory(entries, monday);
  assert.equal(history.length, 12);
  assert.equal(history[11].weekStart, monday);
  assert.equal(history[11].aerobicMinutes, 120);
  assert.equal(new Date(history[10].weekStart).getDate(), 26);
  assert.equal(history[0].aerobicMinutes, 0);
});

test('Jahr: erfüllte Wochen, nur bis heute', () => {
  const week = (start: Date) => [
    { startedAt: start.getTime() + 18 * 3600_000, durationSeconds: 80 * 60, intensity: 'intensiv' as const, strengthening: true },
    { startedAt: start.getTime() + 42 * 3600_000, durationSeconds: 45 * 60, intensity: 'keine' as const, strengthening: true },
  ];
  // 2026 beginnt an einem Donnerstag, erster Montag ist der 5. Januar
  const entries = [...week(new Date(2026, 0, 5)), ...week(new Date(2026, 0, 12)), ...week(new Date(2025, 11, 29))];
  const result = weeksMetInYear(entries, 2026, new Date(2026, 0, 20).getTime());
  assert.deepEqual(result, { met: 2, weeks: 3 });
  // Wochen vor dem ersten Training zählen nicht
  const late = weeksMetInYear(week(new Date(2026, 0, 12)), 2026, new Date(2026, 0, 20).getTime());
  assert.deepEqual(late, { met: 1, weeks: 2 });
});
