import type { Href } from 'expo-router';

import { getRoutine } from '@/data/routines';
import type { PlanAnswers, PlanSession } from '@/lib/logic/plan';
import { routineIdForPlanFocus } from '@/lib/logic/routines';

/**
 * Wohin eine geplante Einheit beim Starten führt. Kraft-Einheiten öffnen das passende fertige Workout,
 * wenn es eines gibt (sonst die Kraft-Seite mit Tagesempfehlung).
 */
export function hrefForSession(session: PlanSession, answers?: PlanAnswers): Href {
  if (session.kind === 'strength') {
    const routineId = answers ? routineIdForPlanFocus(session.title, answers) : null;
    if (routineId && getRoutine(routineId)) return { pathname: '/training/routine/[id]', params: { id: routineId } };
    return '/training/strength';
  }
  if (session.kind === 'run') return '/training/running';
  return { pathname: '/training/program/[id]', params: { id: session.programId ?? '' } };
}
