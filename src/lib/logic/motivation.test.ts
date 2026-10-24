import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { BadgeContext } from './badges.ts';
import { badgeProgress, dayHeading, greeting, nextBadge, weeklyGoal } from './motivation.ts';

const ctx = (over: Partial<BadgeContext> = {}): BadgeContext => ({
  strengthCount: 0,
  homeCount: 0,
  runCount: 0,
  longestRunM: 0,
  recordCount: 0,
  longestStreak: 0,
  ...over,
});

test('Wochenziel zählt Tage, nicht Workouts', () => {
  const goal = weeklyGoal([2, 0, 1, 0, 0, 0, 0], 3);
  assert.equal(goal.activeDays, 2);
  assert.equal(goal.remaining, 1);
  assert.equal(goal.reached, false);
  assert.equal(goal.message, 'Nur noch 1 Tag bis zu deinem Wochenziel.');
});

test('Wochenziel ohne Training ermutigt zum ersten Tag', () => {
  const goal = weeklyGoal([0, 0, 0, 0, 0, 0, 0], 3);
  assert.equal(goal.ratio, 0);
  assert.equal(goal.remaining, 3);
  assert.match(goal.message, /erste/);
});

test('Wochenziel genau erreicht und übertroffen', () => {
  const exact = weeklyGoal([1, 0, 1, 0, 1, 0, 0], 3);
  assert.equal(exact.reached, true);
  assert.equal(exact.ratio, 1);
  assert.equal(exact.message, 'Wochenziel geschafft. Alles ab jetzt ist Bonus.');

  const more = weeklyGoal([1, 1, 1, 1, 0, 0, 0], 3);
  assert.equal(more.ratio, 1);
  assert.equal(more.remaining, 0);
  assert.match(more.message, /übertroffen: 4/);
});

test('Begrüßung folgt der Tageszeit', () => {
  const at = (hour: number) => new Date(2026, 9, 24, hour, 0).getTime();
  assert.equal(greeting(at(7)), 'Guten Morgen');
  assert.equal(greeting(at(14)), 'Hallo');
  assert.equal(greeting(at(20)), 'Guten Abend');
  assert.equal(greeting(at(2)), 'Hallo');
});

test('Abzeichen-Fortschritt wird beim Ziel gekappt', () => {
  const progress = badgeProgress(ctx({ strengthCount: 12 }));
  const ten = progress.find((p) => p.key === 'workouts_10');
  assert.deepEqual(ten, { key: 'workouts_10', current: 10, target: 10, ratio: 1 });
});

test('nächstes Abzeichen ist das offene mit dem größten Fortschritt', () => {
  const next = nextBadge(ctx({ runCount: 1, longestRunM: 4500 }), { first_workout: 1 });
  assert.equal(next?.key, 'first_5k');
  assert.equal(next?.current, 4.5);
});

test('bei Gleichstand gewinnt das zuerst definierte Abzeichen', () => {
  assert.equal(nextBadge(ctx(), {})?.key, 'first_workout');
});

test('vergebene Abzeichen werden übersprungen, alle vergeben ergibt null', () => {
  const all = Object.fromEntries(badgeProgress(ctx()).map((p) => [p.key, 1]));
  assert.equal(nextBadge(ctx(), all), null);
});

test('Kopfzeile zeigt Wochentag und Datum auf Deutsch', () => {
  assert.equal(dayHeading(new Date(2026, 9, 24, 12).getTime()), 'Samstag, 24. Oktober');
  assert.equal(dayHeading(new Date(2027, 2, 1, 12).getTime()), 'Montag, 1. März');
});
