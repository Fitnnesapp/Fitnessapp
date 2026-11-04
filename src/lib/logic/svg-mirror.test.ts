import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mirrorPath } from './svg-mirror.ts';

test('Spiegelt x-Werte, y-Werte bleiben', () => {
  assert.equal(mirrorPath('M10 20 L30 40 Z', 100), 'M 90 20 L 70 40 Z');
});

test('Kurven: jedes Koordinatenpaar wird gespiegelt', () => {
  assert.equal(mirrorPath('M0 0 Q10 5 20 0 C25 1 30 2 35 3', 100), 'M 100 0 Q 90 5 80 0 C 75 1 70 2 65 3');
});

test('H spiegelt, V nicht, Kommas und Dezimalzahlen gehen', () => {
  assert.equal(mirrorPath('M12.5,3 H40 V60 Z', 100), 'M 87.5 3 H 60 V 60 Z');
});

test('Relative Befehle werden abgelehnt', () => {
  assert.throws(() => mirrorPath('m10 10 l5 5', 100));
});
