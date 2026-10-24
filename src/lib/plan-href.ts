import type { Href } from 'expo-router';

import type { PlanSession } from '@/lib/logic/plan';

/** Wohin eine geplante Einheit beim Starten führt. */
export function hrefForSession(session: PlanSession): Href {
  if (session.kind === 'strength') return '/training/strength';
  if (session.kind === 'run') return '/training/running';
  return { pathname: '/training/program/[id]', params: { id: session.programId ?? '' } };
}
