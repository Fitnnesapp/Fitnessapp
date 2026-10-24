import assert from 'node:assert/strict';
import { test } from 'node:test';

import { FEATURES } from '../../data/features.ts';
import { conceptOf, editDistance, normalize, queryTokens, search, type SearchItem } from './search.ts';

const top = (query: string, items: readonly SearchItem[] = FEATURES) => search(items, query)[0]?.item.id;

test('Normalisierung: Umlaute, ß, Satzzeichen', () => {
  assert.equal(normalize('Übungen für Rücken & Schultern!'), 'uebungen fuer ruecken schultern');
  assert.equal(normalize('Größe'), 'groesse');
});

test('Füllwörter werden ignoriert, außer die Anfrage besteht nur daraus', () => {
  assert.deepEqual(queryTokens('Wie kann ich meine Daten löschen?'), ['daten', 'loeschen']);
  assert.deepEqual(queryTokens('wie'), ['wie']);
});

test('Tippfehler-Abstand', () => {
  assert.equal(editDistance('premuim', 'premium'), 2);
  assert.equal(editDistance('laufen', 'laufen'), 0);
  assert.ok(editDistance('kurz', 'premium') > 2);
});

test('Synonyme und Tippfehler finden den Oberbegriff', () => {
  assert.equal(conceptOf('joggen'), 'laufen');
  assert.equal(conceptOf('abo'), 'premium');
  assert.equal(conceptOf('benachrichtigung'), 'erinnerung');
  assert.equal(conceptOf('benachrichtigunk'), 'erinnerung');
});

test('Fragen in Alltagssprache führen zur richtigen Funktion', () => {
  assert.equal(top('Wie lösche ich meine Daten?'), 'delete');
  assert.equal(top('ich will joggen gehen'), 'running');
  assert.equal(top('was kostet das abo'), 'premium');
  assert.equal(top('Winter Arc mitmachen'), 'discover');
  assert.equal(top('Plan ändern'), 'plan');
  assert.equal(top('Einwilligung widerrufen'), 'health');
  assert.equal(top('push benachrichtigung'), 'reminder');
  assert.equal(top('übungen ohne geräte'), 'home');
});

test('Tippfehler in der Anfrage', () => {
  assert.equal(top('premuim'), 'premium');
  assert.equal(top('abzeichn'), 'badges');
  assert.equal(top('jahresrückblik'), 'year');
});

test('Übungen werden über Muskelgruppe gefunden', () => {
  const items: SearchItem[] = [
    { id: 'bank', kind: 'uebung', title: 'Bankdrücken', subtitle: 'Brust · Langhantel', keywords: [] },
    { id: 'kniebeuge', kind: 'uebung', title: 'Kniebeuge', subtitle: 'Beine · Langhantel', keywords: [] },
  ];
  assert.equal(top('brust', items), 'bank');
  assert.equal(top('bankdrück', items), 'bank');
  assert.equal(top('beine langhantel', items), 'kniebeuge');
});

test('Muskelgruppe im Untertitel zählt mehr als eine Erwähnung in der Anleitung', () => {
  const items: SearchItem[] = [
    { id: 'rudern', kind: 'uebung', title: 'Aufrechtes Rudern', subtitle: 'Schultern · Langhantel', keywords: ['Stange zur Brust ziehen'] },
    { id: 'dips', kind: 'uebung', title: 'Dips', subtitle: 'Brust · Körpergewicht', keywords: [] },
  ];
  assert.equal(top('übungen für die brust', items), 'dips');
});

test('Tippfehler im Titel schlagen lose Synonyme', () => {
  const items: SearchItem[] = [
    { id: 'hyrox', kind: 'event', title: 'HYROX Frankfurt', subtitle: 'Event', keywords: ['Wettkampf'] },
    { id: 'hh', kind: 'event', title: 'Haspa Marathon Hamburg', subtitle: 'Event', keywords: [] },
  ];
  assert.equal(top('marathn', items), 'hh');
});

test('ohne Treffer leer, leere Anfrage leer', () => {
  assert.deepEqual(search(FEATURES, 'xylophon'), []);
  assert.deepEqual(search(FEATURES, '   '), []);
});

test('Treffer aller Wörter stehen vor Teiltreffern', () => {
  const items: SearchItem[] = [
    { id: 'a', kind: 'funktion', title: 'Lauf starten', subtitle: '', keywords: [] },
    { id: 'b', kind: 'funktion', title: 'Lauf Statistik', subtitle: '', keywords: [] },
  ];
  assert.equal(top('lauf starten', items), 'a');
});
