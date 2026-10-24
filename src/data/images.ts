import type { ImageSourcePropType } from 'react-native';

/**
 * Bilder der App. Einmalig als 3D-Szenen gerendert (Licht, Spiegelungen, Tiefenunschärfe),
 * keine Fotos echter Personen und keine fremden Bildrechte. Die Render-Skripte liegen nicht im Repo.
 */
export const SCENES = {
  'hero-kraft': require('../../assets/images/scenes/hero-kraft.jpg'),
  'hero-lauf': require('../../assets/images/scenes/hero-lauf.jpg'),
  'hero-home': require('../../assets/images/scenes/hero-home.jpg'),
  'challenge-winter-arc': require('../../assets/images/scenes/challenge-winter-arc.jpg'),
  'challenge-100k': require('../../assets/images/scenes/challenge-100k.jpg'),
  'challenge-neustart': require('../../assets/images/scenes/challenge-neustart.jpg'),
  'challenge-gewohnheit': require('../../assets/images/scenes/challenge-gewohnheit.jpg'),
  'goal-muskeln': require('../../assets/images/scenes/goal-muskeln.jpg'),
  'goal-ausdauer': require('../../assets/images/scenes/goal-ausdauer.jpg'),
  'goal-abnehmen': require('../../assets/images/scenes/goal-abnehmen.jpg'),
  'goal-fitness': require('../../assets/images/scenes/goal-fitness.jpg'),
  'goal-beweglichkeit': require('../../assets/images/scenes/goal-beweglichkeit.jpg'),
} satisfies Record<string, ImageSourcePropType>;

export type SceneKey = keyof typeof SCENES;

/** Bild zu einer Trainingsart. */
export function sceneForKind(kind: 'strength' | 'run' | 'program' | 'rest'): ImageSourcePropType {
  if (kind === 'strength') return SCENES['hero-kraft'];
  if (kind === 'run') return SCENES['hero-lauf'];
  if (kind === 'program') return SCENES['hero-home'];
  return SCENES['challenge-neustart'];
}

/** Titelbild zu einer Challenge-ID. */
export function sceneForChallenge(challengeId: string): ImageSourcePropType {
  if (challengeId.startsWith('winter')) return SCENES['challenge-winter-arc'];
  if (challengeId.includes('km')) return SCENES['challenge-100k'];
  if (challengeId.includes('neujahr') || challengeId.includes('neustart')) return SCENES['challenge-neustart'];
  return SCENES['challenge-gewohnheit'];
}
