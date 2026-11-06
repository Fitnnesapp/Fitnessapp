import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { getExercise, MUSCLE_GROUPS } from '@/data/exercises';
import { recordBook } from '@/lib/logic/record-book';
import { formatRaceTime, runBestsSummary } from '@/lib/logic/run-insights';
import { formatDistance, formatWeight, kgToDisplay } from '@/lib/logic/units';
import { useRunStore } from '@/lib/storage/run-store';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';
import type { MuscleGroup } from '@/types/workout';

const SHORT_DATE = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' });

/** Rekordbuch: deine besten Sätze und geschätzten Maximalgewichte je Übung. */
export default function RecordsScreen() {
  const router = useRouter();
  const units = useSettings((state) => state.units);
  const history = useWorkouts((state) => state.history);
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);

  const runs = useRunStore((state) => state.history);
  const runBests = useMemo(() => runBestsSummary(runs), [runs]);
  const book = useMemo(() => recordBook(history), [history]);
  const trainedMuscles = MUSCLE_GROUPS.filter((group) => book.some((r) => getExercise(r.exerciseId)?.muscleGroup === group));
  const rows = book.filter((record) => !muscle || getExercise(record.exerciseId)?.muscleGroup === muscle);

  return (
    <Screen>
      <AppText variant="display" style={styles.headline}>
        Rekordbuch
      </AppText>
      <AppText color="textSecondary">
        Deine Bestleistungen je Übung. Das geschätzte Maximalgewicht (1RM) stammt aus deinem besten Satz mit bis zu 12
        Wiederholungen.
      </AppText>

      {runBests.count > 0 ? (
        <Card
          onPress={() => router.push('/training/running')}
          accessibilityLabel="Laufbestzeiten, öffnet die Running-Seite">
          <AppText variant="label" color="textSecondary">
            LAUFEN
          </AppText>
          <View style={styles.runGrid}>
            {[
              { label: '1 km', value: runBests.k1 !== null ? formatRaceTime(runBests.k1) : '–' },
              { label: '5 km', value: runBests.k5 !== null ? formatRaceTime(runBests.k5) : '–' },
              { label: '10 km', value: runBests.k10 !== null ? formatRaceTime(runBests.k10) : '–' },
              { label: 'Längster', value: formatDistance(runBests.longestM, units) },
            ].map((tile) => (
              <View key={tile.label} style={styles.runTile}>
                <AppText variant="eyebrow" color="textSecondary">
                  {tile.label}
                </AppText>
                <AppText variant="heading" numberOfLines={1}>
                  {tile.value}
                </AppText>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <AppText variant="heading">Kraft</AppText>

      {book.length === 0 ? (
        <Card>
          <AppText variant="heading">Noch keine Einträge</AppText>
          <AppText color="textSecondary">Nach deinem ersten Krafttraining stehen hier deine Bestwerte.</AppText>
        </Card>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="Alle" selected={muscle === null} onPress={() => setMuscle(null)} />
          {trainedMuscles.map((group) => (
            <Chip key={group} label={group} selected={muscle === group} onPress={() => setMuscle(muscle === group ? null : group)} />
          ))}
        </ScrollView>
      )}

      {rows.map((record) => {
        const exercise = getExercise(record.exerciseId);
        const bodyweight = record.best.weightKg === 0;
        return (
          <Card
            key={record.exerciseId}
            style={styles.row}
            onPress={() => router.push({ pathname: '/training/exercise/[id]', params: { id: record.exerciseId } })}
            accessibilityLabel={exercise?.name ?? record.exerciseId}>
            <View style={styles.flex}>
              <AppText variant="heading" numberOfLines={2}>
                {exercise?.name ?? record.exerciseId}
              </AppText>
              <AppText variant="caption" color="textSecondary">
                {bodyweight
                  ? `Meiste Wiederholungen: ${record.maxReps}`
                  : `Bester Satz: ${formatWeight(record.best.weightKg, units)} × ${record.best.reps}`}
              </AppText>
              <AppText variant="caption" color="textSecondary">
                {record.sessions} {record.sessions === 1 ? 'Training' : 'Trainings'} · zuletzt {SHORT_DATE.format(record.lastAt)}
              </AppText>
            </View>
            {record.oneRepMax ? (
              <View style={styles.oneRm}>
                <AppText variant="number" color="accent" style={styles.oneRmValue}>
                  {Math.round(kgToDisplay(record.oneRepMax.kg, units))}
                </AppText>
                <AppText variant="eyebrow" color="textSecondary">
                  1RM {units === 'metric' ? 'kg' : 'lb'}
                </AppText>
              </View>
            ) : null}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  runGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: Spacing.two },
  runTile: { flexBasis: '50%', gap: 2 },
  headline: { fontSize: 34, lineHeight: 38, fontWeight: '900' },
  chips: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three },
  flex: { flex: 1, gap: 2 },
  oneRm: { alignItems: 'flex-end' },
  oneRmValue: { fontSize: 24, lineHeight: 28 },
});
