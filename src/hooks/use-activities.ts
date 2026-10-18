import { useMemo } from 'react';

import type { Activity } from '@/lib/logic/activity';
import { useHomeSessions } from '@/lib/storage/home-store';
import { useRunStore } from '@/lib/storage/run-store';
import { useWorkouts } from '@/lib/storage/workout-store';

/** Alle abgeschlossenen Workouts der drei Trainingsarten in einer einheitlichen Form. */
export function useActivities(): Activity[] {
  const strength = useWorkouts((state) => state.history);
  const home = useHomeSessions((state) => state.sessions);
  const runs = useRunStore((state) => state.history);

  return useMemo(
    () => [
      ...strength.map((w): Activity => ({
        id: w.id,
        type: 'strength',
        startedAt: w.startedAt,
        durationSeconds: Math.max(0, Math.round((w.endedAt - w.startedAt) / 1000)),
        distanceM: 0,
      })),
      ...home.map((s): Activity => ({
        id: s.id,
        type: 'home',
        startedAt: s.startedAt,
        durationSeconds: s.activeSeconds,
        distanceM: 0,
      })),
      ...runs.map((r): Activity => ({
        id: r.id,
        type: 'running',
        startedAt: r.startedAt,
        durationSeconds: r.durationSeconds,
        distanceM: r.distanceM,
      })),
    ],
    [strength, home, runs],
  );
}
