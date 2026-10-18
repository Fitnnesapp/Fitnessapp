import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useActivities } from '@/hooks/use-activities';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { streaks, weekStart, weekStats } from '@/lib/logic/activity';
import { formatDuration } from '@/lib/logic/format';
import { formatDistance } from '@/lib/logic/units';
import { useSettings } from '@/lib/storage/settings-store';

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useTheme();
  const units = useSettings((state) => state.units);
  const name = useSettings((state) => state.displayName).trim();
  const activities = useActivities();
  const now = useNow(60_000);

  const week = useMemo(() => weekStats(activities, weekStart(now)), [activities, now]);
  const streak = useMemo(() => streaks(activities, now), [activities, now]);
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
      </Card>

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
