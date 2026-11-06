import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { successFeedback, tapFeedback } from '@/lib/haptics';
import {
  createCustomChallenge,
  CUSTOM_DURATIONS,
  CUSTOM_LIMITS,
  unitLabel,
  type ChallengeMetric,
} from '@/lib/logic/challenges';
import { useChallengeStore } from '@/lib/storage/challenge-store';

const METRICS: { value: ChallengeMetric; label: string; hint: string }[] = [
  { value: 'activeDays', label: 'Trainingstage', hint: 'Jeder Tag mit mindestens einer Einheit zählt einmal.' },
  { value: 'workouts', label: 'Workouts', hint: 'Jede Einheit zählt: Kraft, Home-Workout oder Lauf.' },
  { value: 'runKm', label: 'Laufkilometer', hint: 'Alle Läufe zusammen.' },
  { value: 'minutes', label: 'Minuten', hint: 'Gesamte Trainingszeit aller Einheiten.' },
];

/** Eigene Challenge anlegen: Messgröße, Ziel und Dauer wählen, startet sofort. */
export default function NewChallengeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const addCustom = useChallengeStore((state) => state.addCustom);
  const [name, setName] = useState('');
  const [metric, setMetric] = useState<ChallengeMetric>('activeDays');
  const [days, setDays] = useState<number>(30);
  const [target, setTarget] = useState(CUSTOM_LIMITS.activeDays.start);

  const limits = CUSTOM_LIMITS[metric];
  const maxTarget = metric === 'activeDays' ? Math.min(limits.max, days) : limits.max;
  const shownTarget = Math.min(target, maxTarget);
  const perWeek = Math.round((shownTarget / days) * 7 * 10) / 10;

  function changeMetric(next: ChallengeMetric) {
    setMetric(next);
    setTarget(CUSTOM_LIMITS[next].start);
  }

  function step(delta: number) {
    tapFeedback();
    setTarget((current) => Math.min(maxTarget, Math.max(limits.min, Math.min(current, maxTarget) + delta * limits.step)));
  }

  function create() {
    const now = Date.now();
    const challenge = createCustomChallenge({ name, metric, target: shownTarget, days }, now);
    addCustom(challenge, { joinedAt: now, target: challenge.target });
    successFeedback();
    router.replace({ pathname: '/discover/challenge/[id]', params: { id: challenge.id } });
  }

  return (
    <Screen>
      <AppText variant="display" style={styles.headline}>
        Eigene Challenge
      </AppText>
      <AppText color="textSecondary">
        Setz dir ein eigenes Ziel mit festem Zeitraum. Sie startet sofort, Trainings ab heute zählen automatisch.
      </AppText>

      <Card style={styles.card}>
        <AppText variant="label" color="textSecondary">
          WAS ZÄHLT?
        </AppText>
        <View style={styles.chips}>
          {METRICS.map((item) => (
            <Chip key={item.value} label={item.label} selected={metric === item.value} onPress={() => changeMetric(item.value)} />
          ))}
        </View>
        <AppText variant="caption" color="textSecondary">
          {METRICS.find((item) => item.value === metric)?.hint}
        </AppText>

        <AppText variant="label" color="textSecondary">
          ZEITRAUM
        </AppText>
        <View style={styles.chips}>
          {CUSTOM_DURATIONS.map((value) => (
            <Chip key={value} label={`${value} Tage`} selected={days === value} onPress={() => setDays(value)} />
          ))}
        </View>

        <AppText variant="label" color="textSecondary">
          ZIEL
        </AppText>
        <View style={styles.stepRow}>
          <StepButton icon="remove" label="Ziel verringern" onPress={() => step(-1)} />
          <View style={styles.targetBox}>
            <AppText variant="number" style={styles.target}>
              {shownTarget}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              {unitLabel(metric, shownTarget)}
            </AppText>
          </View>
          <StepButton icon="add" label="Ziel erhöhen" onPress={() => step(1)} />
        </View>
        <AppText variant="caption" color={perWeek > 6 && metric === 'activeDays' ? 'danger' : 'textSecondary'}>
          Im Schnitt {String(perWeek).replace('.', ',')} {unitLabel(metric, perWeek)} pro Woche.
          {metric === 'activeDays' && perWeek > 5 ? ' Plane Ruhetage ein, Erholung gehört zum Fortschritt.' : ''}
        </AppText>

        <TextField
          label="Name (optional)"
          value={name}
          onChangeText={setName}
          placeholder={`${shownTarget} ${unitLabel(metric, shownTarget)} in ${days} Tagen`}
          maxLength={40}
        />
      </Card>

      <View style={[styles.note, { backgroundColor: theme.surfaceAlt }]}>
        <Ionicons name="flag" size={18} color={theme.accent} />
        <AppText variant="caption" color="textSecondary" style={styles.flex}>
          Ein selbst gesetztes, konkretes Ziel mit festem Zeitraum motiviert stärker als ein vages „mehr trainieren“.
          Wähle es so, dass es fordert, aber machbar bleibt.
        </AppText>
      </View>

      <Button title="Challenge starten" onPress={create} />
    </Screen>
  );
}

function StepButton({ icon, label, onPress }: { icon: 'add' | 'remove'; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.stepButton, { backgroundColor: theme.surfaceAlt }, pressed && styles.pressed]}>
      <Ionicons name={icon} size={24} color={theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headline: { fontSize: 34, lineHeight: 38, fontWeight: '900' },
  card: { gap: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.four },
  stepButton: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
  targetBox: { alignItems: 'center', minWidth: 110 },
  target: { fontSize: 44, lineHeight: 48 },
  note: { flexDirection: 'row', gap: Spacing.two, padding: Spacing.three, borderRadius: 16 },
  flex: { flex: 1 },
});
