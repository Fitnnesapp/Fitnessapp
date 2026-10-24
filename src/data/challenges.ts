import type { Challenge } from '@/lib/logic/challenges';

/**
 * Challenges der App. Feste Termine müssen mit App-Updates gepflegt werden;
 * abgelaufene Challenges werden automatisch ausgeblendet.
 */
export const CHALLENGES: readonly Challenge[] = [
  {
    id: 'winter-arc-2026',
    name: 'Winter Arc 2026',
    tagline: '1. Oktober bis 31. Dezember',
    description:
      'Während andere im Winter nachlassen, legst du zu. Ziel: 52 Trainingstage in drei Monaten, also im Schnitt vier pro Woche. Jede Trainingsart zählt, Workouts seit dem 1. Oktober sind schon dabei.',
    icon: 'snow',
    metric: 'activeDays',
    window: { kind: 'fixed', start: '2026-10-01', end: '2026-12-31' },
    target: 52,
    stages: ['Erster Frost', 'Eisklar', 'Schneesturm', 'Winter Arc gemeistert'],
  },
  {
    id: 'november-100k',
    name: '100 km im November',
    tagline: '1. bis 30. November',
    description: 'Lauf im November zusammen 100 Kilometer. Das sind gut 23 km pro Woche, zum Beispiel vier Läufe à 6 km.',
    icon: 'walk',
    metric: 'runKm',
    window: { kind: 'fixed', start: '2026-11-01', end: '2026-11-30' },
    target: 100,
    stages: ['25 km', 'Halbzeit', '75 km', '100 km geschafft'],
  },
  {
    id: 'neujahr-2027',
    name: 'Neustart 2027',
    tagline: '1. bis 31. Januar',
    description:
      'Das neue Jahr ist der größte Neuanfang im Kalender. Mach daraus eine Gewohnheit: 12 Workouts im Januar, drei pro Woche.',
    icon: 'sparkles',
    metric: 'workouts',
    window: { kind: 'fixed', start: '2027-01-01', end: '2027-01-31' },
    target: 12,
    stages: ['Gestartet', 'Halbzeit', 'Fast da', 'Januar gemeistert'],
  },
  {
    id: '30-tage-gewohnheit',
    name: '30 Tage Gewohnheit',
    tagline: 'Startet, sobald du beitrittst',
    description:
      '20 Trainingstage in 30 Tagen. Ein verpasster Tag schadet einer neuen Gewohnheit kaum, wichtig ist, dass du wieder einsteigst.',
    icon: 'repeat',
    metric: 'activeDays',
    window: { kind: 'rolling', days: 30 },
    target: 20,
    stages: ['Losgelegt', 'Rhythmus', 'Routine', 'Gewohnheit'],
  },
];

export function getChallenge(id: string | undefined): Challenge | undefined {
  return CHALLENGES.find((c) => c.id === id);
}
