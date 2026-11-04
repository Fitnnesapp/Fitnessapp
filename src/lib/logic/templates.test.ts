import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addToTemplate, moveInTemplate, removeFromTemplate, TEMPLATE_MAX_EXERCISES } from './templates.ts';

test('Vorlage: hinzufügen ohne Doppelte und mit Obergrenze', () => {
  assert.deepEqual(addToTemplate(['a'], 'b'), ['a', 'b']);
  assert.deepEqual(addToTemplate(['a', 'b'], 'a'), ['a', 'b']);
  const full = Array.from({ length: TEMPLATE_MAX_EXERCISES }, (_, i) => `x${i}`);
  assert.equal(addToTemplate(full, 'neu').length, TEMPLATE_MAX_EXERCISES);
});

test('Vorlage: entfernen und verschieben', () => {
  assert.deepEqual(removeFromTemplate(['a', 'b', 'c'], 1), ['a', 'c']);
  assert.deepEqual(moveInTemplate(['a', 'b', 'c'], 2, -1), ['a', 'c', 'b']);
  assert.deepEqual(moveInTemplate(['a', 'b', 'c'], 0, 1), ['b', 'a', 'c']);
  assert.deepEqual(moveInTemplate(['a', 'b', 'c'], 0, -1), ['a', 'b', 'c']);
  assert.deepEqual(moveInTemplate(['a', 'b', 'c'], 2, 1), ['a', 'b', 'c']);
});
