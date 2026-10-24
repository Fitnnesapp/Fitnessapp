import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Activity } from './activity.ts';
import {
  buildPlan,
  ifThenSentence,
  missedLastPlanned,
  nextMonday,
  nextSession,
  plannedDaysThisWeek,
  recommendedDays,
  sessionForDay,
  weekdayOf,
  type PlanAnswers,
} from './plan.ts';

const PROGRAMS = [
  { id: 'hiit-express', name: 'HIIT Express' },
  { id: 'hiit-inferno', name: 'HIIT Inferno' },
  { id: 'core-basics', name: 'Core Basics' },
  { id: 'core-burn', name: 'Core Burn' },
  { id: 'mobility-morgen', name: 'Mobility am Morgen' },
  { id: 'mobility-abend', name: 'Mobility am Abend' },
  { id: 'ganzkoerper-basics', name: 'Ganzkörper Basics' },
  { id: 'ganzkoerper-power', name: 'Ganzkörper Power' },
];
const ALL = PROGRAMS.map((p) => p.id);
const FREE = ['hiit-express', 'core-basics', 'mobility-morgen'];

// Samstag, 24.10.2026, 12 Uhr
const NOW = new Date(2026, 9, 24, 12).getTime();

const answers = (over: Partial<PlanAnswers> = {}): PlanAnswers => ({
  goal: 'muskeln',
  level: 'einsteiger',
  place: 'studio',
  days: [0, 2, 4],
  minutes: 45,
  time: 'abends',
  ...over,
});

const build = (over: Partial<PlanAnswers> = {}, allowed = ALL, startNextMonday = false) =>
  buildPlan(answers(over), { allowedProgramIds: allowed, programs: PROGRAMS, now: NOW, startNextMonday });

test('je Trainingstag genau eine Einheit, nach Wochentag sortiert', () => {
  const plan = build({ days: [4, 0, 2, 2] });
  assert.deepEqual(plan.sessions.map((s) => s.day), [0, 2, 4]);
});

test('Muskelaufbau mit 3 Tagen: Ganzkörper im Wechsel', () => {
  const plan = build();
  assert.deepEqual(plan.sessions.map((s) => s.title), ['Kraft: Ganzkörper A', 'Kraft: Ganzkörper B', 'Kraft: Ganzkörper A']);
});

test('Muskelaufbau mit 4 und 5 Tagen: Split', () => {
  assert.equal(build({ days: [0, 1, 3, 4] }).sessions[1].title, 'Kraft: Unterkörper');
  assert.match(build({ days: [0, 1, 2, 3, 4] }).sessions[2].title, /Beine/);
});

test('zu Hause wird Kraft durch ein Ganzkörper-Programm ersetzt', () => {
  const plan = build({ place: 'zuhause', level: 'fortgeschritten' });
  assert.ok(plan.sessions.every((s) => s.kind === 'program'));
  assert.equal(plan.sessions[0].programId, 'ganzkoerper-power');
});

test('ohne Premium nur kostenlose Programme', () => {
  const plan = build({ place: 'zuhause', goal: 'abnehmen', level: 'fortgeschritten' }, FREE);
  for (const s of plan.sessions) {
    if (s.programId) assert.ok(FREE.includes(s.programId), s.programId);
  }
});

test('Ausdauer: langer Lauf am letzten Tag und länger als die anderen', () => {
  const plan = build({ goal: 'ausdauer', days: [1, 3, 6] });
  const last = plan.sessions[plan.sessions.length - 1];
  assert.equal(last.title, 'Langer Lauf');
  assert.equal(last.minutes, 60);
  assert.equal(plan.sessions[1].title, 'Intervall-Lauf');
});

test('Ausdauer mit 5 Tagen enthält Kraft und genau einen langen Lauf', () => {
  const plan = build({ goal: 'ausdauer', days: [0, 1, 2, 4, 5] });
  assert.equal(plan.sessions.length, 5);
  assert.equal(plan.sessions.filter((s) => s.title === 'Langer Lauf').length, 1);
  assert.ok(plan.sessions.some((s) => s.kind === 'strength'));
});

test('abends wird die Abend-Mobility gewählt', () => {
  const plan = build({ goal: 'fitness', days: [0, 1, 2, 3] });
  assert.equal(plan.sessions[3].programId, 'mobility-abend');
});

test('Start heute oder am nächsten Montag', () => {
  assert.equal(build().startsAt, new Date(2026, 9, 24).getTime());
  assert.equal(build({}, ALL, true).startsAt, new Date(2026, 9, 26).getTime());
  assert.equal(nextMonday(new Date(2026, 9, 26, 9).getTime()), new Date(2026, 9, 26).getTime());
});

test('Einheit für einen Tag nur, wenn der Plan schon gilt', () => {
  const plan = build({ days: [0, 5] }, ALL, true);
  assert.equal(sessionForDay(plan, NOW), null); // Samstag vor dem Start
  const monday = new Date(2026, 9, 26, 18).getTime();
  assert.equal(weekdayOf(monday), 0);
  assert.equal(sessionForDay(plan, monday)?.day, 0);
});

test('Wenn-Dann-Satz nennt Tag, Tageszeit und Einheit', () => {
  const plan = build();
  assert.equal(ifThenSentence(plan.sessions[0], 'abends'), 'Wenn es Montag abends ist, mache ich Kraft: Ganzkörper A.');
});

test('verpasste letzte Einheit wird erkannt, erledigte nicht', () => {
  const plan = { ...build({ days: [0, 2, 4] }), startsAt: new Date(2026, 9, 1).getTime() };
  // Letzter geplanter Tag vor Samstag ist Freitag, der 23.10.
  const act = (d: number): Activity => ({ id: String(d), type: 'home', startedAt: new Date(2026, 9, d, 18).getTime(), durationSeconds: 600, distanceM: 0 });
  assert.equal(missedLastPlanned(plan, [], NOW), true);
  assert.equal(missedLastPlanned(plan, [act(23)], NOW), false);
});

test('vor dem Planstart gibt es nichts zu verpassen', () => {
  assert.equal(missedLastPlanned(build(), [], NOW), false);
});

test('empfohlene Tage sind verteilt und passen zur Anzahl', () => {
  assert.deepEqual(recommendedDays(3), [0, 2, 4]);
  assert.equal(recommendedDays(9).length, 6);
  assert.equal(recommendedDays(1).length, 2);
});

test('nächste Einheit nach heute, auch über den Wochenwechsel', () => {
  const plan = build({ days: [0, 2] });
  const next = nextSession(plan, NOW); // Samstag
  assert.equal(next?.session.day, 0);
  assert.equal(next?.inDays, 2);
});

test('nächste Einheit beachtet einen späteren Planstart', () => {
  const plan = { ...build({ days: [5] }), startsAt: new Date(2026, 9, 26).getTime() };
  // Samstag ist Trainingstag, der Plan startet aber erst Montag: nächster Samstag
  assert.equal(nextSession(plan, NOW)?.inDays, 7);
});

test('in der Startwoche zählen nur die Einheiten ab dem Planstart', () => {
  const plan = build({ days: [0, 2, 5] }); // erstellt am Samstag, gilt ab heute
  const thisWeek = new Date(2026, 9, 19).getTime();
  const nextWeek = new Date(2026, 9, 26).getTime();
  assert.equal(plannedDaysThisWeek(plan, thisWeek), 1);
  assert.equal(plannedDaysThisWeek(plan, nextWeek), 3);
});
