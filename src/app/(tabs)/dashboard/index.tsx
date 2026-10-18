import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { PremiumPrompt } from '@/components/premium-prompt';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useActivities } from '@/hooks/use-activities';
import { getExercise } from '@/data/exercises';
import { useNow } from '@/hooks/use-now';
import { useSubscription } from '@/hooks/use-subscription';
import { useTheme } from '@/hooks/use-theme';
import { FREEZES_PER_MONTH, streaks, weekStart, weekStats } from '@/lib/logic/activity';
import { muscleVolume } from '@/lib/logic/analytics';
import { BADGES } from '@/lib/logic/badges';
import { formatDuration } from '@/lib/logic/format';
import { formatDistance, formatWeight } from '@/lib/logic/units';
import { useGamification } from '@/lib/storage/gamification-store';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useTheme();
  const units = useSettings((state) => state.units);
  const name = useSettings((state) => state.displayName).trim();
  const activities = useActivities();
  const now = useNow(60_000);
  const { isPremium } = useSubscription();
  const strengthHistory = useWorkouts((state) => state.history);
  const earned = useGamification((state) => state.earned);
  const unseen = useGamification((state) => state.unseen);
  const markSeen = useGamification((state) => state.markSeen);

  const week = useMemo(() => weekStats(activities, weekStart(now)), [activities, now]);
  const streak = useMemo(() => streaks(activities, now), [activities, now]);
  const muscles = useMemo(
    () => muscleVolume(strengthHistory, 30, now, (id) => getExercise(id)?.muscleGroup),
    [strengthHistory, now],
  );
  const maxVolume = Math.max(1, ...muscles.map((m) => m.volumeKg));
  const today = (new Date(now).getDay() + 6) % 7;

  return (
    <Screen>
      <AppText variant="display">{name ? `Hallo, ${name}.` : 'Hallo.'}</AppText>

      <Card>
        <View style={styles.streakRow}>
          <Ionicons name="flame" size={36} color={streak.current > 0 ? theme.accent : theme.textSecondary} />
          <View>
            <AppText variant="title">
              {streak.current} {streak.current === 1 ? 'Tag' : 'Tage'} in Folge
            </AppText>
            <AppText variant="caption" color="textSecondary">
              Längste Serie: {streak.longest} {streak.longest === 1 ? 'Tag' : 'Tage'}
            </AppText>
          </View>
        </View>
        <AppText variant="caption" color="textSecondary">
          Freezes diesen Monat: {streak.freezesLeft} von {FREEZES_PER_MONTH}. Ein Freeze rettet die Serie an einem
          Tag ohne Training.
        </AppText>
        {streak.atRisk ? (
          <AppText variant="caption" color="accent">
            Heute noch trainieren, um die Serie zu verlängern.
          </AppText>
        ) : null}
      </Card>

      {unseen.length > 0 ? (
        <Card>
          <AppText variant="label" color="accent">
            NEUES ABZEICHEN
          </AppText>
          {unseen.map((key) => (
            <AppText key={key} variant="heading">
              {BADGES.find((b) => b.key === key)?.name ?? key}
            </AppText>
          ))}
          <Button title="Super!" variant="secondary" onPress={markSeen} />
        </Card>
      ) : null}

      <AppText variant="heading">Diese Woche</AppText>
      <View style={styles.stats}>
        <Stat label="Workouts" value={String(week.workouts)} />
        <Stat label="Zeit" value={formatDuration(week.durationSeconds * 1000)} />
        <Stat label="Distanz" value={formatDistance(week.distanceM, units)} />
      </View>

      <Card>
        <View style={styles.days}>
          {DAYS.map((day, i) => (
            <View key={day} style={styles.day}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: week.perDay[i] > 0 ? theme.accent : theme.surfaceAlt,
                    borderColor: i === today ? theme.text : 'transparent',
                  },
                ]}>
                {week.perDay[i] > 0 ? (
                  <AppText variant="label" style={{ color: theme.onAccent }}>
                    {week.perDay[i]}
                  </AppText>
                ) : null}
              </View>
              <AppText variant="caption" color={i === today ? 'text' : 'textSecondary'}>
                {day}
              </AppText>
            </View>
          ))}
        </View>
        <AppText variant="caption" color="textSecondary">
          Kraft {week.byType.strength} · Home {week.byType.home} · Laufen {week.byType.running}
        </AppText>
      </Card>

      <AppText variant="heading">Muskelgruppen (30 Tage)</AppText>
      {isPremium ? (
        <Card>
          {muscles.length === 0 ? (
            <AppText color="textSecondary">Noch kein Krafttraining in den letzten 30 Tagen.</AppText>
          ) : (
            muscles.map((m) => (
              <View key={m.group} style={styles.muscleRow}>
                <AppText style={styles.muscleName}>{m.group}</AppText>
                <View style={[styles.barTrack, { backgroundColor: theme.surfaceAlt }]}>
                  <View
                    style={[styles.barFill, { backgroundColor: theme.accent, width: `${Math.round((m.volumeKg / maxVolume) * 100)}%` }]}
                  />
                </View>
                <AppText variant="caption" color="textSecondary" style={styles.muscleValue}>
                  {formatWeight(m.volumeKg, units)}
                </AppText>
              </View>
            ))
          )}
        </Card>
      ) : (
        <PremiumPrompt
          title="Muskelgruppen-Analyse"
          text="Sieh, welche Muskelgruppen du in den letzten 30 Tagen wie stark trainiert hast."
        />
      )}

      <Card onPress={() => router.push('/dashboard/badges')}>
        <AppText variant="heading">Abzeichen</AppText>
        <AppText color="textSecondary">
          {Object.keys(earned).length} von {BADGES.length} erreicht
        </AppText>
      </Card>

      <Button title="Training starten" onPress={() => router.push('/training')} />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.stat}>
      <AppText variant="label" color="textSecondary">
        {label.toUpperCase()}
      </AppText>
      <AppText variant="heading">{value}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  stats: { flexDirection: 'row', gap: Spacing.two },
  stat: { flex: 1, padding: Spacing.three, gap: Spacing.one },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  muscleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  muscleName: { width: 84 },
  barTrack: { flex: 1, height: 10, borderRadius: Radius.pill, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Radius.pill },
  muscleValue: { width: 64, textAlign: 'right' },
  day: { alignItems: 'center', gap: Spacing.one },
  dot: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
