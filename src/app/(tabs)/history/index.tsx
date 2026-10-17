import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';
import { dayKey, formatDate, formatDuration, formatTime } from '@/lib/logic/format';
import { formatWeight } from '@/lib/logic/units';
import { summarizeWorkout } from '@/lib/logic/workout-stats';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';
import type { StrengthWorkout } from '@/types/workout';

type Section = { key: string; title: string; data: StrengthWorkout[] };

export default function HistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const units = useSettings((state) => state.units);
  const history = useWorkouts((state) => state.history);

  // Neueste zuerst, gruppiert nach Kalendertag
  const sections = useMemo(() => {
    const byDay = new Map<string, Section>();
    for (const workout of [...history].sort((a, b) => b.startedAt - a.startedAt)) {
      const key = dayKey(workout.startedAt);
      const section = byDay.get(key) ?? { key, title: formatDate(workout.startedAt), data: [] };
      section.data.push(workout);
      byDay.set(key, section);
    }
    return [...byDay.values()];
  }, [history]);

  return (
    <SectionList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(workout) => workout.id}
      stickySectionHeadersEnabled={false}
      ListEmptyComponent={
        <Card>
          <AppText variant="heading">Noch keine Workouts</AppText>
          <AppText color="textSecondary">Sobald du ein Workout beendest, erscheint es hier.</AppText>
        </Card>
      }
      renderSectionHeader={({ section }) => (
        <AppText variant="label" color="textSecondary" style={styles.sectionHeader}>
          {section.title.toUpperCase()}
        </AppText>
      )}
      renderItem={({ item }) => {
        const summary = summarizeWorkout(item, (id) => getExercise(id)?.muscleGroup);
        const names = item.exercises.map((e) => getExercise(e.exerciseId)?.name ?? e.exerciseId).join(', ');

        return (
          <Card onPress={() => router.push({ pathname: '/history/[id]', params: { id: item.id } })}>
            <View style={styles.row}>
              <AppText variant="heading">Kraft</AppText>
              <AppText color="textSecondary">{formatTime(item.startedAt)}</AppText>
            </View>
            <AppText variant="caption" color="textSecondary" numberOfLines={2}>
              {names}
            </AppText>
            <AppText variant="caption">
              {formatDuration(summary.durationMs)} · {formatWeight(summary.volumeKg, units)} · {summary.workingSets} {summary.workingSets === 1 ? 'Satz' : 'Sätze'}
            </AppText>
          </Card>
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  sectionHeader: { marginTop: Spacing.three, marginBottom: Spacing.two },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  separator: { height: Spacing.two },
});
