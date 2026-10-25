import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Activity } from './activity.ts';
import { celebrate, ordinalText, weekEffectText } from './celebration.ts';

const at = (d: number, h = 18) => new Date(2026, 9, d, h).getTime(); // Oktober 2026, Mo = 19.
const act = (id: string, startedAt: number): Activity => ({ id, type: 'strength', startedAt, durationSeconds: 1800, distanceM: 0 });

test('unbekannte Einheit ergibt keinen Erfolgsmoment', () => {
  assert.equal(celebrate([], 'x', 3), null);
});

test('erste Einheit ist ein Meilenstein mit eigenem Satz', () => {
  const c = celebrate([act('a', at(20))], 'a', 3);
  assert.equal(c?.ordinal, 1);
  assert.equal(c?.milestone, true);
  assert.equal(ordinalText(c!), 'Deine erste Einheit. Der wichtigste Schritt!');
});

test('Zählung und Meilensteine', () => {
  const list = Array.from({ length: 10 }, (_, i) => act(`a${i}`, at(1 + i)));
  assert.equal(ordinalText(celebrate(list, 'a9', 3)!), 'Meilenstein: 10 Einheiten!');
  assert.equal(ordinalText(celebrate(list, 'a6', 3)!), 'Einheit Nr. 7');
});

test('diese Einheit erreicht das Wochenziel', () => {
  const list = [act('a', at(19)), act('b', at(21)), act('c', at(23))];
  const c = celebrate(list, 'c', 3)!;
  assert.deepEqual(c.week, { kind: 'goal-reached', activeDays: 3, goal: 3 });
  assert.equal(weekEffectText(c.week), 'Wochenziel geschafft: 3 von 3 Tagen.');
});

test('nach erreichtem Ziel ist es ein Bonus', () => {
  const list = [act('a', at(19)), act('b', at(20)), act('c', at(21))];
  const c = celebrate(list, 'c', 2)!;
  assert.equal(c.week.kind, 'bonus');
  assert.equal(weekEffectText(c.week), 'Bonus! Dein Wochenziel war schon geschafft, das ist Tag 3.');
});

test('zweite Einheit am selben Tag zählt keinen neuen Tag', () => {
  const list = [act('a', at(19, 7)), act('b', at(19, 18))];
  const c = celebrate(list, 'b', 3)!;
  assert.deepEqual(c.week, { kind: 'progress', activeDays: 1, goal: 3, remaining: 2 });
  assert.equal(weekEffectText(c.week), 'Tag 1 von 3. Noch 2 Tage bis zum Wochenziel.');
});

test('spätere Einheiten verändern den Moment einer früheren nicht', () => {
  const list = [act('a', at(19)), act('b', at(20)), act('c', at(22))];
  const c = celebrate(list, 'b', 3)!;
  assert.deepEqual(c.week, { kind: 'progress', activeDays: 2, goal: 3, remaining: 1 });
  assert.equal(weekEffectText(c.week), 'Tag 2 von 3. Nur noch 1 Tag bis zum Wochenziel.');
});

test('Einheiten der Vorwoche zählen nicht zur Woche', () => {
  const list = [act('alt', at(17)), act('neu', at(19))];
  const c = celebrate(list, 'neu', 1)!;
  assert.equal(c.week.kind, 'goal-reached');
  assert.equal(weekEffectText(c.week), 'Wochenziel geschafft: 1 von 1 Tag.');
});
