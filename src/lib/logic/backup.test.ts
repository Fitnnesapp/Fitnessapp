import assert from 'node:assert/strict';
import { test } from 'node:test';

import { backupFileName, createBackup, parseBackup } from './backup.ts';

const NOW = new Date(2026, 10, 4, 10).getTime();

const raw = {
  'fitnessapp-workouts': JSON.stringify({ state: { active: { id: 'x' }, history: [{ id: 'a' }, { id: 'b' }], templates: [] }, version: 2 }),
  'fitnessapp-runs': JSON.stringify({ state: { active: null, history: [{ id: 'r' }] }, version: 1 }),
  'fitnessapp-plan': JSON.stringify({ state: { plan: { sessions: [] }, onboardingDone: true }, version: 3 }),
  'fitnessapp-entitlement': JSON.stringify({ state: { entitlement: 'premium' }, version: 0 }),
  'fitnessapp-home': 'kaputt{',
};

test('Sicherung und Wiederherstellung ergeben dieselben Daten, Kaufstatus bleibt draußen', () => {
  const text = createBackup(raw, NOW);
  const parsed = parseBackup(text);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.exportedAt, NOW);
  const keys = parsed.entries.map(([key]) => key);
  assert.deepEqual(keys.sort(), ['fitnessapp-plan', 'fitnessapp-runs', 'fitnessapp-workouts']);
  assert.deepEqual(parsed.summary, { strength: 2, home: 0, runs: 1, hasPlan: true });

  const workouts = JSON.parse(parsed.entries.find(([key]) => key === 'fitnessapp-workouts')![1]);
  // Laufendes Workout wird nicht übernommen, Version bleibt für Migrationen erhalten
  assert.equal(workouts.state.active, null);
  assert.equal(workouts.state.history.length, 2);
  assert.equal(workouts.version, 2);
});

test('Ungültige Dateien werden mit verständlicher Meldung abgelehnt', () => {
  const error = (text: string) => {
    const parsed = parseBackup(text);
    return parsed.ok ? null : parsed.error;
  };
  assert.match(error('nicht json') ?? '', /kein JSON/);
  assert.match(error(JSON.stringify({ app: 'andere-app', format: 1, data: {} })) ?? '', /nicht aus dieser App/);
  assert.match(error(JSON.stringify({ app: 'fitnessapp', format: 99, data: {} })) ?? '', /neuer als die App/);
  assert.match(error(JSON.stringify({ app: 'fitnessapp', format: 1, data: {} })) ?? '', /keine Daten/);
  assert.match(
    error(JSON.stringify({ app: 'fitnessapp', format: 1, data: { 'fitnessapp-workouts': { state: 'x' } } })) ?? '',
    /beschädigt/,
  );
});

test('Unbekannte Schlüssel werden ignoriert, nie in den Speicher geschrieben', () => {
  const parsed = parseBackup(
    JSON.stringify({
      app: 'fitnessapp',
      format: 1,
      data: { 'fitnessapp-entitlement': { state: { entitlement: 'premium' } }, 'fitnessapp-settings': { state: { units: 'metric' } } },
    }),
  );
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.deepEqual(parsed.entries.map(([key]) => key), ['fitnessapp-settings']);
});

test('Dateiname mit Datum', () => {
  assert.equal(backupFileName(NOW), 'fitnessapp-sicherung-2026-11-04.json');
});
