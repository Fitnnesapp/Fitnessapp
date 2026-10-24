import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { countdownLabel, dateBadge, parseEvents, upcomingEvents, type FitnessEvent } from './events.ts';

const valid = {
  id: 'a',
  name: 'Testlauf',
  kind: 'lauf',
  date: '2026-11-01',
  city: 'Berlin',
  country: 'DE',
  distances: ['10 km'],
  url: 'https://example.org',
  description: 'Beschreibung',
};

const NOW = new Date(2026, 9, 24, 12).getTime();

test('gültige Einträge werden übernommen', () => {
  const events = parseEvents({ events: [valid] });
  assert.equal(events?.length, 1);
  assert.equal(events?.[0].name, 'Testlauf');
});

test('falsches Format ergibt null', () => {
  assert.equal(parseEvents(null), null);
  assert.equal(parseEvents({ items: [] }), null);
  assert.equal(parseEvents('kaputt'), null);
});

test('ungültige Einträge werden verworfen', () => {
  const events = parseEvents({
    events: [
      { ...valid, id: 'b', url: 'http://unsicher.example' },
      { ...valid, id: 'c', url: 'javascript:alert(1)' },
      { ...valid, id: 'd', date: '2026-02-30' },
      { ...valid, id: 'e', kind: 'party' },
      { ...valid, id: 'f', name: 'x'.repeat(200) },
      { ...valid, id: 'a' },
      valid,
      { ...valid }, // doppelte ID
      42,
    ],
  });
  assert.deepEqual(events?.map((e) => e.id), ['a']);
});

test('Enddatum vor dem Start wird ignoriert', () => {
  const events = parseEvents({ events: [{ ...valid, endDate: '2026-10-01' }] });
  assert.equal(events?.[0].endDate, undefined);
});

test('kommende Events sortiert, vergangene ausgeblendet, laufende bleiben', () => {
  const list = parseEvents({
    events: [
      { ...valid, id: 'spaeter', date: '2027-04-04' },
      { ...valid, id: 'vorbei', date: '2026-10-01' },
      { ...valid, id: 'bald', date: '2026-10-25' },
      { ...valid, id: 'laeuft', date: '2026-10-23', endDate: '2026-10-25' },
    ],
  }) as FitnessEvent[];
  assert.deepEqual(upcomingEvents(list, NOW).map((e) => e.id), ['laeuft', 'bald', 'spaeter']);
});

test('Countdown in Tagen, Wochen und Monaten', () => {
  const at = (date: string) => ({ ...valid, date }) as FitnessEvent;
  assert.equal(countdownLabel(at('2026-10-24'), NOW), 'Heute');
  assert.equal(countdownLabel(at('2026-10-25'), NOW), 'Morgen');
  assert.equal(countdownLabel(at('2026-11-01'), NOW), 'In 8 Tagen');
  assert.equal(countdownLabel(at('2026-12-06'), NOW), 'In 6 Wochen');
  assert.equal(countdownLabel(at('2027-04-25'), NOW), 'In 6 Monaten');
});

test('Kalenderblatt zeigt Tag und Monat', () => {
  assert.deepEqual(dateBadge({ ...valid, date: '2026-12-06' } as FitnessEvent), { day: '6', month: 'Dez' });
});

test('die mitgelieferte Event-Liste ist vollständig gültig', () => {
  const raw = JSON.parse(readFileSync(new URL('../../data/events.json', import.meta.url), 'utf8'));
  const parsed = parseEvents(raw);
  assert.equal(parsed?.length, raw.events.length);
});
