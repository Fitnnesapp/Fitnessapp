import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  accessState,
  cancel,
  canStartTrial,
  daysLeft,
  isPremium,
  NO_ENTITLEMENT,
  purchase,
  startTrial,
  TRIAL_DAYS,
} from './entitlements.ts';

const DAY = 86400000;
const NOW = 1_800_000_000_000;

test('ohne Abo gilt der kostenlose Zugang', () => {
  assert.equal(accessState(NO_ENTITLEMENT, NOW), 'free');
  assert.equal(isPremium(NO_ENTITLEMENT, NOW), false);
});

test('Testversion: 7 Tage Premium, danach abgelaufen', () => {
  const trial = startTrial(NO_ENTITLEMENT, NOW);
  assert.ok(trial);
  assert.equal(accessState(trial, NOW), 'trial');
  assert.equal(isPremium(trial, NOW + (TRIAL_DAYS - 1) * DAY), true);
  assert.equal(daysLeft(trial, NOW), TRIAL_DAYS);
  assert.equal(accessState(trial, NOW + TRIAL_DAYS * DAY), 'expired');
  assert.equal(isPremium(trial, NOW + TRIAL_DAYS * DAY), false);
});

test('die Testversion gibt es nur einmal', () => {
  const trial = startTrial(NO_ENTITLEMENT, NOW)!;
  const expiredLater = { ...trial, status: 'none' as const };
  assert.equal(canStartTrial(expiredLater), false);
  assert.equal(startTrial(expiredLater, NOW + 30 * DAY), null);
  assert.equal(startTrial(trial, NOW), null);
});

test('Kauf: Premium für den bezahlten Zeitraum, danach abgelaufen', () => {
  const monthly = purchase(NO_ENTITLEMENT, 'monthly', NOW);
  assert.equal(accessState(monthly, NOW + 29 * DAY), 'premium');
  assert.equal(accessState(monthly, NOW + 31 * DAY), 'expired');

  const yearly = purchase(NO_ENTITLEMENT, 'yearly', NOW);
  assert.equal(accessState(yearly, NOW + 364 * DAY), 'premium');
});

test('Kauf nach der Testversion ersetzt sie', () => {
  const trial = startTrial(NO_ENTITLEMENT, NOW)!;
  const bought = purchase(trial, 'yearly', NOW + DAY);
  assert.equal(bought.status, 'active');
  assert.equal(bought.trialEndsAt, null);
  assert.equal(bought.trialUsed, true);
});

test('Kündigung: Zugang bleibt bis zum Ende des Zeitraums, dann abgelaufen', () => {
  const canceled = cancel(purchase(NO_ENTITLEMENT, 'monthly', NOW));
  assert.equal(accessState(canceled, NOW + 10 * DAY), 'premium_ending');
  assert.equal(isPremium(canceled, NOW + 10 * DAY), true);
  assert.equal(accessState(canceled, NOW + 31 * DAY), 'expired');
});

test('Kündigen ohne aktives Abo ändert nichts', () => {
  assert.deepEqual(cancel(NO_ENTITLEMENT), NO_ENTITLEMENT);
});
