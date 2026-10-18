import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  activeElapsedAt,
  computeBests,
  cumulativeDistances,
  downsample,
  currentPace,
  elevationGain,
  evaluatePoint,
  fastestSplit,
  findRunRecords,
  haversineM,
  kmSplits,
  paceSecPerKm,
  splitSegments,
  toTrackPoint,
} from './run-stats.ts';

const M_PER_DEG_LAT = 111194.9;

type Pt = { lat: number; lng: number; t: number; e: number; alt: number | null; acc: number | null };

/** Gerade Strecke nach Norden: `legs` sind Paare aus Meter und Sekunden je Teilstück, `stepM` die Punktabstände. */
function track(legs: { meters: number; seconds: number }[], stepM = 25): Pt[] {
  const points: Pt[] = [{ lat: 48, lng: 11, t: 1_000_000, e: 0, alt: null, acc: 5 }];
  let meters = 0;
  let seconds = 0;

  for (const leg of legs) {
    const steps = Math.round(leg.meters / stepM);
    for (let i = 1; i <= steps; i++) {
      meters += stepM;
      seconds += leg.seconds / steps;
      points.push({ lat: 48 + meters / M_PER_DEG_LAT, lng: 11, t: 1_000_000 + seconds * 1000, e: seconds * 1000, alt: null, acc: 5 });
    }
  }
  return points;
}

test('Haversine: ein Breitengrad entspricht rund 111,2 km', () => {
  const d = haversineM({ lat: 48, lng: 11 }, { lat: 49, lng: 11 });
  assert.ok(Math.abs(d - M_PER_DEG_LAT) < 10, `war ${d}`);
});

test('ungenaue Messungen werden verworfen', () => {
  const a = toTrackPoint({ lat: 48, lng: 11, t: 0, alt: null, acc: 5 }, 0);
  const bad = toTrackPoint({ lat: 48.0001, lng: 11, t: 5000, alt: null, acc: 80 }, 5000);
  assert.equal(evaluatePoint(a, bad).accepted, false);
});

test('unmögliche Sprünge und doppelte Zeitstempel werden verworfen', () => {
  const a = toTrackPoint({ lat: 48, lng: 11, t: 0, alt: null, acc: 5 }, 0);
  const jump = toTrackPoint({ lat: 48.01, lng: 11, t: 1000, alt: null, acc: 5 }, 1000);
  const same = toTrackPoint({ lat: 48.0001, lng: 11, t: 0, alt: null, acc: 5 }, 0);
  assert.equal(evaluatePoint(a, jump).accepted, false);
  assert.equal(evaluatePoint(a, same).accepted, false);
});

test('normale Schritte werden übernommen, Rauschen im Stand zählt nicht', () => {
  const a = toTrackPoint({ lat: 48, lng: 11, t: 0, alt: null, acc: 5 }, 0);
  const step = toTrackPoint({ lat: 48 + 15 / M_PER_DEG_LAT, lng: 11, t: 5000, alt: null, acc: 5 }, 5000);
  const noise = toTrackPoint({ lat: 48 + 0.4 / M_PER_DEG_LAT, lng: 11, t: 5000, alt: null, acc: 5 }, 5000);

  const result = evaluatePoint(a, step);
  assert.equal(result.accepted && Math.round(result.stepM), 15);
  const still = evaluatePoint(a, noise);
  assert.equal(still.accepted && still.stepM, 0);
});

test('der erste Punkt wird immer übernommen', () => {
  const first = toTrackPoint({ lat: 48, lng: 11, t: 0, alt: null, acc: 10 }, 0);
  assert.deepEqual(evaluatePoint(null, first), { accepted: true, stepM: 0 });
});

test('Gesamtdistanz einer Strecke', () => {
  const { totalM } = cumulativeDistances(track([{ meters: 1000, seconds: 300 }]));
  assert.ok(Math.abs(totalM - 1000) < 1, `war ${totalM}`);
});

test('Lücken trennen die Strecke in Abschnitte', () => {
  const points = track([{ meters: 500, seconds: 150 }]);
  const shifted = points.map((p, i) => (i > 10 ? { ...p, e: p.e + 90_000 } : p));
  assert.equal(splitSegments(shifted).length, 2);
  assert.equal(splitSegments(points).length, 1);
});

test('Höhenmeter: kleine Schwankungen zählen nicht, echte Anstiege schon', () => {
  const alt = (values: number[]) =>
    values.map((a, i) => ({ lat: 48, lng: 11, t: i, e: i, alt: a, acc: 5 }));

  assert.equal(elevationGain(alt([100, 101, 100, 102, 101, 102])), 0);
  assert.equal(elevationGain(alt([100, 102, 104, 103, 108])), 8);
  // Abstieg und erneuter Anstieg zählt den zweiten Anstieg
  assert.equal(elevationGain(alt([110, 100, 105])), 5);
  assert.equal(elevationGain(alt([])), 0);
});

test('Pace in Sekunden pro Kilometer', () => {
  assert.equal(paceSecPerKm(1000, 300), 300);
  assert.equal(paceSecPerKm(5, 10), null);
  assert.equal(paceSecPerKm(1000, 0), null);
});

test('aktuelle Pace aus den letzten 30 Sekunden', () => {
  const points = track([{ meters: 1000, seconds: 250 }]);
  const pace = currentPace(points, 30);
  assert.ok(pace !== null && Math.abs(pace - 250) < 2, `war ${pace}`);
  assert.equal(currentPace([]), null);
});

test('Kilometer-Splits bei gleichmäßigem Tempo', () => {
  const splits = kmSplits(track([{ meters: 2500, seconds: 625 }]));
  assert.equal(splits.length, 2);
  assert.ok(splits.every((s) => Math.abs(s.seconds - 250) < 1));
});

test('schnellster Kilometer wird als zusammenhängendes Fenster gefunden', () => {
  const points = track([
    { meters: 1000, seconds: 500 },
    { meters: 1000, seconds: 200 },
  ]);
  const best = fastestSplit(points, 1000);
  assert.ok(best !== null && Math.abs(best - 200) < 1, `war ${best}`);
  assert.equal(fastestSplit(points, 5000), null);
});

test('Pausen verfälschen die Zeiten nicht, weil die aktive Zeit zählt', () => {
  const points = track([{ meters: 2000, seconds: 500 }]).map((p) => ({ ...p, t: p.t + (p.e > 200_000 ? 600_000 : 0) }));
  const best = fastestSplit(points, 1000);
  assert.ok(best !== null && Math.abs(best - 250) < 1, `war ${best}`);
});

test('Bestzeiten für 1, 5 und 10 km', () => {
  const bests = computeBests(track([{ meters: 5500, seconds: 1650 }]));
  assert.ok(bests.k1 !== null && Math.abs(bests.k1 - 300) < 1);
  assert.ok(bests.k5 !== null && Math.abs(bests.k5 - 1500) < 2);
  assert.equal(bests.k10, null);
});

test('Rekorde: erster Lauf ist Basis, gleicher Wert ist kein Rekord', () => {
  const run = (id: string, distanceM: number, k5: number | null) => ({
    id,
    distanceM,
    bests: { k1: null, k5, k10: null },
  });

  const records = findRunRecords([
    run('a', 5000, 1500),
    run('b', 5000, 1500),
    run('c', 6000, 1450),
    run('d', 4000, null),
  ]);

  assert.equal(records.has('a'), false);
  assert.equal(records.has('b'), false);
  assert.deepEqual(records.get('c'), ['longest_distance', 'fastest_5k']);
  assert.equal(records.has('d'), false);
});

test('aktive Zeit läuft nur im Status running', () => {
  const running = { status: 'running' as const, elapsedBase: 10_000, runningSince: 100_000 };
  const paused = { status: 'paused' as const, elapsedBase: 10_000, runningSince: null };
  assert.equal(activeElapsedAt(running, 130_000), 40_000);
  assert.equal(activeElapsedAt(paused, 999_999), 10_000);
});

test('Tracking von 5000 Punkten bleibt schnell', () => {
  const points = track([{ meters: 25_000 * 5, seconds: 30_000 }], 25);
  const started = Date.now();
  computeBests(points);
  kmSplits(points);
  assert.ok(points.length >= 5000);
  assert.ok(Date.now() - started < 2000, 'Auswertung dauerte zu lange');
});

test('downsample behält Anfang, Ende und die Obergrenze', () => {
  const items = Array.from({ length: 10_000 }, (_, i) => i);
  const reduced = downsample(items, 500);
  assert.equal(reduced.length, 500);
  assert.equal(reduced[0], 0);
  assert.equal(reduced.at(-1), 9999);
  assert.deepEqual(downsample([1, 2, 3], 500), [1, 2, 3]);
});
