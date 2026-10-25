import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { Stat } from '@/components/ui/stat';
import { Radius, Spacing } from '@/constants/theme';
import { useActivities } from '@/hooks/use-activities';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { weekStart, type ActivityType } from '@/lib/logic/activity';
import { WEEKLY_GOAL_DAYS } from '@/lib/logic/motivation';
import { weekGoalDays } from '@/lib/logic/plan';
import type { Units } from '@/lib/logic/units';
import { bestWeek, lastWeekReview, lifetimeTotals, weeklyTotals } from '@/lib/logic/weekly-review';
import { usePlanStore } from '@/lib/storage/plan-store';
import { useSettings } from '@/lib/storage/settings-store';

const TREND_WEEKS = 8;
const WEEKDAY_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const BAR_MAX = 110;

const TYPE_LABEL: Record<ActivityType, string> = { strength: 'Krafttraining', running: 'Lauf', home: 'Home-Workout' };

function hoursParts(minutes: number): { value: string; unit: string } {
  if (minutes < 60) return { value: String(minutes), unit: 'Min' };
  return { value: `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`, unit: 'Std' };
}

function distanceValue(meters: number, units: Units): { value: string; unit: string } {
  const v = units === 'metric' ? meters / 1000 : meters / 1609.344;
  return { value: v >= 100 ? String(Math.round(v)) : v.toFixed(1).replace('.', ','), unit: units === 'metric' ? 'km' : 'mi' };
}

/**
 * Kopf von "Fortschritt": Rückblick auf die letzte Woche, Trend über acht Wochen und Gesamtbilanz.
 * Sichtbarer Fortschritt ist einer der stärksten Motivatoren (Progress Principle); verglichen wird nur mit dir selbst.
 */
export function ProgressOverview() {
  const theme = useTheme();
  const now = useNow(60_000);
  const units = useSettings((state) => state.units);
  const plan = usePlanStore((state) => state.plan);
  const activities = useActivities();

  const lastStart = weekStart(weekStart(now) - 43_200_000);
  const goal = weekGoalDays(plan, lastStart, WEEKLY_GOAL_DAYS);
  const review = useMemo(() => lastWeekReview(activities, now, goal), [activities, now, goal]);
  const trend = useMemo(() => weeklyTotals(activities, now, TREND_WEEKS), [activities, now]);
  const best = bestWeek(trend);
  const lifetime = useMemo(() => lifetimeTotals(activities), [activities]);
  const maxMinutes = Math.max(1, ...trend.map((t) => t.minutes));
  const average = Math.round(trend.slice(0, -1).reduce((s, t) => s + t.minutes, 0) / Math.max(1, trend.length - 1));

  const reviewTime = hoursParts(review.minutes);
  const reviewDistance = distanceValue(review.distanceM, units);
  const totalTime = hoursParts(lifetime.minutes);
  const totalDistance = distanceValue(lifetime.distanceM, units);

  return (
    <View style={styles.wrap}>
      <AppText variant="display" style={styles.headline}>
        Fortschritt
      </AppText>

      {/* 1. Wochenrückblick */}
      <Card style={styles.card}>
        <AppText variant="eyebrow" color="accent">
          Rückblick · KW {review.week}
        </AppText>
        <AppText variant="hero" style={styles.reviewTitle}>
          {review.message}
        </AppText>

        <View style={[styles.stats, { borderColor: theme.border }]}>
          <Stat label="Einheiten" value={String(review.sessions)} style={styles.flex} />
          <Stat label="Zeit" value={reviewTime.value} unit={reviewTime.unit} style={styles.flex} />
          <Stat label="Distanz" value={reviewDistance.value} unit={reviewDistance.unit} style={styles.flex} />
        </View>

        <View style={styles.segments} accessibilityLabel={`${review.activeDays} von ${review.goal} Trainingstagen`}>
          {Array.from({ length: Math.max(review.goal, review.activeDays) }, (_, i) => (
            <View key={i} style={[styles.segment, { backgroundColor: i < review.activeDays ? theme.accent : theme.surfaceAlt }]} />
          ))}
        </View>
        <AppText variant="caption" color="textSecondary">
          {review.activeDays} von {review.goal} {review.goal === 1 ? 'Trainingstag' : 'Trainingstagen'}
          {review.goalReached ? ' · Wochenziel geschafft' : ''}
        </AppText>

        {review.longest ? (
          <View style={styles.inline}>
            <Ionicons name="star" size={16} color={theme.accent} />
            <AppText variant="caption" color="textSecondary" style={styles.flex}>
              Längste Einheit: {TYPE_LABEL[review.longest.type]}, {Math.round(review.longest.durationSeconds / 60)} Min am{' '}
              {WEEKDAY_LONG[new Date(review.longest.startedAt).getDay()]}
            </AppText>
          </View>
        ) : null}
      </Card>

      {/* 2. Trend über acht Wochen */}
      <SectionHeader title="Trend" />
      <Card style={styles.card}>
        <View style={styles.trendHead}>
          <View style={styles.flex}>
            <AppText variant="eyebrow" color="textSecondary">
              Minuten pro Woche
            </AppText>
            <AppText variant="heading">
              {average > 0 ? `Ø ${average} Min in den letzten ${TREND_WEEKS - 1} Wochen` : 'Die letzten 8 Wochen'}
            </AppText>
          </View>
        </View>
        <View style={styles.chart} accessibilityLabel={trend.map((t) => `KW ${t.week}: ${t.minutes} Minuten`).join(', ')}>
          {trend.map((t, i) => {
            const current = i === trend.length - 1;
            const height = t.minutes > 0 ? Math.max(6, Math.round((t.minutes / maxMinutes) * BAR_MAX)) : 4;
            return (
              <View key={t.start} style={styles.barCol}>
                <AppText variant="caption" color={current ? 'text' : 'textSecondary'} style={styles.barValue} numberOfLines={1}>
                  {t.minutes > 0 ? t.minutes : ''}
                </AppText>
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor: t.minutes === 0 ? theme.surfaceAlt : theme.accent,
                      opacity: current || t.minutes === 0 ? 1 : 0.45,
                    },
                  ]}
                />
                <AppText variant="eyebrow" color={current ? 'text' : 'textSecondary'} style={styles.barLabel}>
                  {current ? 'Jetzt' : t.week}
                </AppText>
              </View>
            );
          })}
        </View>
        {best ? (
          <View style={styles.inline}>
            <Ionicons name="trophy" size={16} color={theme.accent} />
            <AppText variant="caption" color="textSecondary">
              Deine aktivste Woche: KW {best.week} mit {best.minutes} Min
            </AppText>
          </View>
        ) : (
          <AppText variant="caption" color="textSecondary">
            Sobald du trainierst, wächst hier dein Trend.
          </AppText>
        )}
      </Card>

      {/* 3. Gesamtbilanz */}
      <SectionHeader title="Gesamt" />
      <Card style={styles.card}>
        <View style={styles.grid}>
          <Stat label="Einheiten" value={String(lifetime.sessions)} size="large" style={styles.half} />
          <Stat label="Trainingstage" value={String(lifetime.activeDays)} size="large" style={styles.half} />
          <Stat label="Zeit" value={totalTime.value} unit={totalTime.unit} size="large" style={styles.half} />
          <Stat label="Distanz" value={totalDistance.value} unit={totalDistance.unit} size="large" style={styles.half} />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.three },
  flex: { flex: 1 },
  headline: { fontSize: 38, lineHeight: 42, fontWeight: '900' },
  card: { gap: Spacing.three },
  reviewTitle: { fontSize: 24, lineHeight: 29, fontWeight: '900' },
  stats: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segments: { flexDirection: 'row', gap: Spacing.one },
  segment: { flex: 1, height: 10, borderRadius: Radius.pill },
  inline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },

  trendHead: { flexDirection: 'row', alignItems: 'flex-end' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two, height: BAR_MAX + 44 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: { alignSelf: 'stretch', borderRadius: Radius.small },
  barValue: { fontSize: 11, fontVariant: ['tabular-nums'] },
  barLabel: { fontSize: 10 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: Spacing.three },
  half: { flexBasis: '50%', flexGrow: 0 },
});
