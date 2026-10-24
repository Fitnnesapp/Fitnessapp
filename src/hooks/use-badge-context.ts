import { useMemo } from 'react';

import { useActivities } from '@/hooks/use-activities';
import { useNow } from '@/hooks/use-now';
import { streaks } from '@/lib/logic/activity';
import type { BadgeContext } from '@/lib/logic/badges';
import { findRecords } from '@/lib/logic/personal-records';
import { findRunRecords } from '@/lib/logic/run-stats';
import { useHomeSessions } from '@/lib/storage/home-store';
import { useRunStore } from '@/lib/storage/run-store';
import { useWorkouts } from '@/lib/storage/workout-store';

/** Alle Kennzahlen, nach denen Abzeichen vergeben werden, aus dem lokalen Verlauf. */
export function useBadgeContext(): BadgeContext {
  const activities = useActivities();
  const strength = useWorkouts((state) => state.history);
  const home = useHomeSessions((state) => state.sessions);
  const runs = useRunStore((state) => state.history);
  const now = useNow(60_000);

  const longestStreak = useMemo(() => streaks(activities, now).longest, [activities, now]);
  const longestRunM = useMemo(() => Math.max(0, ...runs.map((r) => r.distanceM)), [runs]);
  const recordCount = useMemo(
    () =>
      findRecords([...strength].sort((a, b) => a.startedAt - b.startedAt)).size +
      findRunRecords([...runs].sort((a, b) => a.startedAt - b.startedAt)).size,
    [strength, runs],
  );

  return useMemo(
    () => ({
      strengthCount: strength.length,
      homeCount: home.length,
      runCount: runs.length,
      longestRunM,
      recordCount,
      longestStreak,
    }),
    [strength.length, home.length, runs.length, longestRunM, recordCount, longestStreak],
  );
}
