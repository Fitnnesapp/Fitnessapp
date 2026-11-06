import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { StatGrid } from '@/components/detail-layout';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { useActivities } from '@/hooks/use-activities';
import { formatDuration } from '@/lib/logic/format';
import { formatDistance, formatWeight } from '@/lib/logic/units';
import { yearReview, yearsWithActivity } from '@/lib/logic/year-review';
import { useRunStore } from '@/lib/storage/run-store';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

export default function YearReviewScreen() {
  const units = useSettings((state) => state.units);
  const activities = useActivities();
  const strength = useWorkouts((state) => state.history);
  const runs = useRunStore((state) => state.history);

  const [now] = useState(() => Date.now());
  const years = useMemo(() => {
    const found = yearsWithActivity(activities);
    return found.length > 0 ? found : [new Date(now).getFullYear()];
  }, [activities, now]);
  const [picked, setPicked] = useState<number | null>(null);
  const year = picked ?? years[0];

  const review = useMemo(
    () => yearReview({ year, activities, strength, runs, now }),
    [year, activities, strength, runs, now],
  );

  if (review.workouts === 0) {
    return (
      <Screen>
        <AppText variant="display">{year}</AppText>
        <Card>
          <AppText variant="heading">Noch kein Workout in diesem Jahr</AppText>
          <AppText color="textSecondary">Sobald du trainierst, entsteht hier dein Rückblick.</AppText>
        </Card>
      </Screen>
    );
  }

  const topExercise = review.topExercise ? (getExercise(review.topExercise.exerciseId)?.name ?? review.topExercise.exerciseId) : null;

  return (
    <Screen>
      <AppText variant="display">Dein {year}</AppText>

      {years.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {years.map((y) => (
            <Chip key={y} label={String(y)} selected={y === year} onPress={() => setPicked(y)} />
          ))}
        </ScrollView>
      ) : null}

      <Card>
        <AppText variant="label" color="accent">
          WORKOUTS
        </AppText>
        <AppText variant="display">{review.workouts}</AppText>
        <AppText color="textSecondary">
          an {review.activeDays} {review.activeDays === 1 ? 'Tag' : 'Tagen'}: Kraft {review.byType.strength} · Home{' '}
          {review.byType.home} · Laufen {review.byType.running}
        </AppText>
      </Card>

      <StatGrid
        items={[
          { label: 'Trainingszeit', value: formatDuration(review.durationSeconds * 1000) },
          { label: 'Gelaufen', value: formatDistance(review.distanceM, units) },
          { label: 'Gehoben', value: formatWeight(review.volumeKg, units) },
          { label: 'Rekorde', value: String(review.recordCount) },
          { label: 'Längste Serie', value: `${review.longestStreak} ${review.longestStreak === 1 ? 'Tag' : 'Tage'}` },
          { label: 'Längster Lauf', value: review.longestRunM > 0 ? formatDistance(review.longestRunM, units) : '–' },
        ]}
      />

      <View style={styles.facts}>
        {review.bestMonth ? (
          <Card>
            <AppText variant="heading">Stärkster Monat: {MONTHS[review.bestMonth.month]}</AppText>
            <AppText color="textSecondary">{review.bestMonth.count} Workouts</AppText>
          </Card>
        ) : null}
        {review.busiestWeekday !== null ? (
          <Card>
            <AppText variant="heading">Lieblingstag: {WEEKDAYS[review.busiestWeekday]}</AppText>
          </Card>
        ) : null}
        {topExercise ? (
          <Card>
            <AppText variant="heading">Lieblingsübung: {topExercise}</AppText>
            <AppText color="textSecondary">{review.topExercise?.sets} Arbeitssätze</AppText>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: Spacing.two },
  facts: { gap: Spacing.two },
});
