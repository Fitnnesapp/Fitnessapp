import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { getExercise, secondaryMuscles } from '@/data/exercises';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { weekStart } from '@/lib/logic/activity';
import { WEEKLY_SET_RANGE, weeklySets, type WeeklySets } from '@/lib/logic/muscle-load';
import { useWorkouts } from '@/lib/storage/workout-store';
import type { MuscleGroup } from '@/types/workout';

/** Große Muskelgruppen erscheinen immer, auch mit 0 Sätzen: so fällt eine vergessene Gruppe auf. */
const ALWAYS: MuscleGroup[] = ['Brust', 'Rücken', 'Schultern', 'Beine'];
const SCALE_MAX = 25;
const WEEK = 7 * 86_400_000;

const STATUS_TEXT: Record<WeeklySets['status'], string> = { wenig: 'mehr geht', gut: 'im Bereich', viel: 'sehr viel' };

/** Harte Sätze je Muskelgruppe in dieser Woche, mit dem wirksamen Bereich von 10 bis 20 Sätzen. */
export function WeeklySetsCard() {
  const theme = useTheme();
  const now = useNow(60_000);
  const history = useWorkouts((state) => state.history);

  const rows = useMemo(() => {
    const start = weekStart(now);
    const counted = weeklySets(
      history.map((workout) => ({
        startedAt: workout.startedAt,
        exercises: workout.exercises.map((entry) => ({
          primary: getExercise(entry.exerciseId)?.muscleGroup,
          secondary: secondaryMuscles(entry.exerciseId),
          workingSets: entry.sets.filter((set) => !set.isWarmup).length,
        })),
      })),
      start,
      start + WEEK,
    );
    const missing = ALWAYS.filter((muscle) => !counted.some((row) => row.muscle === muscle)).map(
      (muscle): WeeklySets => ({ muscle, sets: 0, status: 'wenig' }),
    );
    return [...counted, ...missing];
  }, [history, now]);

  if (history.length === 0) return null;

  const left = (WEEKLY_SET_RANGE.min / SCALE_MAX) * 100;
  const width = ((WEEKLY_SET_RANGE.max - WEEKLY_SET_RANGE.min) / SCALE_MAX) * 100;

  return (
    <Card>
      <AppText variant="eyebrow" color="textSecondary">
        Sätze pro Muskel · diese Woche
      </AppText>
      <AppText variant="caption" color="textSecondary">
        Für Muskelaufbau wirken etwa {WEEKLY_SET_RANGE.min} bis {WEEKLY_SET_RANGE.max} harte Sätze pro Woche und Muskel
        (helles Feld). Hilfsmuskeln zählen halb.
      </AppText>
      {rows.map((row) => (
        <View
          key={row.muscle}
          style={styles.row}
          accessible
          accessibilityLabel={`${row.muscle}: ${row.sets} Sätze, ${STATUS_TEXT[row.status]}`}>
          <AppText style={styles.name}>{row.muscle}</AppText>
          <View style={[styles.track, { backgroundColor: theme.surfaceAlt }]}>
            <View style={[styles.zone, { left: `${left}%`, width: `${width}%`, backgroundColor: theme.accentSoft }]} />
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.min(100, (row.sets / SCALE_MAX) * 100)}%`,
                  backgroundColor: row.status === 'gut' ? theme.accent : theme.textSecondary,
                },
              ]}
            />
          </View>
          <AppText variant="label" color={row.status === 'gut' ? 'accent' : 'textSecondary'} style={styles.value}>
            {String(row.sets).replace('.', ',')}
          </AppText>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  name: { width: 84 },
  track: { flex: 1, height: 12, borderRadius: Radius.pill, overflow: 'hidden', justifyContent: 'center' },
  zone: { position: 'absolute', top: 0, bottom: 0 },
  fill: { height: 6, marginLeft: 3, borderRadius: Radius.pill },
  value: { width: 36, textAlign: 'right' },
});
