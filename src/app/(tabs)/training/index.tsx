import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useMemo, type ComponentProps } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { LinkTile } from '@/components/link-tile';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { ImageCard } from '@/components/ui/image-card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { OnImage, Radius, Spacing } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { SCENES, sceneForKind } from '@/data/images';
import { getProgram, isFreeProgram, PROGRAMS } from '@/data/programs';
import { useActivities } from '@/hooks/use-activities';
import { useNow } from '@/hooks/use-now';
import { useSubscription } from '@/hooks/use-subscription';
import { useTheme } from '@/hooks/use-theme';
import { feedDayLabel, strengthTitle } from '@/lib/logic/feed';
import { formatClock } from '@/lib/logic/format';
import { ifThenSentence, sessionsForDay } from '@/lib/logic/plan';
import { quickestProgram } from '@/lib/logic/quick-win';
import { repeatOptions, type RepeatOption } from '@/lib/logic/repeat';
import { activeElapsedAt } from '@/lib/logic/run-stats';
import { formatDistance, type Units } from '@/lib/logic/units';
import { hrefForSession } from '@/lib/plan-href';
import { useHomeSessions } from '@/lib/storage/home-store';
import { usePlanStore } from '@/lib/storage/plan-store';
import { useRunStore } from '@/lib/storage/run-store';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';
import type { MuscleGroup } from '@/types/workout';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Kind = {
  href: Href;
  title: string;
  description: string;
  image: ImageSourcePropType;
};

const KINDS: Kind[] = [
  { href: '/training/strength', title: 'Kraft', description: 'Sätze, Gewichte, Rekorde', image: SCENES['hero-kraft'] },
  { href: '/training/running', title: 'Laufen', description: 'GPS, Pace, Strecke', image: SCENES['hero-lauf'] },
  { href: '/training/home', title: 'Home', description: 'Geführt, ohne Geräte', image: SCENES['hero-home'] },
];

/**
 * Training (Plus-Knopf, Redesign 2.0). Reihenfolge nach Entscheidungsaufwand, kleinster zuerst:
 * 1. was gerade läuft, 2. was dein Plan für heute vorsieht (Wenn-Dann-Satz), 3. Kurz & knackig
 * als kleinste Hürde, 4. Nochmal machen, 5. freie Wahl der Trainingsart, 6. Werkzeuge.
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
  const plan = usePlanStore((state) => state.plan);
  const activities = useActivities();
  const { isPremium } = useSubscription();
  // Sekundentakt nur, solange eine Einheit läuft, sonst reicht eine Minute für "Heute"/"Gestern"
  const now = useNow(activeWorkout || activeRun ? 1_000 : 60_000);

  const options = useMemo(() => repeatOptions(strength, home, runs), [strength, home, runs]);
  const quick = useMemo(() => quickestProgram(PROGRAMS, (id) => isPremium || isFreeProgram(id)), [isPremium]);
  const trainedToday = useMemo(() => {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return activities.some((a) => a.startedAt >= start.getTime());
  }, [activities, now]);
  const todaySession = plan && now >= plan.startsAt && !trainedToday ? sessionsForDay(plan, now)[0] : undefined;
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
      <View style={styles.header}>
        <AppText variant="eyebrow" color="accent">
          Training
        </AppText>
        <AppText variant="display" style={styles.headline}>
          {busy ? 'Weiter geht’s.' : todaySession ? 'Heute ist dein Tag.' : 'Bereit?'}
        </AppText>
      </View>

      {/* 1. Was gerade läuft */}
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

      {/* 2. Heute im Plan: der eigene Wenn-Dann-Satz macht aus der Absicht eine Handlung */}
      {todaySession && plan && !busy ? (
        <ImageCard
          source={sceneForKind(todaySession.kind)}
          height={300}
          accessibilityLabel={`Heute im Plan: ${todaySession.title}`}
          onPress={() => router.push(hrefForSession(todaySession))}>
          <AppText variant="eyebrow" style={{ color: OnImage.accent }}>
            Heute im Plan · {todaySession.minutes} Min
          </AppText>
          <AppText variant="display" style={[styles.onImage, styles.imageTitle]} numberOfLines={2}>
            {todaySession.title}
          </AppText>
          <AppText style={styles.onImageSoft} numberOfLines={2}>
            „{ifThenSentence(todaySession, plan.answers.time)}“
          </AppText>
          <View style={[styles.cta, { backgroundColor: OnImage.accent }]}>
            <Ionicons name="play" size={20} color={OnImage.onAccent} />
            <AppText variant="heading" style={{ color: OnImage.onAccent }}>
              Jetzt starten
            </AppText>
          </View>
        </ImageCard>
      ) : null}

      {/* 3. Kurz & knackig: die kleinste mögliche Hürde */}
      {quick && !busy ? (
        <Card
          onPress={() => router.push({ pathname: '/training/program/[id]', params: { id: quick.program.id } })}
          style={styles.row}>
          <View style={[styles.quickBadge, { backgroundColor: theme.accent }]}>
            <AppText variant="number" style={[styles.quickNumber, { color: theme.onAccent }]}>
              {quick.minutes}
            </AppText>
            <AppText variant="eyebrow" style={{ color: theme.onAccent }}>
              Min
            </AppText>
          </View>
          <View style={styles.flex}>
            <AppText variant="eyebrow" color="accent">
              Kurz & knackig
            </AppText>
            <AppText variant="heading">{quick.program.name}</AppText>
            <AppText variant="caption" color="textSecondary">
              Wenig Zeit? Auch kurze Einheiten halten deine Gewohnheit am Leben.
            </AppText>
          </View>
          <Ionicons name="play-circle" size={36} color={theme.accent} />
        </Card>
      ) : null}

      {/* 4. Nochmal machen: Wiederholung im gleichen Kontext festigt Gewohnheiten */}
      {options.length > 0 ? (
        <>
          <SectionHeader title="Nochmal machen" />
          {options.map((option) => {
            const info = describe(option, units);
            // Ein zweites Krafttraining kann nicht parallel laufen
            const blocked = option.kind === 'strength' && activeWorkout !== null;
            return (
              <Card key={info.key} onPress={blocked ? undefined : () => repeat(option)} style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: theme.accentSoft }]}>
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
                  size={32}
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

      {/* 5. Freie Wahl: drei große Kacheln, nicht mehr (wenige Optionen erleichtern die Entscheidung) */}
      <SectionHeader title="Trainingsart" />
      <ImageCard
        source={KINDS[0].image}
        height={180}
        accessibilityLabel={`${KINDS[0].title}: ${KINDS[0].description}`}
        onPress={() => router.push(KINDS[0].href)}>
        <KindLabel kind={KINDS[0]} large />
      </ImageCard>
      <View style={styles.pair}>
        {KINDS.slice(1).map((kind) => (
          <ImageCard
            key={kind.title}
            source={kind.image}
            height={170}
            style={styles.flex}
            accessibilityLabel={`${kind.title}: ${kind.description}`}
            onPress={() => router.push(kind.href)}>
            <KindLabel kind={kind} />
          </ImageCard>
        ))}
      </View>

      {/* 6. Werkzeuge */}
      <SectionHeader title="Werkzeuge" />
      <View style={styles.pair}>
        <LinkTile icon="library-outline" title="Übungen" text="Anleitungen und Verlauf" onPress={() => router.push('/training/exercises')} />
        <LinkTile icon="calculator-outline" title="Rechner" text="1RM und Scheiben" onPress={() => router.push('/training/calculator')} />
      </View>
    </Screen>
  );
}

function KindLabel({ kind, large }: { kind: Kind; large?: boolean }) {
  return (
    <View style={styles.kindLabel}>
      <View style={styles.flex}>
        <AppText variant="display" style={[styles.onImage, large ? styles.imageTitle : styles.smallTitle]}>
          {kind.title}
        </AppText>
        <AppText variant="caption" style={styles.onImageSoft} numberOfLines={2}>
          {kind.description}
        </AppText>
      </View>
      {/* In den schmalen Kacheln braucht der Titel die volle Breite, die ganze Kachel ist tippbar */}
      {large ? (
        <View style={[styles.go, { backgroundColor: OnImage.accent }]}>
          <Ionicons name="arrow-forward" size={20} color={OnImage.onAccent} />
        </View>
      ) : null}
    </View>
  );
}

function ActiveCard({ icon, title, text, onPress }: { icon: IconName; title: string; text: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Card onPress={onPress} style={[styles.row, styles.active, { borderColor: theme.accent }]}>
      <View style={[styles.rowIcon, { backgroundColor: theme.accent }]}>
        <Ionicons name={icon} size={22} color={theme.onAccent} />
      </View>
      <View style={styles.flex}>
        <AppText variant="eyebrow" color="accent">
          Läuft gerade
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

function describe(option: RepeatOption, units: Units): { key: string; icon: IconName; title: string; detail: string } {
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
  flex: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  header: { gap: Spacing.one },
  headline: { fontSize: 38, lineHeight: 42, fontWeight: '900' },

  onImage: { color: OnImage.text },
  onImageSoft: { color: OnImage.text, opacity: 0.85 },
  imageTitle: { fontSize: 34, lineHeight: 38, fontWeight: '900' },
  smallTitle: { fontSize: 26, lineHeight: 30, fontWeight: '900' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    minHeight: 52,
    borderRadius: Radius.pill,
    marginTop: Spacing.two,
  },

  quickBadge: { width: 64, height: 64, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  quickNumber: { fontSize: 28, lineHeight: 30 },

  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  active: { borderWidth: 2 },
  rowIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  pair: { flexDirection: 'row', gap: Spacing.three },
  kindLabel: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  go: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
