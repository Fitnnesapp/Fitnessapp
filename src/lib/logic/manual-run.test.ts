import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  calendarDaysAgo,
  createManualRun,
  parseDuration,
  startFromDayAndTime,
  timeOfDay,
  validateManualRun,
} from './manual-run.ts';

const now = new Date(2026, 10, 4, 18, 0).getTime();
const hourAgo = now - 3600_000;

test('Dauer lesen: Minuten, mm:ss, h:mm:ss', () => {
  assert.equal(parseDuration('45'), 2700);
  assert.equal(parseDuration('25:30'), 1530);
  assert.equal(parseDuration('1:05:30'), 3930);
  assert.equal(parseDuration('25:75'), null);
  assert.equal(parseDuration(''), null);
  assert.equal(parseDuration('abc'), null);
  assert.equal(parseDuration('1:2:3:4'), null);
});

test('Startzeit aus Tag und Uhrzeit', () => {
  const yesterday = startFromDayAndTime(now, 1, '07:15');
  assert.equal(new Date(yesterday!).getDate(), 3);
  assert.equal(new Date(yesterday!).getHours(), 7);
  assert.equal(startFromDayAndTime(now, 0, '7.30'), new Date(2026, 10, 4, 7, 30).getTime());
  assert.equal(startFromDayAndTime(now, 0, '25:00'), null);
  assert.equal(startFromDayAndTime(now, 0, 'morgens'), null);
});

test('Plausibilität: Distanz, Dauer, Tempo, Zeitpunkt', () => {
  const ok = { distanceKm: 5, durationSeconds: 1500, startedAt: hourAgo };
  assert.equal(validateManualRun(ok, now), null);
  assert.match(validateManualRun({ ...ok, distanceKm: 0 }, now) ?? '', /Distanz/);
  assert.match(validateManualRun({ ...ok, distanceKm: 120 }, now) ?? '', /Höchstens/);
  assert.match(validateManualRun({ ...ok, durationSeconds: 30 }, now) ?? '', /Minute/);
  assert.match(validateManualRun({ ...ok, durationSeconds: 300 }, now) ?? '', /schneller/);
  assert.match(validateManualRun({ ...ok, durationSeconds: 7000 }, now) ?? '', /langsamer/);
  assert.match(validateManualRun({ ...ok, startedAt: now }, now) ?? '', /Zukunft/);
  assert.match(validateManualRun({ ...ok, startedAt: now - 40 * 86_400_000 }, now) ?? '', /30 Tage/);
});

test('Nachgetragener Lauf: ohne Strecke und ohne Bestzeiten', () => {
  const run = createManualRun({ distanceKm: 5.03, durationSeconds: 1500.4, startedAt: hourAgo }, 'x');
  assert.equal(run.distanceM, 5030);
  assert.equal(run.durationSeconds, 1500);
  assert.equal(run.endedAt, hourAgo + 1500_000);
  assert.deepEqual(run.bests, { k1: null, k5: null, k10: null });
  assert.equal(run.points.length, 0);
  assert.equal(run.manual, true);
});

test('Bearbeiten: Tage zurück und Uhrzeit aus dem gespeicherten Lauf', () => {
  assert.equal(calendarDaysAgo(new Date(2026, 10, 4, 6, 0).getTime(), now), 0);
  assert.equal(calendarDaysAgo(new Date(2026, 10, 3, 23, 30).getTime(), now), 1);
  assert.equal(calendarDaysAgo(new Date(2026, 9, 28, 12, 0).getTime(), now), 7);
  assert.equal(timeOfDay(new Date(2026, 10, 3, 7, 5).getTime()), '07:05');
  // Rundlauf: Tag und Uhrzeit ergeben wieder denselben Start
  const start = new Date(2026, 10, 2, 18, 45).getTime();
  assert.equal(startFromDayAndTime(now, calendarDaysAgo(start, now), timeOfDay(start)), start);
});

test('Radfahrt nachtragen: eigene Grenzen, Sportart wird gespeichert', () => {
  const ride = { distanceKm: 30, durationSeconds: 3600, startedAt: hourAgo - 3600_000, sport: 'ride' as const };
  assert.equal(validateManualRun(ride, now), null);
  // 36 km/h wäre als Lauf unmöglich, als Radfahrt normal
  assert.match(validateManualRun({ ...ride, distanceKm: 36, sport: 'run' }, now) ?? '', /schneller/);
  assert.equal(validateManualRun({ ...ride, distanceKm: 36 }, now), null);
  assert.match(validateManualRun({ ...ride, durationSeconds: 1200 }, now) ?? '', /60 km\/h/);
  assert.match(validateManualRun({ ...ride, distanceKm: 350 }, now) ?? '', /300 km pro Radfahrt/);
  assert.equal(createManualRun(ride, 'r').sport, 'ride');
  assert.equal(createManualRun({ ...ride, sport: 'run' }, 'l').sport, undefined);
});
