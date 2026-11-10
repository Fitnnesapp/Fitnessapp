import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { ifThenSentence, isPlanPaused, sessionForDay, type TrainingPlan } from '@/lib/logic/plan';
import {
  nextPlanReminderAt,
  nextReminderAt,
  pickReminder,
  planReminderPassedToday,
  reminderText,
  sameDay,
  type ScheduledReminder,
} from '@/lib/logic/reminder';

/** Benachrichtigungen gibt es nur auf dem Handy. */
export const remindersSupported = Platform.OS !== 'web';

/** Fragt die Erlaubnis für Benachrichtigungen an. Wird erst beim Einschalten der Erinnerung aufgerufen. */
export async function requestReminderPermission(): Promise<boolean> {
  if (!remindersSupported) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Plan-Erinnerung mit dem Wenn-Dann-Satz der Einheit dieses Tages. */
function planReminder(plan: TrainingPlan | null, enabled: boolean, trainedToday: boolean, now: number): ScheduledReminder | null {
  if (!plan) return null;
  const planDays = [...new Set(plan.sessions.filter((session) => !session.extra).map((session) => session.day))];
  const at = nextPlanReminderAt({
    enabled,
    planDays,
    time: plan.answers.time,
    // In einer Pause kommt die nächste Erinnerung erst am ersten Trainingstag danach
    startsAt: plan.pause && isPlanPaused(plan, now) ? Math.max(plan.startsAt, plan.pause.until) : plan.startsAt,
    trainedToday,
    now,
  });
  if (at === null) return null;
  const session = sessionForDay(plan, at);
  if (!session) return null;
  return { at, title: `Heute: ${session.title}`, body: ifThenSentence(session, plan.answers.time) };
}

/**
 * Plant die nächste Erinnerung neu (oder entfernt sie). Es ist immer höchstens eine geplant:
 * die geplante Einheit zur gewählten Tageszeit oder, falls früher, die Serien-Erinnerung um 19 Uhr.
 */
export async function syncStreakReminder(input: {
  enabled: boolean;
  currentStreak: number;
  trainedToday: boolean;
  now: number;
  plan?: TrainingPlan | null;
}): Promise<void> {
  if (!remindersSupported) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    let streakAt = nextReminderAt(input);
    // Während einer Plan-Pause (Krankheit, Urlaub) gibt es auch keine Serien-Erinnerung
    if (streakAt !== null && input.plan && isPlanPaused(input.plan, streakAt)) streakAt = null;
    // Kam heute schon die Plan-Erinnerung, entfällt die Serien-Erinnerung am selben Abend
    if (streakAt !== null && input.plan && sameDay(streakAt, input.now)) {
      const planDays = [...new Set(input.plan.sessions.filter((s) => !s.extra).map((s) => s.day))];
      const passed = planReminderPassedToday({
        planDays,
        time: input.plan.answers.time,
        startsAt: input.plan.startsAt,
        now: input.now,
      });
      if (passed) streakAt = null;
    }
    const reminder = pickReminder(
      planReminder(input.plan ?? null, input.enabled, input.trainedToday, input.now),
      streakAt === null ? null : { at: streakAt, ...reminderText(input.currentStreak) },
    );
    if (!reminder) return;

    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return;

    await Notifications.scheduleNotificationAsync({
      content: { title: reminder.title, body: reminder.body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(reminder.at) },
    });
  } catch {
    // Eine fehlgeschlagene Erinnerung darf die App nie stören
  }
}
