import assert from 'node:assert/strict';
import { test } from 'node:test';

import { shouldCheckForUpdate, UPDATE_CHECK_INTERVAL_MS, updateStatusText } from './updates.ts';

test('Update-Prüfung höchstens alle 30 Minuten, auch nach Uhrzeit-Rücksprung', () => {
  assert.equal(shouldCheckForUpdate(null, 1000), true);
  assert.equal(shouldCheckForUpdate(1000, 1000 + UPDATE_CHECK_INTERVAL_MS - 1), false);
  assert.equal(shouldCheckForUpdate(1000, 1000 + UPDATE_CHECK_INTERVAL_MS), true);
  assert.equal(shouldCheckForUpdate(5000, 1000), true);
});

test('Statustexte', () => {
  assert.match(updateStatusText('ready'), /Neustart/);
  assert.match(updateStatusText('idle'), /automatisch/);
});
