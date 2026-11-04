import assert from 'node:assert/strict';
import { test } from 'node:test';

import { muscleLoad, muscleRecovery } from './muscle-load.ts';

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

test('Erholung: Hauptmuskel 72 Std, Hilfsmuskel 36 Std, das jüngste Training zählt', () => {
  const NOW = 1_000 * 3_600_000;
  const at = (hoursAgo: number) => NOW - hoursAgo * 3_600_000;
  const { recovering, hoursLeft } = muscleRecovery(
    [
      { startedAt: at(24), exercises: [{ primary: 'Brust', secondary: ['Trizeps'], workingSets: 3 }] },
      { startedAt: at(60), exercises: [{ primary: 'Brust', secondary: [], workingSets: 3 }] },
      { startedAt: at(100), exercises: [{ primary: 'Beine', secondary: [], workingSets: 4 }] },
      { startedAt: at(2), exercises: [{ primary: 'Rücken', secondary: [], workingSets: 0 }] },
    ],
    NOW,
  );
  assert.equal(recovering.Brust, 0.33);
  assert.equal(hoursLeft.Brust, 48);
  assert.equal(recovering.Trizeps, 0.67);
  assert.equal(hoursLeft.Trizeps, 12);
  assert.equal(recovering.Beine, undefined); // längst erholt
  assert.equal(recovering.Rücken, undefined); // nur Aufwärmsätze
});
