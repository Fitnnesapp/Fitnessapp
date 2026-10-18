export type BadgeKey =
  | 'first_workout'
  | 'workouts_10'
  | 'workouts_50'
  | 'first_5k'
  | 'first_10k'
  | 'first_record'
  | 'home_10'
  | 'streak_7'
  | 'streak_30'
  | 'all_rounder';

export type Badge = {
  key: BadgeKey;
  name: string;
  description: string;
  icon: string;
};

export const BADGES: readonly Badge[] = [
  { key: 'first_workout', name: 'Erster Schritt', description: 'Dein erstes Workout abgeschlossen', icon: 'footsteps-outline' },
  { key: 'workouts_10', name: 'Dranbleiber', description: '10 Workouts abgeschlossen', icon: 'ribbon-outline' },
  { key: 'workouts_50', name: 'Stammgast', description: '50 Workouts abgeschlossen', icon: 'medal-outline' },
  { key: 'first_5k', name: 'Erste 5 km', description: 'Einen Lauf über mindestens 5 km geschafft', icon: 'walk-outline' },
  { key: 'first_10k', name: 'Erste 10 km', description: 'Einen Lauf über mindestens 10 km geschafft', icon: 'speedometer-outline' },
  { key: 'first_record', name: 'Neue Bestmarke', description: 'Den ersten persönlichen Rekord aufgestellt', icon: 'trophy-outline' },
  { key: 'home_10', name: 'Zuhause stark', description: '10 Home-Workouts abgeschlossen', icon: 'home-outline' },
  { key: 'streak_7', name: 'Eine Woche am Ball', description: '7 Trainingstage in Folge', icon: 'flame-outline' },
  { key: 'streak_30', name: 'Ein Monat am Ball', description: '30 Trainingstage in Folge', icon: 'bonfire-outline' },
  { key: 'all_rounder', name: 'Allrounder', description: 'Kraft, Home-Workout und Lauf mindestens je einmal gemacht', icon: 'apps-outline' },
];

/** Alles, was zur Bewertung der Abzeichen nötig ist. */
export type BadgeContext = {
  strengthCount: number;
  homeCount: number;
  runCount: number;
  /** Weiteste Laufdistanz in Metern */
  longestRunM: number;
  /** Anzahl persönlicher Rekorde in Kraft und Laufen zusammen */
  recordCount: number;
  /** Längste jemals erreichte Serie */
  longestStreak: number;
};

/** Alle Abzeichen, deren Bedingung erfüllt ist. */
export function earnedBadges(ctx: BadgeContext): BadgeKey[] {
  const total = ctx.strengthCount + ctx.homeCount + ctx.runCount;

  const rules: Record<BadgeKey, boolean> = {
    first_workout: total >= 1,
    workouts_10: total >= 10,
    workouts_50: total >= 50,
    first_5k: ctx.longestRunM >= 5000,
    first_10k: ctx.longestRunM >= 10000,
    first_record: ctx.recordCount >= 1,
    home_10: ctx.homeCount >= 10,
    streak_7: ctx.longestStreak >= 7,
    streak_30: ctx.longestStreak >= 30,
    all_rounder: ctx.strengthCount >= 1 && ctx.homeCount >= 1 && ctx.runCount >= 1,
  };

  return BADGES.filter((b) => rules[b.key]).map((b) => b.key);
}

/** Abzeichen, die noch nicht vergeben wurden. Jedes Abzeichen wird so nur ein einziges Mal vergeben. */
export function newlyEarned(earned: BadgeKey[], alreadyAwarded: Record<string, number>): BadgeKey[] {
  return earned.filter((key) => !(key in alreadyAwarded));
}
