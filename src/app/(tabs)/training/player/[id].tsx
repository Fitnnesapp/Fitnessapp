import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Vibration, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { getProgram, isFreeProgram } from '@/data/programs';
import { useSubscription } from '@/hooks/use-subscription';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { confirmAction } from '@/lib/confirm';
import { estimateCalories } from '@/lib/logic/calories';
import { formatClock } from '@/lib/logic/format';
import { activeSecondsAt, buildTimeline, exerciseCount, locate, totalSeconds } from '@/lib/logic/timeline';
import { useCountdownSounds } from '@/lib/sounds';
import { useHomeSessions } from '@/lib/storage/home-store';
import { useSettings } from '@/lib/storage/settings-store';

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const program = getProgram(id);
  const { isPremium } = useSubscription();
  const router = useRouter();
  const theme = useTheme();
  const sounds = useCountdownSounds();
  const addSession = useHomeSessions((state) => state.addSession);
  const bodyWeightKg = useSettings((state) => state.bodyWeightKg);

  // Bildschirm während des Trainings anlassen. Im Browser nicht nötig und dort fehleranfällig.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const tag = 'workout-player';
    activateKeepAwakeAsync(tag).catch(() => {});
    return () => {
      deactivateKeepAwake(tag).catch(() => {});
    };
  }, []);

  const timeline = useMemo(() => (program ? buildTimeline(program) : []), [program]);
  const total = totalSeconds(timeline);

  // Die Zeit wird aus Zeitstempeln berechnet, nicht aus Zählschritten. Läuft die App im Hintergrund
  // oder bei gesperrtem Bildschirm weiter, stimmt die Position beim Zurückkehren trotzdem.
  const [startedAt] = useState(() => Date.now());
  const [elapsedBase, setElapsedBase] = useState(0);
  const [runningSince, setRunningSince] = useState<number | null>(() => Date.now());
  const running = runningSince !== null;
  const now = useNow(200, running);
  const elapsedMs = elapsedBase + (runningSince !== null ? Math.max(0, now - runningSince) : 0);

  const position = locate(timeline, elapsedMs);
  const finished = timeline.length > 0 && position === null;

  function pause() {
    setElapsedBase(elapsedMs);
    setRunningSince(null);
  }

  function resume() {
    setRunningSince(Date.now());
  }

  function save(completed: boolean) {
    if (!program) return;
    const activeSeconds = activeSecondsAt(timeline, completed ? total * 1000 : elapsedMs);
    const session = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      type: 'home' as const,
      programId: program.id,
      startedAt,
      endedAt: Date.now(),
      activeSeconds,
      caloriesEstimate: estimateCalories(program.category, activeSeconds, bodyWeightKg),
      effort: null,
      completed,
    };
    addSession(session);
    router.replace({ pathname: '/training/home-summary/[id]', params: { id: session.id } });
  }

  // Beim Ende des Ablaufs automatisch speichern
  const savedRef = useRef(false);
  useEffect(() => {
    if (finished && !savedRef.current) {
      savedRef.current = true;
      Vibration.vibrate([0, 400, 200, 400]);
      sounds.go();
      save(true);
    }
    // save nutzt nur stabile Werte dieser Ausführung
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  // Signaltöne: Countdown 3, 2, 1 und ein langer Ton beim Wechsel des Abschnitts
  const lastSignal = useRef<string>('');
  const segmentIndex = position?.index ?? -1;
  const secondsLeft = position ? Math.ceil(position.remainingMs / 1000) : 0;
  useEffect(() => {
    if (!running || !position) return;

    const key = `${segmentIndex}:${secondsLeft}`;
    if (key === lastSignal.current) return;
    const previous = lastSignal.current.split(':')[0];
    lastSignal.current = key;

    if (String(segmentIndex) !== previous && segmentIndex > 0) {
      sounds.go();
      Vibration.vibrate(200);
    } else if (secondsLeft >= 1 && secondsLeft <= 3) {
      sounds.tick();
    }
    // sounds ist stabil, position wird über segmentIndex und secondsLeft abgedeckt
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentIndex, secondsLeft, running]);

  if (program && !isPremium && !isFreeProgram(program.id)) {
    return <Redirect href={{ pathname: '/training/program/[id]', params: { id: program.id } }} />;
  }

  if (!program) {
    return (
      <Screen>
        <AppText variant="title">Programm nicht gefunden</AppText>
      </Screen>
    );
  }

  if (!position) {
    return (
      <Screen contentStyle={styles.center}>
        <AppText variant="title">Workout abgeschlossen</AppText>
        <AppText color="textSecondary">Dein Ergebnis wird gespeichert.</AppText>
      </Screen>
    );
  }

  const { segment } = position;
  const isWork = segment.kind === 'work';
  const label = segment.kind === 'prepare' ? 'GLEICH GEHT’S LOS' : isWork ? 'ÜBUNG' : 'PAUSE';
  const color = isWork ? 'accent' : segment.kind === 'rest' ? 'success' : 'textSecondary';
  const segmentProgress = 1 - position.remainingMs / (segment.seconds * 1000);
  const overallProgress = Math.min(1, elapsedMs / (total * 1000));
  const shownExercise = Math.min(segment.exerciseIndex + (segment.kind === 'rest' ? 2 : 1), exerciseCount(program));

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="label" color="textSecondary">
          {segment.kind === 'prepare'
            ? program.name.toUpperCase()
            : `ÜBUNG ${shownExercise} VON ${exerciseCount(program)}`}
        </AppText>
        <AppText variant="label" color={color}>
          {label}
        </AppText>
      </View>

      <View style={styles.center}>
        <AppText accessibilityLiveRegion="polite" style={[styles.clock, { color: theme[color] }]}>
          {formatClock(position.remainingMs + 999)}
        </AppText>
        <AppText variant="title" style={styles.name}>
          {segment.kind === 'rest' ? `Als Nächstes: ${segment.step.name}` : segment.step.name}
        </AppText>
        <AppText color="textSecondary" style={styles.name}>
          {segment.step.instruction}
        </AppText>
      </View>

      <ProgressBar value={segmentProgress} color={theme[color]} track={theme.surfaceAlt} />
      <View>
        <AppText variant="caption" color="textSecondary">
          Gesamt {formatClock(elapsedMs)} von {formatClock(total * 1000)}
        </AppText>
        <ProgressBar value={overallProgress} color={theme.textSecondary} track={theme.surfaceAlt} thin />
      </View>

      {!running ? (
        <Card>
          <AppText variant="heading">Pausiert</AppText>
          <AppText color="textSecondary">Die Zeit steht, bis du weitermachst.</AppText>
        </Card>
      ) : null}

      <Button title={running ? 'Pause' : 'Weiter'} onPress={running ? pause : resume} />
      <Button
        title="Beenden und speichern"
        variant="secondary"
        onPress={() => {
          pause();
          confirmAction({
            title: 'Workout beenden?',
            message: 'Das bisher Trainierte wird gespeichert.',
            confirmLabel: 'Beenden',
            destructive: false,
            onConfirm: () => save(false),
          });
        }}
      />
      <Button
        title="Verwerfen"
        variant="ghost"
        onPress={() => {
          pause();
          confirmAction({
            title: 'Workout verwerfen?',
            message: 'Nichts davon wird gespeichert.',
            confirmLabel: 'Verwerfen',
            onConfirm: () => router.replace('/training/home'),
          });
        }}
      />
    </Screen>
  );
}

function ProgressBar({ value, color, track, thin }: { value: number; color: string; track: string; thin?: boolean }) {
  return (
    <View style={[styles.track, { backgroundColor: track, height: thin ? 4 : 10 }]}>
      <View style={{ width: `${Math.round(value * 100)}%`, height: '100%', backgroundColor: color, borderRadius: Radius.pill }} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.four },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  center: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.four },
  clock: { fontSize: 96, lineHeight: 104, fontWeight: '800', letterSpacing: -2 },
  name: { textAlign: 'center' },
  track: { width: '100%', borderRadius: Radius.pill, overflow: 'hidden' },
});
