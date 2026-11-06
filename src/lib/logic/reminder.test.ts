import assert from 'node:assert/strict';
import { test } from 'node:test';

import { nextPlanReminderAt, nextReminderAt, pickReminder, planReminderPassedToday, sameDay } from './reminder.ts';

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

test('Plan-Erinnerung: nächster Plan-Tag zur Tageszeit, heute nur vor der Zeit und ohne Training', () => {
  // Mittwoch, 4.11.2026, 10 Uhr; Plan-Tage Mi (2) und Fr (4), abends = 17:30
  const now = new Date(2026, 10, 4, 10, 0).getTime();
  const base = { enabled: true, planDays: [2, 4], time: 'abends' as const, startsAt: 0, trainedToday: false, now };
  assert.equal(nextPlanReminderAt(base), new Date(2026, 10, 4, 17, 30).getTime());
  assert.equal(nextPlanReminderAt({ ...base, trainedToday: true }), new Date(2026, 10, 6, 17, 30).getTime());
  assert.equal(nextPlanReminderAt({ ...base, time: 'morgens' }), new Date(2026, 10, 6, 7, 0).getTime());
  assert.equal(nextPlanReminderAt({ ...base, startsAt: new Date(2026, 10, 9).getTime() }), new Date(2026, 10, 11, 17, 30).getTime());
  assert.equal(nextPlanReminderAt({ ...base, enabled: false }), null);
  assert.equal(nextPlanReminderAt({ ...base, planDays: [] }), null);
});

test('Es wird die frühere Erinnerung geplant', () => {
  const plan = { at: 10, title: 'p', body: '' };
  const streak = { at: 20, title: 's', body: '' };
  assert.equal(pickReminder(plan, streak), plan);
  assert.equal(pickReminder({ ...plan, at: 30 }, streak), streak);
  assert.equal(pickReminder(null, streak), streak);
  assert.equal(pickReminder(plan, null), plan);
});

test('Nach der Plan-Erinnerung heute keine zweite am selben Tag', () => {
  const base = { planDays: [2], time: 'abends' as const, startsAt: 0 };
  assert.equal(planReminderPassedToday({ ...base, now: new Date(2026, 10, 4, 18, 0).getTime() }), true);
  assert.equal(planReminderPassedToday({ ...base, now: new Date(2026, 10, 4, 17, 0).getTime() }), false);
  assert.equal(planReminderPassedToday({ ...base, now: new Date(2026, 10, 5, 18, 0).getTime() }), false);
  assert.equal(sameDay(new Date(2026, 10, 4, 1).getTime(), new Date(2026, 10, 4, 23).getTime()), true);
});
