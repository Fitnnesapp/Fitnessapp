import * as Notifications from 'expo-notifications';
import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';

import { useActivities } from '@/hooks/use-activities';
import { useBadgeContext } from '@/hooks/use-badge-context';
import { useNow } from '@/hooks/use-now';
import { streaks } from '@/lib/logic/activity';
import { earnedBadges, newlyEarned } from '@/lib/logic/badges';
import { syncStreakReminder } from '@/lib/notifications';
import { useGamification } from '@/lib/storage/gamification-store';
import { useSettings } from '@/lib/storage/settings-store';

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
  const badgeContext = useBadgeContext();
  const earned = useGamification((state) => state.earned);
  const award = useGamification((state) => state.award);
  const reminderOn = useSettings((state) => state.streakReminder);
  const now = useNow(60_000);

  const streak = useMemo(() => streaks(activities, now), [activities, now]);
  const { current: currentStreak, trainedToday } = streak;

  useEffect(() => {
    const fresh = newlyEarned(earnedBadges(badgeContext), earned);
    if (fresh.length > 0) award(fresh);
  }, [badgeContext, earned, award]);

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
