import * as Notifications from 'expo-notifications';
import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';

import { useActivities } from '@/hooks/use-activities';
import { useNow } from '@/hooks/use-now';
import { streaks } from '@/lib/logic/activity';
import { earnedBadges, newlyEarned } from '@/lib/logic/badges';
import { findRecords } from '@/lib/logic/personal-records';
import { findRunRecords } from '@/lib/logic/run-stats';
import { syncStreakReminder } from '@/lib/notifications';
import { useGamification } from '@/lib/storage/gamification-store';
import { useHomeSessions } from '@/lib/storage/home-store';
import { useRunStore } from '@/lib/storage/run-store';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';

if (Platform.OS !== 'web') {
  // Erinnerungen auch anzeigen, wenn die App gerade offen ist
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Unsichtbare Komponente: vergibt neue Abzeichen und plant die Serien-Erinnerung neu,
 * sobald sich Workouts oder Einstellungen ändern.
 */
export function GamificationSync() {
  const activities = useActivities();
  const strength = useWorkouts((state) => state.history);
  const home = useHomeSessions((state) => state.sessions);
  const runs = useRunStore((state) => state.history);
  const earned = useGamification((state) => state.earned);
  const award = useGamification((state) => state.award);
  const reminderOn = useSettings((state) => state.streakReminder);
  const now = useNow(60_000);

  const streak = useMemo(() => streaks(activities, now), [activities, now]);
  const { current: currentStreak, trainedToday, longest: longestStreak } = streak;

  const longestRunM = useMemo(() => Math.max(0, ...runs.map((r) => r.distanceM)), [runs]);
  const recordCount = useMemo(
    () =>
      findRecords([...strength].sort((a, b) => a.startedAt - b.startedAt)).size +
      findRunRecords([...runs].sort((a, b) => a.startedAt - b.startedAt)).size,
    [strength, runs],
  );

  useEffect(() => {
    const keys = earnedBadges({
      strengthCount: strength.length,
      homeCount: home.length,
      runCount: runs.length,
      longestRunM,
      recordCount,
      longestStreak,
    });
    const fresh = newlyEarned(keys, earned);
    if (fresh.length > 0) award(fresh);
  }, [strength.length, home.length, runs.length, longestRunM, recordCount, longestStreak, earned, award]);

  useEffect(() => {
    void syncStreakReminder({
      enabled: reminderOn,
      currentStreak,
      trainedToday,
      now,
    });
  }, [reminderOn, currentStreak, trainedToday, now]);

  return null;
}
