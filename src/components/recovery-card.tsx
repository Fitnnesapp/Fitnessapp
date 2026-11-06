import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { MuscleMap } from '@/components/muscle-map';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { getExercise, MUSCLE_GROUPS, secondaryMuscles } from '@/data/exercises';
import { useNow } from '@/hooks/use-now';
import { muscleRecovery, type MuscleLoad } from '@/lib/logic/muscle-load';
import { useWorkouts } from '@/lib/storage/workout-store';

/** Nur zeigen, wenn in diesem Zeitraum Kraft trainiert wurde, sonst wäre die Karte ohne Aussage. */
const RELEVANT_DAYS = 14;
const DAY = 86_400_000;
/** Kleine Muskelgruppen nicht einzeln aufzählen, die Karte zeigt sie trotzdem */
const LISTED = MUSCLE_GROUPS.filter((muscle) => muscle !== 'Unterarme' && muscle !== 'Waden');

/**
 * Muskel-Erholung auf einen Blick: erholte Muskeln leuchten, frisch trainierte bleiben grau.
 * Beantwortet die häufigste Frage vor dem Training: "Was kann ich heute trainieren?"
 */
export function RecoveryCard() {
  const router = useRouter();
  const now = useNow(60_000);
  const history = useWorkouts((state) => state.history);

  const recent = useMemo(() => history.filter((workout) => now - workout.startedAt < RELEVANT_DAYS * DAY), [history, now]);
  const { recovering, hoursLeft } = useMemo(
    () =>
      muscleRecovery(
        recent.map((workout) => ({
          startedAt: workout.startedAt,
          exercises: workout.exercises.map((entry) => ({
            primary: getExercise(entry.exerciseId)?.muscleGroup,
            secondary: secondaryMuscles(entry.exerciseId),
            workingSets: entry.sets.filter((set) => !set.isWarmup).length,
          })),
        })),
        now,
      ),
    [recent, now],
  );

  if (recent.length === 0) return null;

  const load: MuscleLoad = Object.fromEntries(MUSCLE_GROUPS.map((muscle) => [muscle, recovering[muscle] ?? 1]));
  const ready = LISTED.filter((muscle) => recovering[muscle] === undefined);
  const tired = LISTED.filter((muscle) => recovering[muscle] !== undefined).sort(
    (a, b) => (hoursLeft[b] ?? 0) - (hoursLeft[a] ?? 0),
  );

  return (
    <Card>
      <AppText variant="eyebrow" color="textSecondary">
        Muskel-Erholung
      </AppText>
      <AppText variant="heading">
        {ready.length === LISTED.length
          ? 'Alles erholt, freie Wahl!'
          : ready.length === 0
            ? 'Heute lieber locker: Cardio oder Mobilität'
            : `Bereit: ${ready.slice(0, 4).join(', ')}${ready.length > 4 ? ' …' : ''}`}
      </AppText>
      <View style={styles.body}>
        <MuscleMap
          load={load}
          height={150}
          legendLabels={['bereit', 'erholt sich']}
          onSelectMuscle={(muscle) => router.push({ pathname: '/training/exercises', params: { muscle } })}
        />
      </View>
      {tired.length > 0 ? (
        <AppText variant="caption" color="textSecondary">
          Erholt sich noch:{' '}
          {tired
            .slice(0, 3)
            .map((muscle) => `${muscle} (~${hoursLeft[muscle]} Std)`)
            .join(', ')}
          . Faustregel: 48 bis 72 Stunden pro Muskelgruppe.
        </AppText>
      ) : null}
      <Button title="Passendes Workout" variant="secondary" onPress={() => router.push('/training/strength')} />
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { paddingVertical: Spacing.two },
});
