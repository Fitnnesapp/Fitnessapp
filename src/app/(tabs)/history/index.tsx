import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { getProgram } from '@/data/programs';
import { getExercise } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';
import { dayKey, formatDate, formatDuration, formatTime } from '@/lib/logic/format';
import { formatWeight } from '@/lib/logic/units';
import { summarizeWorkout } from '@/lib/logic/workout-stats';
import { useHomeSessions } from '@/lib/storage/home-store';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';
import type { HomeSession } from '@/types/home';
import type { StrengthWorkout } from '@/types/workout';

type Entry =
  | { kind: 'strength'; startedAt: number; workout: StrengthWorkout }
  | { kind: 'home'; startedAt: number; session: HomeSession };

type Section = { key: string; title: string; data: Entry[] };

export default function HistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const units = useSettings((state) => state.units);
  const history = useWorkouts((state) => state.history);
  const sessions = useHomeSessions((state) => state.sessions);

  // Alle Trainingsarten gemeinsam, neueste zuerst, gruppiert nach Kalendertag
  const sections = useMemo(() => {
    const entries: Entry[] = [
      ...history.map((workout): Entry => ({ kind: 'strength', startedAt: workout.startedAt, workout })),
      ...sessions.map((session): Entry => ({ kind: 'home', startedAt: session.startedAt, session })),
    ].sort((a, b) => b.startedAt - a.startedAt);

    const byDay = new Map<string, Section>();
    for (const entry of entries) {
      const key = dayKey(entry.startedAt);
      const section = byDay.get(key) ?? { key, title: formatDate(entry.startedAt), data: [] };
      section.data.push(entry);
      byDay.set(key, section);
    }
    return [...byDay.values()];
  }, [history, sessions]);

  return (
    <SectionList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(entry) => (entry.kind === 'strength' ? entry.workout.id : entry.session.id)}
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
        if (item.kind === 'home') {
          const { session } = item;
          const program = getProgram(session.programId);

          return (
            <Card onPress={() => router.push({ pathname: '/history/[id]', params: { id: session.id } })}>
              <View style={styles.row}>
                <AppText variant="heading">Home-Workout</AppText>
                <AppText color="textSecondary">{formatTime(session.startedAt)}</AppText>
              </View>
              <AppText variant="caption" color="textSecondary">
                {program?.name ?? 'Programm'}
                {session.completed ? '' : ' · vorzeitig beendet'}
              </AppText>
              <AppText variant="caption">
                {formatDuration(session.activeSeconds * 1000)} · ca. {session.caloriesEstimate} kcal
              </AppText>
            </Card>
          );
        }

        const { workout } = item;
        const summary = summarizeWorkout(workout, (id) => getExercise(id)?.muscleGroup);
        const names = workout.exercises.map((e) => getExercise(e.exerciseId)?.name ?? e.exerciseId).join(', ');

        return (
          <Card onPress={() => router.push({ pathname: '/history/[id]', params: { id: workout.id } })}>
            <View style={styles.row}>
              <AppText variant="heading">Kraft</AppText>
              <AppText color="textSecondary">{formatTime(workout.startedAt)}</AppText>
            </View>
            <AppText variant="caption" color="textSecondary" numberOfLines={2}>
              {names}
            </AppText>
            <AppText variant="caption">
              {formatDuration(summary.durationMs)} · {formatWeight(summary.volumeKg, units)} · {summary.workingSets}{' '}
              {summary.workingSets === 1 ? 'Satz' : 'Sätze'}
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
