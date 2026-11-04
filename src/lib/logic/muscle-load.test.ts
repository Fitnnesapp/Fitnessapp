import assert from 'node:assert/strict';
import { test } from 'node:test';

import { muscleLoad } from './muscle-load.ts';

test('Hauptmuskel voll, Hilfsmuskeln anteilig, normiert', () => {
  assert.deepEqual(muscleLoad([{ primary: 'Brust', secondary: ['Trizeps', 'Schultern'], amount: 3 }]), {
    Brust: 1,
    Trizeps: 0.4,
    Schultern: 0.4,
  });
});

test('Mehrere Übungen summieren sich, stärkste Gruppe ist 1', () => {
  const load = muscleLoad([
    { primary: 'Brust', secondary: ['Trizeps'], amount: 4 },
    { primary: 'Trizeps', secondary: [], amount: 3 },
  ]);
  // Brust 4, Trizeps 3 + 1.6 = 4.6
  assert.equal(load.Trizeps, 1);
  assert.equal(load.Brust, 0.87);
});

test('Leere oder nullwertige Einträge ergeben keine Belastung', () => {
  assert.deepEqual(muscleLoad([]), {});
  assert.deepEqual(muscleLoad([{ primary: 'Bauch', secondary: [], amount: 0 }]), {});
  assert.deepEqual(muscleLoad([{ primary: undefined, secondary: ['Bauch'], amount: 2 }]), { Bauch: 1 });
});
