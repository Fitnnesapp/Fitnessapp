import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useActivities } from '@/hooks/use-activities';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { streaks, weekStart } from '@/lib/logic/activity';
import { celebrate, ordinalText, weekEffectText } from '@/lib/logic/celebration';
import { WEEKLY_GOAL_DAYS } from '@/lib/logic/motivation';
import { nextSession, WEEKDAY_NAMES, weekGoalDays } from '@/lib/logic/plan';
import { usePlanStore } from '@/lib/storage/plan-store';

type CelebrationCardProps = {
  sessionId: string;
  headline: string;
  /** Neue Rekorde dieser Einheit als kurze Texte */
  records?: string[];
};

/**
 * Erfolgsmoment direkt nach einer Einheit: was du geschafft hast, was es für deine Woche bedeutet,
 * und was als Nächstes kommt. Die Belohnung folgt unmittelbar auf die Handlung (Gewohnheitsschleife).
 */
export function CelebrationCard({ sessionId, headline, records = [] }: CelebrationCardProps) {
  const theme = useTheme();
  const activities = useActivities();
  const plan = usePlanStore((state) => state.plan);
  const now = useNow(60_000);

  const session = activities.find((a) => a.id === sessionId);
  const goalDays = session ? weekGoalDays(plan, weekStart(session.startedAt), WEEKLY_GOAL_DAYS) : WEEKLY_GOAL_DAYS;
  const result = useMemo(() => celebrate(activities, sessionId, goalDays), [activities, sessionId, goalDays]);
  const streak = useMemo(() => streaks(activities, now), [activities, now]);
  const upcoming = plan ? nextSession(plan, now) : null;

  // Kurze Einblendung: Abzeichen wächst, Inhalt blendet ein. Bei "Bewegung reduzieren" sofort sichtbar.
  // useState statt useRef: der Wert wird beim Zeichnen gelesen (React-Compiler-Regel)
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) progress.setValue(1);
        else Animated.spring(progress, { toValue: 1, friction: 5, tension: 60, useNativeDriver: Platform.OS !== 'web' }).start();
      });
    return () => {
      cancelled = true;
    };
  }, [progress]);

  if (!result) return null;

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const hasRecords = records.length > 0;

  return (
    <Card style={[styles.card, { borderColor: theme.accent }]}>
      <Animated.View style={[styles.badge, { backgroundColor: theme.accent, transform: [{ scale }] }]}>
        <Ionicons name={hasRecords ? 'trophy' : 'checkmark'} size={44} color={theme.onAccent} />
      </Animated.View>

      <Animated.View style={[styles.body, { opacity: progress }]} accessibilityLiveRegion="polite">
        <AppText variant="eyebrow" color="accent" style={styles.center}>
          {ordinalText(result)}
        </AppText>
        <AppText variant="display" style={[styles.center, styles.headline]}>
          {headline}
        </AppText>

        {/* Wochenziel als Segmente: jeder Tag ein Stück, der neue leuchtet mit */}
        <View style={styles.segments} accessibilityLabel={weekEffectText(result.week)}>
          {Array.from({ length: Math.max(result.week.goal, result.week.activeDays) }, (_, i) => (
            <View
              key={i}
              style={[styles.segment, { backgroundColor: i < result.week.activeDays ? theme.accent : theme.surfaceAlt }]}
            />
          ))}
        </View>
        <AppText variant="heading" style={styles.center}>
          {weekEffectText(result.week)}
        </AppText>

        {streak.current > 1 ? (
          <View style={styles.inline}>
            <Ionicons name="flame" size={18} color={theme.accent} />
            <AppText color="textSecondary">{streak.current} Tage in Folge</AppText>
          </View>
        ) : null}

        {hasRecords ? (
          <View style={styles.records}>
            {records.map((label) => (
              <View key={label} style={[styles.record, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="trophy" size={14} color={theme.accent} />
                <AppText variant="label" color="accent">
                  {label}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}

        {upcoming ? (
          <View style={[styles.next, { borderTopColor: theme.border }]}>
            <AppText variant="eyebrow" color="textSecondary" style={styles.center}>
              Als Nächstes in deinem Plan
            </AppText>
            <AppText variant="heading" style={styles.center}>
              {upcoming.inDays === 0 ? 'Heute' : upcoming.inDays === 1 ? 'Morgen' : WEEKDAY_NAMES[upcoming.session.day]}:{' '}
              {upcoming.session.title}
            </AppText>
          </View>
        ) : null}
      </Animated.View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', borderWidth: 2, paddingVertical: Spacing.five, gap: Spacing.three },
  badge: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  body: { alignSelf: 'stretch', alignItems: 'center', gap: Spacing.two },
  center: { textAlign: 'center' },
  headline: { fontSize: 34, lineHeight: 38, fontWeight: '900' },
  segments: { flexDirection: 'row', gap: Spacing.one, alignSelf: 'stretch', marginTop: Spacing.two },
  segment: { flex: 1, height: 10, borderRadius: Radius.pill },
  inline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  records: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.two },
  record: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  next: { alignSelf: 'stretch', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.three, marginTop: Spacing.two, gap: 2 },
});
