import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GoalCard } from '@/components/goal-card';
import { RoutineCard } from '@/components/routine-card';
import { WeeklySetsCard } from '@/components/weekly-sets-card';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { FadeIn } from '@/components/ui/fade-in';
import { ImageCard } from '@/components/ui/image-card';
import { QuickAction } from '@/components/ui/quick-action';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { OnImage, Radius, Spacing } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { SCENES } from '@/data/images';
import { ROUTINES } from '@/data/routines';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { confirmAction } from '@/lib/confirm';
import { tapFeedback } from '@/lib/haptics';
import { preferencesFromPlan, routineMinutes, suggestRoutine } from '@/lib/logic/routines';
import { useGoalsStore } from '@/lib/storage/goals-store';
import { usePlanStore } from '@/lib/storage/plan-store';
import { useWorkouts } from '@/lib/storage/workout-store';
import type { RoutineSetting } from '@/types/workout';

const muscleOf = (id: string) => getExercise(id)?.muscleGroup;
const SETTINGS: RoutineSetting[] = ['Studio', 'Zuhause'];

export default function StrengthScreen() {
  const router = useRouter();
  const theme = useTheme();
  const now = useNow(60_000);
  const { active, history, templates, startWorkout, deleteTemplate } = useWorkouts();
  const answers = usePlanStore((state) => state.plan?.answers);
  const goals = useGoalsStore((state) => state.goals);
  const preferences = useMemo(() => preferencesFromPlan(answers), [answers]);
  const [setting, setSetting] = useState<RoutineSetting | null>(preferences.setting ?? null);

  const [skipped, setSkipped] = useState<string[]>([]);
  const suggestion = useMemo(
    () => suggestRoutine(ROUTINES, history, now, muscleOf, { ...preferences, exclude: skipped }),
    [history, now, preferences, skipped],
  );

  function nextSuggestion() {
    if (!suggestion) return;
    const current = suggestion.routine.id;
    // Wurden schon alle passenden Workouts übersprungen, beginnt die Runde von vorn
    setSkipped((previous) => (previous.includes(current) ? [current] : [...previous, current]));
  }
  const routines = ROUTINES.filter((routine) => !setting || routine.setting === setting);

  function start(exerciseIds?: string[]) {
    startWorkout(exerciseIds);
    router.push('/training/workout');
  }

  const openRoutine = (id: string) => router.push({ pathname: '/training/routine/[id]', params: { id } });

  return (
    <Screen>
      <AppText variant="display" style={styles.headline}>
        Kraft
      </AppText>

      {active ? (
        <Card>
          <AppText variant="label" color="accent">
            WORKOUT LÄUFT
          </AppText>
          <AppText color="textSecondary">
            Du hast ein angefangenes Workout mit {active.exercises.length}{' '}
            {active.exercises.length === 1 ? 'Übung' : 'Übungen'}.
          </AppText>
          <Button title="Fortsetzen" onPress={() => router.push('/training/workout')} />
        </Card>
      ) : suggestion ? (
        <FadeIn>
          <ImageCard
            source={suggestion.routine.setting === 'Zuhause' ? SCENES['hero-home'] : SCENES['hero-kraft']}
            height={300}
            onPress={() => openRoutine(suggestion.routine.id)}
            accessibilityLabel={`Heute empfohlen: ${suggestion.routine.name}`}>
            <AppText variant="eyebrow" style={{ color: OnImage.accent }}>
              HEUTE EMPFOHLEN
            </AppText>
            <AppText variant="display" style={styles.heroTitle} numberOfLines={2} adjustsFontSizeToFit>
              {suggestion.routine.name}
            </AppText>
            <AppText style={styles.onImageSoft} numberOfLines={2}>
              {suggestion.reason}
            </AppText>
            <View style={styles.heroFooter}>
              <View style={[styles.cta, { backgroundColor: OnImage.accent }]}>
                <Ionicons name="play" size={18} color={OnImage.onAccent} />
                <AppText variant="label" style={{ color: OnImage.onAccent }}>
                  Ansehen
                </AppText>
              </View>
              <AppText variant="caption" style={styles.onImageSoft}>
                ~{routineMinutes(suggestion.routine)} Min · {suggestion.routine.items.length} Übungen
              </AppText>
            </View>
          </ImageCard>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Anderen Vorschlag zeigen"
            onPress={() => {
              tapFeedback();
              nextSuggestion();
            }}
            hitSlop={8}
            style={({ pressed }) => [styles.another, pressed && styles.pressed]}>
            <Ionicons name="shuffle" size={16} color={theme.textSecondary} />
            <AppText variant="label" color="textSecondary">
              Anderer Vorschlag
            </AppText>
          </Pressable>
        </FadeIn>
      ) : null}

      <View style={styles.actions}>
        {!active ? <QuickAction icon="add-circle-outline" label="Frei starten" onPress={() => start()} /> : null}
        <QuickAction icon="barbell-outline" label="Übungen" onPress={() => router.push('/training/exercises')} />
        <QuickAction icon="calculator-outline" label="Rechner" onPress={() => router.push('/training/calculator')} />
      </View>

      <WeeklySetsCard />

      {goals.length > 0 ? (
        <>
          <SectionHeader title="Deine Ziele" />
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </>
      ) : null}

      <SectionHeader title="Fertige Workouts" />
      <AppText color="textSecondary">Durchdacht zusammengestellt, mit Sätzen, Zielen und Pausen. Einfach starten.</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Alle" selected={setting === null} onPress={() => setSetting(null)} />
        {SETTINGS.map((item) => (
          <Chip key={item} label={item} selected={setting === item} onPress={() => setSetting(setting === item ? null : item)} />
        ))}
      </ScrollView>
      {routines.map((routine) => (
        <RoutineCard key={routine.id} routine={routine} onPress={() => openRoutine(routine.id)} />
      ))}

      <SectionHeader title="Meine Vorlagen" />
      {templates.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="bookmark-outline" size={22} color={theme.accent} />
          <AppText color="textSecondary" style={styles.flex}>
            Nach einem Workout kannst du es als Vorlage speichern und hier mit einem Tipp neu starten.
          </AppText>
        </Card>
      ) : null}

      {templates.map((template) => (
        <Card key={template.id}>
          <AppText variant="heading">{template.name}</AppText>
          <AppText variant="caption" color="textSecondary">
            {template.exerciseIds.map((id) => getExercise(id)?.name ?? id).join(', ')}
          </AppText>
          <View style={styles.actions}>
            <Button
              title="Starten"
              disabled={active !== null}
              onPress={() => start(template.exerciseIds)}
              style={styles.flex}
            />
            <Button
              title="Löschen"
              variant="ghost"
              onPress={() =>
                confirmAction({
                  title: 'Vorlage löschen?',
                  message: `„${template.name}“ wird entfernt. Bereits gespeicherte Workouts bleiben erhalten.`,
                  confirmLabel: 'Löschen',
                  onConfirm: () => deleteTemplate(template.id),
                })
              }
            />
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headline: { fontSize: 34, lineHeight: 38, fontWeight: '900' },
  heroTitle: { color: '#FFFFFF', fontSize: 34, lineHeight: 38, fontWeight: '900' },
  onImageSoft: { color: '#FFFFFF', opacity: 0.85 },
  heroFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginTop: Spacing.two },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  actions: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  chips: { gap: Spacing.two },
  flex: { flex: 1 },
  another: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingTop: Spacing.three,
  },
  pressed: { opacity: 0.6 },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
});
