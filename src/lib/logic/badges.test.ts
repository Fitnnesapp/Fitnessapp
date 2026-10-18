import assert from 'node:assert/strict';
import { test } from 'node:test';

import { earnedBadges, newlyEarned, type BadgeContext } from './badges.ts';

const ctx = (over: Partial<BadgeContext> = {}): BadgeContext => ({
  strengthCount: 0,
  homeCount: 0,
  runCount: 0,
  longestRunM: 0,
  recordCount: 0,
  longestStreak: 0,
  ...over,
});

test('ohne Workouts gibt es kein Abzeichen', () => {
  assert.deepEqual(earnedBadges(ctx()), []);
});

test('das erste Workout egal welcher Art vergibt "Erster Schritt"', () => {
  assert.deepEqual(earnedBadges(ctx({ homeCount: 1 })), ['first_workout']);
});

test('Workout-Meilensteine zählen alle Trainingsarten zusammen', () => {
  const keys = earnedBadges(ctx({ strengthCount: 4, homeCount: 3, runCount: 3 }));
  assert.ok(keys.includes('workouts_10'));
  assert.ok(!keys.includes('workouts_50'));
});

test('Lauf-Abzeichen ab 5 und 10 Kilometern', () => {
  assert.ok(!earnedBadges(ctx({ runCount: 1, longestRunM: 4999 })).includes('first_5k'));
  const five = earnedBadges(ctx({ runCount: 1, longestRunM: 5000 }));
  assert.ok(five.includes('first_5k') && !five.includes('first_10k'));
  assert.ok(earnedBadges(ctx({ runCount: 1, longestRunM: 10500 })).includes('first_10k'));
});

test('Serien-Abzeichen nutzen die längste Serie und gehen nicht verloren', () => {
  assert.ok(earnedBadges(ctx({ longestStreak: 7 })).includes('streak_7'));
  assert.ok(!earnedBadges(ctx({ longestStreak: 6 })).includes('streak_7'));
  assert.ok(earnedBadges(ctx({ longestStreak: 30 })).includes('streak_30'));
});

test('Allrounder braucht alle drei Trainingsarten', () => {
  assert.ok(!earnedBadges(ctx({ strengthCount: 1, homeCount: 1 })).includes('all_rounder'));
  assert.ok(earnedBadges(ctx({ strengthCount: 1, homeCount: 1, runCount: 1 })).includes('all_rounder'));
});

test('jedes Abzeichen wird nur einmal vergeben', () => {
  const earned = earnedBadges(ctx({ strengthCount: 1 }));
  assert.deepEqual(newlyEarned(earned, {}), ['first_workout']);
  assert.deepEqual(newlyEarned(earned, { first_workout: 123 }), []);
  // erneutes Auswerten mit mehr Fortschritt vergibt nur das Neue
  const more = earnedBadges(ctx({ strengthCount: 10 }));
  assert.deepEqual(newlyEarned(more, { first_workout: 123 }), ['workouts_10']);
});
