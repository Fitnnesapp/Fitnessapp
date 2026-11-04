import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { MuscleMap } from '@/components/muscle-map';
import { Card } from '@/components/ui/card';
import { FadeIn } from '@/components/ui/fade-in';
import { ImageCard } from '@/components/ui/image-card';
import { Screen } from '@/components/ui/screen';
import { OnImage, Radius, Spacing } from '@/constants/theme';
import { getExercise, secondaryMuscles } from '@/data/exercises';
import { SCENES } from '@/data/images';
import { getRoutine } from '@/data/routines';
import { useTheme } from '@/hooks/use-theme';
import { impactFeedback } from '@/lib/haptics';
import { muscleLoad } from '@/lib/logic/muscle-load';
import { routineMinutes, routineMuscles, routineSetCount, targetReps } from '@/lib/logic/routines';
import { formatWeight } from '@/lib/logic/units';
import { lastWorkingSet } from '@/lib/logic/workout-stats';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';

const muscleOf = (id: string) => getExercise(id)?.muscleGroup;

export default function RoutineDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const routine = getRoutine(id);
  const { active, history, startRoutine } = useWorkouts();
  const units = useSettings((state) => state.units);

  if (!routine) {
    return (
      <Screen>
        <AppText variant="title">Workout nicht gefunden</AppText>
      </Screen>
    );
  }

  const muscles = routineMuscles(routine, muscleOf);
  const load = muscleLoad(
    routine.items.map((item) => ({
      primary: muscleOf(item.exerciseId),
      secondary: secondaryMuscles(item.exerciseId),
      amount: item.sets,
    })),
  );

  function start() {
    if (!routine) return;
    impactFeedback();
    startRoutine(
      routine.items.map((item) => ({ exerciseId: item.exerciseId, sets: item.sets, targetReps: targetReps(item.reps) })),
    );
    router.push('/training/workout');
  }

  return (
    <Screen>
      <FadeIn>
        <ImageCard
          source={routine.setting === 'Zuhause' ? SCENES['hero-home'] : SCENES['hero-kraft']}
          height={240}
          accessibilityLabel={routine.name}>
          <AppText variant="eyebrow" style={{ color: OnImage.accent }}>
            {routine.focus} · {routine.setting}
          </AppText>
          <AppText variant="display" style={styles.heroTitle} numberOfLines={2} adjustsFontSizeToFit>
            {routine.name}
          </AppText>
          <AppText style={styles.onImageSoft}>{routine.description}</AppText>
        </ImageCard>
      </FadeIn>

      <View style={styles.stats}>
        {[
          { label: 'Minuten', value: `~${routineMinutes(routine)}` },
          { label: 'Übungen', value: String(routine.items.length) },
          { label: 'Sätze', value: String(routineSetCount(routine)) },
        ].map((stat) => (
          <Card key={stat.label} style={styles.stat}>
            <AppText variant="number" style={styles.statValue}>
              {stat.value}
            </AppText>
            <AppText variant="eyebrow" color="textSecondary">
              {stat.label}
            </AppText>
          </Card>
        ))}
      </View>

      <Card>
        <MuscleMap load={load} height={170} legendLabels={['stark', 'leicht']} />
      </Card>

      <View style={styles.muscles}>
        {muscles.map((share) => (
          <View key={share.muscle} style={[styles.muscleTag, { backgroundColor: theme.accentSoft }]}>
            <AppText variant="label" color="accent">
              {share.muscle}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              {share.sets} Sätze
            </AppText>
          </View>
        ))}
      </View>

      {active ? (
        <Card>
          <AppText variant="label" color="accent">
            WORKOUT LÄUFT
          </AppText>
          <AppText color="textSecondary">Beende zuerst dein angefangenes Workout, dann kannst du dieses starten.</AppText>
          <Button title="Zum laufenden Workout" variant="secondary" onPress={() => router.push('/training/workout')} />
        </Card>
      ) : (
        <Button title="Workout starten" onPress={start} />
      )}

      <AppText variant="heading" style={styles.section}>
        Ablauf
      </AppText>
      {routine.items.map((item, index) => {
        const exercise = getExercise(item.exerciseId);
        const last = lastWorkingSet(history, item.exerciseId);
        return (
          <Card
            key={`${item.exerciseId}-${index}`}
            style={styles.row}
            onPress={() => router.push({ pathname: '/training/exercise/[id]', params: { id: item.exerciseId } })}
            accessibilityLabel={`${exercise?.name ?? item.exerciseId}, ${item.sets} Sätze à ${item.reps}`}>
            <View style={[styles.index, { backgroundColor: theme.surfaceAlt }]}>
              <AppText variant="label">{index + 1}</AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="heading">{exercise?.name ?? item.exerciseId}</AppText>
              <AppText variant="caption" color="textSecondary">
                {item.sets} × {item.reps} · {item.restSeconds} s Pause
              </AppText>
              {last ? (
                <AppText variant="caption" color="accent">
                  Zuletzt: {last.weightKg > 0 ? `${formatWeight(last.weightKg, units)} × ` : ''}
                  {last.reps}
                </AppText>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </Card>
        );
      })}

      <Card style={{ backgroundColor: theme.surfaceAlt }}>
        <AppText variant="label" color="accent">
          SO HOLST DU AM MEISTEN RAUS
        </AppText>
        <AppText color="textSecondary">
          Wähle das Gewicht so, dass am Ende jedes Satzes noch ein bis zwei Wiederholungen möglich wären. Schaffst du
          die obere Grenze in allen Sätzen, steigere beim nächsten Mal leicht. So wächst die Belastung Schritt für
          Schritt, das wirksamste Prinzip im Krafttraining.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroTitle: { color: '#FFFFFF', fontSize: 34, lineHeight: 38, fontWeight: '900' },
  onImageSoft: { color: '#FFFFFF', opacity: 0.85 },
  muscles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  muscleTag: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  section: { marginTop: Spacing.two },
  stats: { flexDirection: 'row', gap: Spacing.two },
  stat: { flex: 1, alignItems: 'center', padding: Spacing.three, gap: 2 },
  statValue: { fontSize: 26, lineHeight: 30 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three },
  index: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 2 },
});
