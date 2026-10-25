import type { Program } from '../../types/home.ts';
import { programMinutes } from './timeline.ts';

/**
 * "Kurz & knackig": die kürzeste Einheit, die man gerade nutzen darf.
 * Eine sehr kleine Hürde macht den Start an vollen Tagen wahrscheinlicher (Fogg, Tiny Habits, 2019);
 * Hauptsache, die Gewohnheit reißt nicht ab.
 */
export function quickestProgram(
  programs: readonly Program[],
  canUse: (programId: string) => boolean,
): { program: Program; minutes: number } | null {
  let best: { program: Program; minutes: number } | null = null;
  for (const program of programs) {
    if (!canUse(program.id)) continue;
    const minutes = programMinutes(program);
    // Bei gleicher Dauer gewinnt die einsteigerfreundlichere Einheit
    const easier = best !== null && minutes === best.minutes && program.difficulty === 'Einsteiger' && best.program.difficulty !== 'Einsteiger';
    if (best === null || minutes < best.minutes || easier) best = { program, minutes };
  }
  return best;
}
