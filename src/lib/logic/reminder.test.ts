import assert from 'node:assert/strict';
import { test } from 'node:test';

import { nextReminderAt } from './reminder.ts';

const at = (d: number, h: number) => new Date(2026, 9, d, h).getTime();

test('ohne Einwilligung oder ohne Serie keine Erinnerung', () => {
  assert.equal(nextReminderAt({ enabled: false, currentStreak: 5, trainedToday: false, now: at(18, 10) }), null);
  assert.equal(nextReminderAt({ enabled: true, currentStreak: 0, trainedToday: false, now: at(18, 10) }), null);
});

test('heute noch nicht trainiert und vor 19 Uhr: Erinnerung heute um 19 Uhr', () => {
  assert.equal(nextReminderAt({ enabled: true, currentStreak: 3, trainedToday: false, now: at(18, 10) }), at(18, 19));
});

test('heute schon trainiert: Erinnerung erst morgen um 19 Uhr', () => {
  assert.equal(nextReminderAt({ enabled: true, currentStreak: 3, trainedToday: true, now: at(18, 10) }), at(19, 19));
});

test('nach 19 Uhr gilt die Erinnerung dem nächsten Tag', () => {
  assert.equal(nextReminderAt({ enabled: true, currentStreak: 3, trainedToday: false, now: at(18, 21) }), at(19, 19));
});

test('Monatsende rollt korrekt in den nächsten Monat', () => {
  const now = new Date(2026, 9, 31, 20).getTime();
  assert.equal(
    nextReminderAt({ enabled: true, currentStreak: 2, trainedToday: false, now }),
    new Date(2026, 10, 1, 19).getTime(),
  );
});
