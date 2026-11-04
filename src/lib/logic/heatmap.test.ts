import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Activity } from './activity.ts';
import { buildHeatmap, levelFor } from './heatmap.ts';

// Mittwoch, 4. November 2026, 10 Uhr lokale Zeit
const NOW = new Date(2026, 10, 4, 10).getTime();
const at = (y: number, m: number, d: number, h = 18) => new Date(y, m, d, h).getTime();
const act = (startedAt: number, minutes: number): Activity => ({
  id: String(startedAt),
  type: 'strength',
  startedAt,
  durationSeconds: minutes * 60,
  distanceM: 0,
});

test('Stufen nach Trainingszeit, auch kurze Einheiten zählen', () => {
  assert.equal(levelFor(0, 0), 0);
  assert.equal(levelFor(0, 1), 1);
  assert.equal(levelFor(25, 1), 2);
  assert.equal(levelFor(45, 2), 3);
  assert.equal(levelFor(90, 1), 4);
});

test('Raster: Wochen von alt nach neu, Montag zuerst, Zukunft markiert', () => {
  const map = buildHeatmap([], NOW, 4);
  assert.equal(map.weeks.length, 4);
  const last = map.weeks[3];
  // Woche ab Montag, 2. November
  assert.equal(last.days[0].key, '2026-11-02');
  assert.equal(last.days[2].future, false); // heute
  assert.equal(last.days[3].future, true);
  assert.equal(map.weeks[0].days[0].key, '2026-10-12');
});

test('Minuten werden je Tag summiert, Kennzahlen zählen aktive Tage und Wochen', () => {
  const map = buildHeatmap(
    [act(at(2026, 10, 3), 30), act(at(2026, 10, 3, 8), 40), act(at(2026, 9, 20), 10), act(at(2026, 9, 1), 60)],
    NOW,
    4,
  );
  const tuesday = map.weeks[3].days[1];
  assert.equal(tuesday.minutes, 70);
  assert.equal(tuesday.level, 4);
  assert.equal(map.activeDays, 2); // 1. Oktober liegt außerhalb
  assert.equal(map.activeWeeks, 2);
  assert.equal(map.bestWeekRun, 1);
  assert.equal(map.currentWeekRun, 1);
});

test('Laufende Woche ohne Training bricht die aktuelle Serie nicht', () => {
  const map = buildHeatmap([act(at(2026, 9, 27), 30), act(at(2026, 9, 20), 30)], NOW, 6);
  assert.equal(map.currentWeekRun, 2);
  assert.equal(map.bestWeekRun, 2);
});
