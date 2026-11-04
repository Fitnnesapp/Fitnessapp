import { Ionicons } from '@expo/vector-icons';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Vibration, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { confirmAction } from '@/lib/confirm';
import { successFeedback, tapFeedback } from '@/lib/haptics';
import { formatClock } from '@/lib/logic/format';
import {
  buildTimeline,
  clampInterval,
  INTERVAL_LIMITS,
  intervalProgram,
  locate,
  totalSeconds,
  type IntervalSettings,
} from '@/lib/logic/timeline';
import { useCountdownSounds } from '@/lib/sounds';

const PRESETS: { label: string; settings: IntervalSettings; hint: string }[] = [
  {
    label: 'Tabata',
    settings: { workSeconds: 20, restSeconds: 10, rounds: 8 },
    hint: '20 s Vollgas, 10 s Pause, 8 Runden',
  },
  {
    label: 'HIIT 40/20',
    settings: { workSeconds: 40, restSeconds: 20, rounds: 10 },
    hint: 'Klassisches Intervalltraining',
  },
  { label: 'EMOM', settings: { workSeconds: 60, restSeconds: 0, rounds: 10 }, hint: 'Jede Minute eine neue Runde' },
  {
    label: 'Sprints',
    settings: { workSeconds: 30, restSeconds: 90, rounds: 6 },
    hint: 'Kurz und schnell, lange Erholung',
  },
];

const RING_SIZE = 260;
const RING_STROKE = 14;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * Freier Intervall-Timer (Tabata, EMOM, eigene Intervalle) für Training ohne festes Programm,
 * z.B. Seilspringen, Sprints oder Zirkel im Studio. Nutzt denselben Ablauf und dieselben Signaltöne
 * wie die Home-Workouts. Wird nicht als Workout gespeichert.
 */
export default function IntervalTimerScreen() {
  const theme = useTheme();
  const sounds = useCountdownSounds();
  const [settings, setSettings] = useState<IntervalSettings>(PRESETS[0].settings);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedBase, setElapsedBase] = useState(0);
  const [runningSince, setRunningSince] = useState<number | null>(null);

  const program = useMemo(() => intervalProgram(settings), [settings]);
  const timeline = useMemo(() => buildTimeline(program), [program]);
  const total = totalSeconds(timeline);

  const active = startedAt !== null;
  const running = runningSince !== null;
  const now = useNow(200, running);
  const elapsedMs = elapsedBase + (runningSince !== null ? Math.max(0, now - runningSince) : 0);
  const position = active ? locate(timeline, elapsedMs) : null;
  const finished = active && position === null;

  // Bildschirm anlassen, solange der Timer läuft (im Browser nicht nötig)
  useEffect(() => {
    if (Platform.OS === 'web' || !running) return;
    const tag = 'interval-timer';
    activateKeepAwakeAsync(tag).catch(() => {});
    return () => {
      deactivateKeepAwake(tag).catch(() => {});
    };
  }, [running]);

  // Signaltöne wie im Workout-Player: 3, 2, 1 und ein langer Ton beim Wechsel
  const lastSignal = useRef('');
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

  // Ende: Zeit anhalten und einmal feiern
  useEffect(() => {
    if (!finished || runningSince === null) return;
    sounds.go();
    successFeedback();
    Vibration.vibrate([0, 400, 200, 400]);
    // Uhr anhalten (asynchron, damit kein Render-Kaskadeneffekt entsteht)
    const timer = setTimeout(() => {
      setElapsedBase(total * 1000);
      setRunningSince(null);
    }, 0);
    return () => clearTimeout(timer);
    // nur beim Übergang zu "fertig"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  function start() {
    tapFeedback();
    lastSignal.current = '';
    setStartedAt(Date.now());
    setElapsedBase(0);
    setRunningSince(Date.now());
  }

  function pause() {
    setElapsedBase(elapsedMs);
    setRunningSince(null);
  }

  function stop() {
    setStartedAt(null);
    setElapsedBase(0);
    setRunningSince(null);
  }

  function change(key: keyof IntervalSettings, delta: number) {
    tapFeedback();
    setSettings((current) => ({ ...current, [key]: clampInterval(key, current[key] + delta) }));
  }

  if (!active) {
    return (
      <Screen>
        <AppText variant="display" style={styles.headline}>
          Intervall-Timer
        </AppText>
        <AppText color="textSecondary">
          Für Seilspringen, Sprints, Zirkel oder jedes Training mit festen Abschnitten. Signaltöne bei 3, 2, 1 und bei
          jedem Wechsel.
        </AppText>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {PRESETS.map((preset) => (
            <Chip
              key={preset.label}
              label={preset.label}
              selected={
                preset.settings.workSeconds === settings.workSeconds &&
                preset.settings.restSeconds === settings.restSeconds &&
                preset.settings.rounds === settings.rounds
              }
              onPress={() => setSettings(preset.settings)}
            />
          ))}
        </ScrollView>
        <AppText variant="caption" color="textSecondary">
          {PRESETS.find(
            (p) =>
              p.settings.workSeconds === settings.workSeconds &&
              p.settings.restSeconds === settings.restSeconds &&
              p.settings.rounds === settings.rounds,
          )?.hint ?? 'Eigene Einstellung'}
        </AppText>

        <Card style={styles.settings}>
          <Stepper
            label="Belastung"
            value={`${program.workSeconds} s`}
            onMinus={() => change('workSeconds', -INTERVAL_LIMITS.workSeconds.step)}
            onPlus={() => change('workSeconds', INTERVAL_LIMITS.workSeconds.step)}
          />
          <Stepper
            label="Pause"
            value={`${program.restSeconds} s`}
            onMinus={() => change('restSeconds', -INTERVAL_LIMITS.restSeconds.step)}
            onPlus={() => change('restSeconds', INTERVAL_LIMITS.restSeconds.step)}
          />
          <Stepper
            label="Runden"
            value={String(program.rounds)}
            onMinus={() => change('rounds', -1)}
            onPlus={() => change('rounds', 1)}
          />
          <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
            <AppText color="textSecondary">Dauer gesamt</AppText>
            <AppText variant="heading">{formatClock(totalSeconds(buildTimeline(program, 0)) * 1000)}</AppText>
          </View>
        </Card>

        <Button title="Timer starten" onPress={start} />
      </Screen>
    );
  }

  const segment = position?.segment;
  const isWork = segment?.kind === 'work';
  const color = finished ? 'success' : isWork ? 'accent' : segment?.kind === 'rest' ? 'success' : 'textSecondary';
  const progress = position ? 1 - position.remainingMs / (position.segment.seconds * 1000) : 1;
  const round = segment ? segment.round + 1 : program.rounds;

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="label" color="textSecondary">
          RUNDE {round} VON {program.rounds}
        </AppText>
        <AppText variant="label" color={color}>
          {finished ? 'GESCHAFFT' : segment?.kind === 'prepare' ? 'GLEICH GEHT’S LOS' : isWork ? 'BELASTUNG' : 'PAUSE'}
        </AppText>
      </View>

      <View style={styles.center}>
        <View style={styles.ring}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={theme.surfaceAlt}
              strokeWidth={RING_STROKE}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={theme[color]}
              strokeWidth={RING_STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, progress)))}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </Svg>
          <View style={[StyleSheet.absoluteFill, styles.ringCenter]}>
            {finished ? (
              <Ionicons name="checkmark" size={96} color={theme.success} />
            ) : (
              <AppText accessibilityLiveRegion="polite" style={[styles.clock, { color: theme[color] }]}>
                {formatClock((position?.remainingMs ?? 0) + 999)}
              </AppText>
            )}
          </View>
        </View>
        <AppText variant="caption" color="textSecondary">
          Gesamt {formatClock(Math.min(elapsedMs, total * 1000))} von {formatClock(total * 1000)}
        </AppText>
      </View>

      {finished ? (
        <>
          <Button title="Nochmal" onPress={start} />
          <Button title="Fertig" variant="secondary" onPress={stop} />
        </>
      ) : (
        <>
          <Button title={running ? 'Pause' : 'Weiter'} onPress={running ? pause : () => setRunningSince(Date.now())} />
          <Button
            title="Beenden"
            variant="ghost"
            onPress={() => {
              const wasRunning = running;
              pause();
              confirmAction({
                title: 'Timer beenden?',
                message: 'Der Timer wird zurückgesetzt.',
                confirmLabel: 'Beenden',
                destructive: false,
                onConfirm: stop,
                onCancel: wasRunning ? () => setRunningSince(Date.now()) : undefined,
              });
            }}
          />
        </>
      )}
    </Screen>
  );
}

function Stepper({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  const theme = useTheme();
  const button = (icon: 'remove' | 'add', onPress: () => void, a11y: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.stepButton, { backgroundColor: theme.surfaceAlt }, pressed && styles.pressed]}>
      <Ionicons name={icon} size={22} color={theme.text} />
    </Pressable>
  );
  return (
    <View style={styles.stepRow}>
      <AppText style={styles.flex}>{label}</AppText>
      {button('remove', onMinus, `${label} verringern`)}
      <AppText variant="number" style={styles.stepValue} accessibilityLabel={`${label}: ${value}`}>
        {value}
      </AppText>
      {button('add', onPlus, `${label} erhöhen`)}
    </View>
  );
}

const styles = StyleSheet.create({
  headline: { fontSize: 34, lineHeight: 38, fontWeight: '900' },
  chips: { gap: Spacing.two },
  settings: { gap: Spacing.three },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  stepButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  stepValue: { width: 72, textAlign: 'center', fontSize: 24, lineHeight: 28 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  content: { gap: Spacing.four },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  center: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  ring: { width: RING_SIZE, height: RING_SIZE },
  ringCenter: { alignItems: 'center', justifyContent: 'center' },
  clock: { fontSize: 72, lineHeight: 80, fontWeight: '800', letterSpacing: -2 },
});
