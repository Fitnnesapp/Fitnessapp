import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Activity } from './activity.ts';
import {
  buildPlan,
  combineGoals,
  ifThenSentence,
  migratePlanV1,
  missedLastPlanned,
  nextMonday,
  nextSession,
  planDayCount,
  plannedDaysThisWeek,
  weekGoalDays,
  recommendedDays,
  sessionForDay,
  sessionsForDay,
  sessionTemplates,
  setDaySessions,
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
  goals: ['muskeln'],
  level: 'einsteiger',
  places: ['studio', 'draussen'],
  equipment: [],
  runExperience: 'bis5',
  days: [0, 2, 4],
  doubleSessions: false,
  minutes: 45,
  time: 'abends',
  body: null,
  ...over,
});

const options = (allowed = ALL, startNextMonday = false) => ({ allowedProgramIds: allowed, programs: PROGRAMS, now: NOW, startNextMonday });
const build = (over: Partial<PlanAnswers> = {}, allowed = ALL, startNextMonday = false) =>
  buildPlan(answers(over), options(allowed, startNextMonday));
const main = (plan: ReturnType<typeof build>) => plan.sessions.filter((s) => !s.extra);

test('je Trainingstag eine Haupteinheit, nach Wochentag sortiert', () => {
  const plan = build({ days: [4, 0, 2, 2] });
  assert.deepEqual(main(plan).map((s) => s.day), [0, 2, 4]);
  assert.deepEqual(plan.sessions.map((s) => s.id), ['0-0', '2-0', '4-0']);
});

test('Muskelaufbau: Ganzkörper bei 3 Tagen, Split bei 4 und 5 Tagen', () => {
  assert.deepEqual(build().sessions.map((s) => s.title), ['Kraft: Ganzkörper A', 'Kraft: Ganzkörper B', 'Kraft: Ganzkörper A']);
  assert.equal(build({ days: [0, 1, 3, 4] }).sessions[1].title, 'Kraft: Unterkörper');
  assert.match(build({ days: [0, 1, 2, 3, 4] }).sessions[2].title, /Beine/);
});

test('zwei Ziele werden kombiniert: Hauptziel bekommt mehr Tage, langer Lauf am Ende', () => {
  const plan = build({ goals: ['muskeln', 'ausdauer'], days: [0, 1, 3, 5, 6] });
  const kinds = main(plan).map((s) => s.kind);
  assert.equal(kinds.filter((k) => k === 'strength').length, 3);
  assert.equal(kinds.filter((k) => k === 'run').length, 2);
  assert.equal(main(plan).at(-1)?.title, 'Langer Lauf');
});

test('combineGoals mit einem Ziel entspricht dem Einzelziel', () => {
  assert.equal(combineGoals(['ausdauer'], 3).length, 3);
  assert.equal(combineGoals([], 2).length, 2);
});

test('nur zu Hause ohne Geräte: Ganzkörper-Programm statt Kraft, keine Läufe', () => {
  const plan = build({ places: ['zuhause'], goals: ['muskeln', 'ausdauer'], level: 'fortgeschritten' });
  assert.ok(plan.sessions.every((s) => s.kind === 'program'), JSON.stringify(plan.sessions.map((s) => s.title)));
});

test('zu Hause mit Kurzhanteln: Krafttraining mit Geräten', () => {
  const plan = build({ places: ['zuhause'], equipment: ['kurzhanteln'] });
  assert.equal(plan.sessions[0].kind, 'strength');
  assert.match(plan.sessions[0].detail, /Kurzhanteln/);
});

test('ohne Premium nur kostenlose Programme', () => {
  const plan = build({ places: ['zuhause'], goals: ['abnehmen'], level: 'fortgeschritten' }, FREE);
  for (const s of plan.sessions) if (s.programId) assert.ok(FREE.includes(s.programId), s.programId);
});

test('ohne Lauferfahrung: Geh-Lauf statt Intervallen', () => {
  const plan = build({ goals: ['ausdauer'], days: [1, 3, 6], runExperience: 'keine' });
  assert.ok(plan.sessions.every((s) => s.title.includes('Geh-Lauf')), JSON.stringify(plan.sessions.map((s) => s.title)));
});

test('Erfahrene Läufer bekommen einen längeren langen Lauf', () => {
  const short = build({ goals: ['ausdauer'], days: [1, 3, 6], runExperience: 'bis5' });
  const long = build({ goals: ['ausdauer'], days: [1, 3, 6], runExperience: 'mehr' });
  assert.ok((long.sessions.at(-1)?.minutes ?? 0) > (short.sessions.at(-1)?.minutes ?? 0));
});

test('Knie: keine Sprünge und keine Intervalle, mit Hinweis', () => {
  const plan = build({ goals: ['abnehmen', 'ausdauer'], days: [0, 1, 2, 3, 4], level: 'fortgeschritten', body: { age: 35, limitations: ['knie'] } });
  assert.ok(!plan.sessions.some((s) => s.programId?.startsWith('hiit')));
  assert.ok(!plan.sessions.some((s) => s.title === 'Intervall-Lauf'));
  assert.ok(plan.notes.some((n) => n.startsWith('Knie')));
  assert.ok(plan.notes.includes('Der Plan ersetzt keine ärztliche Beratung.'));
});

test('Herz-Kreislauf und Alter ab 60: moderat und Arzt-Hinweis', () => {
  const plan = build({ level: 'fortgeschritten', places: ['zuhause'], body: { age: 67, limitations: ['herzkreislauf'] } });
  assert.ok(plan.sessions.every((s) => s.programId !== 'ganzkoerper-power'));
  assert.ok(plan.notes.some((n) => n.includes('Ärztin')));
});

test('Rücken und Schulter ergänzen die Kraft-Beschreibung', () => {
  const plan = build({ body: { age: null, limitations: ['ruecken', 'schulter'] } });
  assert.match(plan.sessions[0].detail, /Rücken schonen/);
  assert.match(plan.sessions[0].detail, /Schulter schonen/);
});

test('ohne Beschwerden keine Hinweise', () => {
  assert.deepEqual(build().notes, []);
});

test('Doppel-Einheiten: kurze Zusatzeinheit an jedem zweiten Tag', () => {
  const plan = build({ goals: ['muskeln', 'abnehmen'], days: [0, 2, 4], doubleSessions: true });
  const extras = plan.sessions.filter((s) => s.extra);
  assert.equal(extras.length, 2);
  assert.ok(extras.every((s) => s.minutes === 15));
  assert.equal(planDayCount(plan), 3);
  assert.equal(sessionsForDay(plan, new Date(2026, 9, 26, 18).getTime()).length, 2);
  assert.equal(sessionForDay(plan, new Date(2026, 9, 26, 18).getTime())?.extra, undefined);
});

test('Tag selbst belegen: zwei Einheiten, Ruhetag, neuer Tag', () => {
  const plan = build();
  const templates = sessionTemplates(plan.answers, options());
  const run = templates.find((t) => t.key === 'lauf-locker');
  const core = templates.find((t) => t.key === 'programm-core-basics');
  assert.ok(run && core);

  const withSaturday = setDaySessions(plan, 5, [run, core]);
  assert.deepEqual(withSaturday.answers.days, [0, 2, 4, 5]);
  assert.equal(withSaturday.sessions.filter((s) => s.day === 5).length, 2);
  assert.equal(withSaturday.sessions.find((s) => s.id === '5-1')?.extra, true);

  const restMonday = setDaySessions(withSaturday, 0, []);
  assert.deepEqual(restMonday.answers.days, [2, 4, 5]);
});

test('Vorlagen beachten Beschwerden und Premium', () => {
  const knee = sessionTemplates(answers({ body: { age: null, limitations: ['knie'] } }), options(FREE));
  assert.ok(!knee.some((t) => t.key === 'lauf-intervall'));
  assert.ok(!knee.some((t) => t.key.includes('hiit')));
  assert.ok(knee.every((t) => !t.session.programId || FREE.includes(t.session.programId)));
});

test('Start heute oder am nächsten Montag', () => {
  assert.equal(build().startsAt, new Date(2026, 9, 24).getTime());
  assert.equal(build({}, ALL, true).startsAt, new Date(2026, 9, 26).getTime());
  assert.equal(nextMonday(new Date(2026, 9, 26, 9).getTime()), new Date(2026, 9, 26).getTime());
});

test('Einheit für einen Tag nur, wenn der Plan schon gilt', () => {
  const plan = build({ days: [0, 5] }, ALL, true);
  assert.equal(sessionForDay(plan, NOW), null);
  const monday = new Date(2026, 9, 26, 18).getTime();
  assert.equal(weekdayOf(monday), 0);
  assert.equal(sessionForDay(plan, monday)?.day, 0);
});

test('Wenn-Dann-Satz für Haupt- und Zusatzeinheit', () => {
  const plan = build({ doubleSessions: true, goals: ['muskeln'] });
  assert.equal(ifThenSentence(plan.sessions[0], 'abends'), 'Wenn es Montag abends ist, mache ich Kraft: Ganzkörper A.');
  const extra = plan.sessions.find((s) => s.extra);
  assert.ok(extra && ifThenSentence(extra, 'abends').startsWith('Danach'));
});

test('verpasste letzte Einheit wird erkannt, erledigte nicht', () => {
  const plan = { ...build({ days: [0, 2, 4] }), startsAt: new Date(2026, 9, 1).getTime() };
  const act = (d: number): Activity => ({ id: String(d), type: 'home', startedAt: new Date(2026, 9, d, 18).getTime(), durationSeconds: 600, distanceM: 0 });
  assert.equal(missedLastPlanned(plan, [], NOW), true);
  assert.equal(missedLastPlanned(plan, [act(23)], NOW), false);
  assert.equal(missedLastPlanned(build(), [], NOW), false);
});

test('nächste Einheit nach heute, auch über den Wochenwechsel und nach späterem Start', () => {
  const plan = build({ days: [0, 2] });
  assert.deepEqual([nextSession(plan, NOW)?.session.day, nextSession(plan, NOW)?.inDays], [0, 2]);
  const later = { ...build({ days: [5] }), startsAt: new Date(2026, 9, 26).getTime() };
  assert.equal(nextSession(later, NOW)?.inDays, 7);
});

test('in der Startwoche zählen nur die Tage ab dem Planstart, Doppel-Tage einmal', () => {
  const plan = build({ days: [0, 2, 5], doubleSessions: true });
  assert.equal(plannedDaysThisWeek(plan, new Date(2026, 9, 19).getTime()), 1);
  assert.equal(plannedDaysThisWeek(plan, new Date(2026, 9, 26).getTime()), 3);
});

test('Wochenziel: geplante Tage, vor dem Planstart und ohne Plan der Standard', () => {
  const plan = build({ days: [0, 2, 5], doubleSessions: true });
  assert.equal(weekGoalDays(plan, new Date(2026, 9, 26).getTime(), 3), 3);
  assert.equal(weekGoalDays(plan, new Date(2026, 9, 19).getTime(), 3), 1);
  assert.equal(weekGoalDays(plan, new Date(2026, 9, 12).getTime(), 3), 3); // Woche vor dem Planstart
  assert.equal(weekGoalDays(null, new Date(2026, 9, 26).getTime(), 3), 3);
});

test('empfohlene Tage sind verteilt und passen zur Anzahl', () => {
  assert.deepEqual(recommendedDays(3), [0, 2, 4]);
  assert.equal(recommendedDays(9).length, 6);
  assert.equal(recommendedDays(1).length, 2);
});

test('Pläne aus Version 1 werden übernommen', () => {
  const v1 = {
    answers: { goal: 'ausdauer' as const, level: 'einsteiger' as const, place: 'beides' as const, days: [1, 3], minutes: 30, time: 'morgens' as const },
    sessions: [{ day: 1, kind: 'run' as const, title: 'Lockerer Lauf', detail: '', minutes: 30 }],
    createdAt: 1,
    startsAt: 2,
  };
  const plan = migratePlanV1(v1);
  assert.deepEqual(plan.answers.goals, ['ausdauer']);
  assert.deepEqual(plan.answers.places, ['studio', 'zuhause', 'draussen']);
  assert.equal(plan.sessions[0].id, '1-0');
  assert.equal(plan.answers.body, null);
});
