import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';

import { MonthCalendar } from '@/components/month-calendar';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { getProgram } from '@/data/programs';
import { getExercise } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';
import { dayKey, formatClock, formatDate, formatDuration, formatTime } from '@/lib/logic/format';
import { paceSecPerKm } from '@/lib/logic/run-stats';
import { formatDistance, formatPace, formatWeight, paceUnitLabel } from '@/lib/logic/units';
import { summarizeWorkout } from '@/lib/logic/workout-stats';
import { useHomeSessions } from '@/lib/storage/home-store';
import { useRunStore } from '@/lib/storage/run-store';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';
import type { HomeSession } from '@/types/home';
import type { RunSession } from '@/types/running';
import type { StrengthWorkout } from '@/types/workout';

type Entry =
  | { kind: 'strength'; startedAt: number; workout: StrengthWorkout }
  | { kind: 'home'; startedAt: number; session: HomeSession }
  | { kind: 'run'; startedAt: number; run: RunSession };

type Section = { key: string; title: string; data: Entry[] };

const TYPE_ICON = {
  strength: 'barbell-outline',
  home: 'home-outline',
  run: 'walk-outline',
} as const;

function TypeTitle({ kind, label }: { kind: Entry['kind']; label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.titleRow}>
      <Ionicons name={TYPE_ICON[kind]} size={22} color={theme.accent} />
      <AppText variant="heading">{label}</AppText>
    </View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const units = useSettings((state) => state.units);
  const history = useWorkouts((state) => state.history);
  const sessions = useHomeSessions((state) => state.sessions);
  const runs = useRunStore((state) => state.history);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Alle Trainingsarten gemeinsam, neueste zuerst, gruppiert nach Kalendertag
  const sections = useMemo(() => {
    const entries: Entry[] = [
      ...history.map((workout): Entry => ({ kind: 'strength', startedAt: workout.startedAt, workout })),
      ...sessions.map((session): Entry => ({ kind: 'home', startedAt: session.startedAt, session })),
      ...runs.map((run): Entry => ({ kind: 'run', startedAt: run.startedAt, run })),
    ].sort((a, b) => b.startedAt - a.startedAt);

    const byDay = new Map<string, Section>();
    for (const entry of entries) {
      const key = dayKey(entry.startedAt);
      const section = byDay.get(key) ?? { key, title: formatDate(entry.startedAt), data: [] };
      section.data.push(entry);
      byDay.set(key, section);
    }
    return [...byDay.values()];
  }, [history, sessions, runs]);

  const counts = useMemo(() => new Map(sections.map((s) => [s.key, s.data.length])), [sections]);
  const visible = selectedDay ? sections.filter((s) => s.key === selectedDay) : sections;

  return (
    <SectionList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      sections={visible}
      ListHeaderComponent={<MonthCalendar counts={counts} selected={selectedDay} onSelect={setSelectedDay} />}
      keyExtractor={(entry) => (entry.kind === 'strength' ? entry.workout.id : entry.kind === 'home' ? entry.session.id : entry.run.id)}
      stickySectionHeadersEnabled={false}
      ListEmptyComponent={
        <Card>
          <AppText variant="heading">{selectedDay ? 'Kein Workout an diesem Tag' : 'Noch keine Workouts'}</AppText>
          <AppText color="textSecondary">Sobald du ein Workout beendest, erscheint es hier.</AppText>
        </Card>
      }
      renderSectionHeader={({ section }) => (
        <AppText variant="label" color="textSecondary" style={styles.sectionHeader}>
          {section.title.toUpperCase()}
        </AppText>
      )}
      renderItem={({ item }) => {
        if (item.kind === 'run') {
          const { run } = item;

          return (
            <Card onPress={() => router.push({ pathname: '/history/[id]', params: { id: run.id } })}>
              <View style={styles.row}>
                <TypeTitle kind="run" label="Lauf" />
                <AppText color="textSecondary">{formatTime(run.startedAt)}</AppText>
              </View>
              <AppText variant="caption">
                {formatDistance(run.distanceM, units)} · {formatClock(run.durationSeconds * 1000)} ·{' '}
                {formatPace(paceSecPerKm(run.distanceM, run.durationSeconds), units)} {paceUnitLabel(units)}
              </AppText>
            </Card>
          );
        }

        if (item.kind === 'home') {
          const { session } = item;
          const program = getProgram(session.programId);

          return (
            <Card onPress={() => router.push({ pathname: '/history/[id]', params: { id: session.id } })}>
              <View style={styles.row}>
                <TypeTitle kind="home" label="Home-Workout" />
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
              <TypeTitle kind="strength" label="Kraft" />
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  separator: { height: Spacing.two },
});
