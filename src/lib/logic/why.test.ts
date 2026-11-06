import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cleanWhy, shouldShowWhy, WHY_MAX_LENGTH } from './why.ts';

test('Warum wird bereinigt und begrenzt', () => {
  assert.equal(cleanWhy('  Mehr   Energie  '), 'Mehr Energie');
  assert.equal(cleanWhy('x'.repeat(300)).length, WHY_MAX_LENGTH);
});

test('Warum erscheint nach einer Pause oder am Montag, sonst nicht', () => {
  assert.equal(shouldShowWhy('', 10, 1), false);
  assert.equal(shouldShowWhy('Energie', null, 4), true);
  assert.equal(shouldShowWhy('Energie', 3, 4), true);
  assert.equal(shouldShowWhy('Energie', 1, 4), false);
  assert.equal(shouldShowWhy('Energie', 1, 1), true);
});
