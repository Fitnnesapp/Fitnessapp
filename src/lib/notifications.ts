import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { nextReminderAt, reminderText } from '@/lib/logic/reminder';

/** Benachrichtigungen gibt es nur auf dem Handy. */
export const remindersSupported = Platform.OS !== 'web';

/** Fragt die Erlaubnis für Benachrichtigungen an. Wird erst beim Einschalten der Erinnerung aufgerufen. */
export async function requestReminderPermission(): Promise<boolean> {
  if (!remindersSupported) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Plant die nächste Erinnerung neu (oder entfernt sie). Es ist immer höchstens eine geplant. */
export async function syncStreakReminder(input: {
  enabled: boolean;
  currentStreak: number;
  trainedToday: boolean;
  now: number;
}): Promise<void> {
  if (!remindersSupported) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const at = nextReminderAt(input);
    if (at === null) return;

    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return;

    await Notifications.scheduleNotificationAsync({
      content: reminderText(input.currentStreak),
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at) },
    });
  } catch {
    // Eine fehlgeschlagene Erinnerung darf die App nie stören
  }
}
