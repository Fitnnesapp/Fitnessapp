import assert from 'node:assert/strict';
import { test } from 'node:test';

import { announcementText, crossedMark, paceDelta, paceDeltaSpoken, paceDeltaText, spokenDuration, unitLengthM } from './announce.ts';

test('Marken: jeder Kilometer beim Laufen, alle 5 beim Rad, Meilen bei imperial', () => {
  assert.equal(crossedMark(990, 1005, 1000, 1), 1);
  assert.equal(crossedMark(1005, 1500, 1000, 1), null);
  assert.equal(crossedMark(4990, 5010, 1000, 5), 5);
  assert.equal(crossedMark(3000, 4500, 1000, 5), null);
  assert.equal(crossedMark(1600, 1610, unitLengthM('imperial'), 1), 1);
  assert.equal(crossedMark(0, 0, 1000, 1), null);
});

test('Gesprochene Dauer', () => {
  assert.equal(spokenDuration(312), '5 Minuten 12');
  assert.equal(spokenDuration(300), '5 Minuten');
  assert.equal(spokenDuration(61), '1 Minute 1');
  assert.equal(spokenDuration(45), '45 Sekunden');
  assert.equal(spokenDuration(3900), '1 Stunde 5 Minuten');
});

test('Ansagetext für Lauf und Rad', () => {
  assert.equal(
    announcementText({ mark: 3, sport: 'run', units: 'metric', elapsedSeconds: 940, segmentSeconds: 305 }),
    '3 Kilometer. Zeit 15 Minuten 40. Letzter Kilometer in 5 Minuten 5.',
  );
  assert.equal(
    announcementText({ mark: 10, sport: 'ride', units: 'metric', elapsedSeconds: 1500, segmentSeconds: 720 }),
    '10 Kilometer. Zeit 25 Minuten. Tempo zuletzt 25 Kilometer pro Stunde.',
  );
});

test('Zieltempo: Abweichung, Anzeige und Ansage', () => {
  assert.equal(paceDelta(292, 300), -8);
  assert.equal(paceDelta(null, 300), null);
  assert.equal(paceDelta(300, null), null);
  assert.equal(paceDeltaText(-8), '8 s/km schneller als dein Ziel');
  assert.equal(paceDeltaText(12), '12 s/km langsamer als dein Ziel');
  assert.equal(paceDeltaText(2), 'Genau im Zieltempo');
  assert.equal(paceDeltaSpoken(-8), ' Du bist 8 Sekunden pro Kilometer schneller als dein Zieltempo.');
  assert.equal(paceDeltaSpoken(null), '');
});
