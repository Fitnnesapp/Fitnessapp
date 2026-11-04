import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';
import { routineMinutes, routineMuscles } from '@/lib/logic/routines';
import type { Routine } from '@/types/workout';

const muscleOf = (id: string) => getExercise(id)?.muscleGroup;

/** Listenkarte eines fertigen Kraft-Workouts: Dauer groß links, Fokus und Muskeln rechts. */
export function RoutineCard({ routine, onPress }: { routine: Routine; onPress: () => void }) {
  const theme = useTheme();
  const muscles = routineMuscles(routine, muscleOf)
    .slice(0, 3)
    .map((share) => share.muscle);

  return (
    <Card
      onPress={onPress}
      style={styles.card}
      accessibilityLabel={`${routine.name}, ${routineMinutes(routine)} Minuten, ${routine.difficulty}`}>
      <View style={[styles.minutes, { backgroundColor: theme.accentSoft }]}>
        <AppText variant="number" color="accent" style={styles.minutesNumber}>
          {routineMinutes(routine)}
        </AppText>
        <AppText variant="eyebrow" color="accent">
          Min
        </AppText>
      </View>
      <View style={styles.body}>
        <AppText variant="eyebrow" color="textSecondary" numberOfLines={1}>
          {routine.focus} · {routine.setting}
        </AppText>
        <AppText variant="heading">{routine.name}</AppText>
        <AppText variant="caption" color="textSecondary" numberOfLines={1}>
          {routine.difficulty} · {routine.items.length} Übungen · {muscles.join(', ')}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  minutes: { width: 64, height: 64, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  minutesNumber: { fontSize: 26, lineHeight: 28 },
  body: { flex: 1, gap: 2 },
});
