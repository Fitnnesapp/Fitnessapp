import type { ImageSourcePropType } from 'react-native';

/**
 * Fotos der App. Solange ein Eintrag `null` ist, zeigt die App an dieser Stelle die Vektorgrafik.
 *
 * Neues Foto einbauen:
 * 1. Datei unter assets/photos/ ablegen (Dateiname und Format siehe docs/bildprompts.md)
 * 2. Hier `null` ersetzen durch `require('../../assets/photos/<datei>.jpg')`
 * Metro braucht feste Pfade in require(), deshalb steht jede Datei einzeln hier.
 */
export type PhotoSlot =
  | 'goal-muskeln'
  | 'goal-ausdauer'
  | 'goal-abnehmen'
  | 'goal-fitness'
  | 'goal-beweglichkeit'
  | 'hero-kraft'
  | 'hero-lauf'
  | 'hero-home'
  | 'challenge-winter-arc'
  | 'challenge-100k'
  | 'challenge-neustart'
  | 'challenge-gewohnheit';

export const PHOTOS: Record<PhotoSlot, ImageSourcePropType | null> = {
  'goal-muskeln': null,
  'goal-ausdauer': null,
  'goal-abnehmen': null,
  'goal-fitness': null,
  'goal-beweglichkeit': null,
  'hero-kraft': null,
  'hero-lauf': null,
  'hero-home': null,
  'challenge-winter-arc': null,
  'challenge-100k': null,
  'challenge-neustart': null,
  'challenge-gewohnheit': null,
};

/** Foto-Platz für eine Challenge-ID. */
export function challengePhotoSlot(challengeId: string): PhotoSlot {
  if (challengeId.startsWith('winter')) return 'challenge-winter-arc';
  if (challengeId.includes('km')) return 'challenge-100k';
  if (challengeId.includes('neujahr') || challengeId.includes('neustart')) return 'challenge-neustart';
  return 'challenge-gewohnheit';
}
