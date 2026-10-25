import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useMemo, type ComponentProps } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { ImageCard } from '@/components/ui/image-card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { SCENES } from '@/data/images';
import { getProgram } from '@/data/programs';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { feedDayLabel, strengthTitle } from '@/lib/logic/feed';
import { formatClock } from '@/lib/logic/format';
import { repeatOptions, type RepeatOption } from '@/lib/logic/repeat';
import { activeElapsedAt } from '@/lib/logic/run-stats';
import { formatDistance } from '@/lib/logic/units';
import { useHomeSessions } from '@/lib/storage/home-store';
import { useRunStore } from '@/lib/storage/run-store';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';
import type { MuscleGroup } from '@/types/workout';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Option = {
  href: Href;
  title: string;
  description: string;
  image: ImageSourcePropType;
};

const OPTIONS: Option[] = [
  { href: '/training/strength', title: 'Kraft', description: 'Sätze, Gewichte und Rekorde loggen', image: SCENES['hero-kraft'] },
  { href: '/training/home', title: 'Home-Workout', description: 'Geführte Einheiten ohne Equipment', image: SCENES['hero-home'] },
  { href: '/training/running', title: 'Laufen', description: 'Mit GPS, Pace und Strecke', image: SCENES['hero-lauf'] },
];

/**
 * Training (Plus-Knopf in der Mitte): zuerst, was gerade läuft, dann "Nochmal machen" mit den letzten
 * Einheiten, dann eine neue Einheit. Der schnellste Weg ins Training ist so ein einziger Tipp.
 */
export default function TrainingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const units = useSettings((state) => state.units);
  const activeWorkout = useWorkouts((state) => state.active);
  const strength = useWorkouts((state) => state.history);
  const repeatWorkout = useWorkouts((state) => state.repeatWorkout);
  const home = useHomeSessions((state) => state.sessions);
  const activeRun = useRunStore((state) => state.active);
  const runs = useRunStore((state) => state.history);
  // Sekundentakt nur, solange eine Einheit läuft, sonst reicht eine Minute für "Heute"/"Gestern"
  const now = useNow(activeWorkout || activeRun ? 1_000 : 60_000);

  const options = useMemo(() => repeatOptions(strength, home, runs), [strength, home, runs]);
  const busy = activeWorkout !== null || activeRun !== null;

  function repeat(option: RepeatOption) {
    if (option.kind === 'strength') {
      if (repeatWorkout(option.workoutId)) router.push('/training/workout');
      return;
    }
    if (option.kind === 'home') {
      router.push({ pathname: '/training/program/[id]', params: { id: option.programId } });
      return;
    }
    router.push('/training/running');
  }

  return (
    <Screen>
      <AppText variant="display">Was trainierst du heute?</AppText>

      {activeWorkout ? (
        <ActiveCard
          icon="barbell"
          title="Krafttraining läuft"
          text={`${activeWorkout.exercises.length} ${activeWorkout.exercises.length === 1 ? 'Übung' : 'Übungen'} · seit ${formatClock(now - activeWorkout.startedAt)}`}
          onPress={() => router.push('/training/workout')}
        />
      ) : null}
      {activeRun ? (
        <ActiveCard
          icon="walk"
          title={activeRun.status === 'paused' ? 'Lauf pausiert' : 'Lauf läuft'}
          text={`${formatDistance(activeRun.distanceM, units)} · ${formatClock(activeElapsedAt(activeRun, now))}`}
          onPress={() => router.push('/training/run')}
        />
      ) : null}

      {options.length > 0 ? (
        <>
          <AppText variant="heading">Nochmal machen</AppText>
          {options.map((option) => {
            const info = describe(option, units);
            // Ein zweites Krafttraining kann nicht parallel laufen
            const blocked = option.kind === 'strength' && activeWorkout !== null;
            return (
              <Card key={info.key} onPress={blocked ? undefined : () => repeat(option)} style={styles.repeat}>
                <View style={[styles.repeatIcon, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name={info.icon} size={22} color={theme.accent} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="heading" numberOfLines={1}>
                    {info.title}
                  </AppText>
                  <AppText variant="caption" color="textSecondary" numberOfLines={2}>
                    {info.detail} · {feedDayLabel(option.at, now)}
                  </AppText>
                </View>
                <Ionicons
                  name={blocked ? 'lock-closed-outline' : 'play-circle'}
                  size={30}
                  color={blocked ? theme.textSecondary : theme.accent}
                />
              </Card>
            );
          })}
          {activeWorkout && options.some((o) => o.kind === 'strength') ? (
            <AppText variant="caption" color="textSecondary">
              Beende zuerst dein laufendes Krafttraining, um ein anderes zu wiederholen.
            </AppText>
          ) : null}
        </>
      ) : null}

      <AppText variant="heading">{busy || options.length > 0 ? 'Neue Einheit' : 'Wähle deine Trainingsart'}</AppText>
      {OPTIONS.map((option) => (
        <ImageCard
          key={option.title}
          source={option.image}
          height={options.length > 0 ? 150 : 190}
          accessibilityLabel={`${option.title}: ${option.description}`}
          onPress={() => router.push(option.href)}>
          <View style={styles.row}>
            <View style={styles.text}>
              <AppText variant="hero" style={styles.onImage}>
                {option.title}
              </AppText>
              <AppText style={styles.onImageSoft}>{option.description}</AppText>
            </View>
            <View style={[styles.go, { backgroundColor: theme.accent }]}>
              <Ionicons name="arrow-forward" size={22} color="#0B0D10" />
            </View>
          </View>
        </ImageCard>
      ))}
    </Screen>
  );
}

function ActiveCard({ icon, title, text, onPress }: { icon: IconName; title: string; text: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Card onPress={onPress} style={[styles.repeat, { borderColor: theme.accent }]}>
      <View style={[styles.repeatIcon, { backgroundColor: theme.accent }]}>
        <Ionicons name={icon} size={22} color={theme.onAccent} />
      </View>
      <View style={styles.flex}>
        <AppText variant="label" color="accent">
          LÄUFT GERADE
        </AppText>
        <AppText variant="heading">{title}</AppText>
        <AppText variant="caption" color="textSecondary" style={styles.tabular}>
          {text}
        </AppText>
      </View>
      <AppText variant="label" color="accent">
        Fortsetzen
      </AppText>
    </Card>
  );
}

function describe(option: RepeatOption, units: 'metric' | 'imperial'): { key: string; icon: IconName; title: string; detail: string } {
  if (option.kind === 'strength') {
    const groups = option.exerciseIds.map((id) => getExercise(id)?.muscleGroup).filter((g): g is MuscleGroup => Boolean(g));
    const count = option.exerciseIds.length;
    return {
      key: `s-${option.workoutId}`,
      icon: 'barbell',
      title: strengthTitle(option.at, groups),
      detail: `${count} ${count === 1 ? 'Übung' : 'Übungen'}, ${option.sets} ${option.sets === 1 ? 'Satz' : 'Sätze'}`,
    };
  }
  if (option.kind === 'home') {
    return { key: `h-${option.programId}`, icon: 'body', title: getProgram(option.programId)?.name ?? 'Home-Workout', detail: 'Home' };
  }
  return { key: 'run', icon: 'walk', title: 'Lauf', detail: `zuletzt ${formatDistance(option.distanceM, units)}` };
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  tabular: { fontVariant: ['tabular-nums'] },
  repeat: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  repeatIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.three },
  text: { flex: 1, gap: Spacing.one },
  onImage: { color: '#FFFFFF' },
  onImageSoft: { color: '#FFFFFF', opacity: 0.82 },
  go: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
