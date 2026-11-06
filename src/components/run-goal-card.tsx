import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { tapFeedback } from '@/lib/haptics';
import { suggestWeeklyRunGoalM } from '@/lib/logic/run-insights';
import { useRunStore } from '@/lib/storage/run-store';
import { useSettings } from '@/lib/storage/settings-store';

const M_PER_MILE = 1609.344;

type RunGoalCardProps = {
  /** In dieser Woche gelaufene Meter */
  weekM: number;
  /** Beginn der aktuellen Woche (Montag 0 Uhr) */
  weekStartAt: number;
  /** Ganze Tage bis Sonntag einschließlich heute */
  daysLeft: number;
};

/** Wöchentliches Laufziel mit Fortschritt; Ziel per Schritt (5 km bzw. 5 mi) anpassbar. */
export function RunGoalCard({ weekM, weekStartAt, daysLeft }: RunGoalCardProps) {
  const theme = useTheme();
  const units = useSettings((state) => state.units);
  const goalM = useSettings((state) => state.weeklyRunGoalM);
  const setGoal = useSettings((state) => state.setWeeklyRunGoalM);
  const runs = useRunStore((state) => state.history);
  const [editing, setEditing] = useState(false);

  const perUnit = units === 'metric' ? 1000 : M_PER_MILE;
  const unit = units === 'metric' ? 'km' : 'mi';
  const show = (meters: number) => {
    const value = Math.round((meters / perUnit) * 10) / 10;
    return String(value).replace('.', ',');
  };

  if (goalM === null) {
    return (
      <Card style={styles.row}>
        <Ionicons name="flag-outline" size={22} color={theme.accent} />
        <View style={styles.flex}>
          <AppText variant="heading">Wochenziel fürs Laufen</AppText>
          <AppText variant="caption" color="textSecondary">
            Ein fester Umfang pro Woche macht Fortschritt planbar.
          </AppText>
        </View>
        <Button
          title="Setzen"
          variant="secondary"
          onPress={() => {
            setGoal(suggestWeeklyRunGoalM(runs, weekStartAt));
            setEditing(true);
          }}
        />
      </Card>
    );
  }

  const progress = Math.min(1, weekM / goalM);
  const remaining = Math.max(0, goalM - weekM);
  const step = 5 * perUnit;

  function change(direction: 1 | -1) {
    if (goalM === null) return;
    tapFeedback();
    // Auf volle 5er-Schritte der angezeigten Einheit runden
    const steps = Math.round(goalM / step) + direction;
    setGoal(Math.max(1, steps) * step);
  }

  return (
    <Card>
      <View style={styles.head}>
        <AppText variant="label" color="textSecondary">
          WOCHENZIEL LAUFEN
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={editing ? 'Bearbeiten beenden' : 'Wochenziel ändern'}
          hitSlop={8}
          onPress={() => setEditing(!editing)}>
          <AppText variant="label" color="accent">
            {editing ? 'Fertig' : 'Ändern'}
          </AppText>
        </Pressable>
      </View>
      <AppText variant="title">
        {show(weekM)} <AppText color="textSecondary">von {show(goalM)} {unit}</AppText>
      </AppText>
      <ProgressBar progress={progress} />
      <AppText variant="caption" color={remaining === 0 ? 'accent' : 'textSecondary'}>
        {remaining === 0
          ? 'Ziel erreicht. Alles Weitere ist Bonus, Erholung gehört genauso dazu.'
          : `Noch ${show(remaining)} ${unit} in ${daysLeft === 1 ? 'einem Tag' : `${daysLeft} Tagen`}.`}
      </AppText>

      {editing ? (
        <View style={styles.editor}>
          <StepButton icon="remove" label="Ziel verringern" onPress={() => change(-1)} />
          <AppText variant="heading" style={styles.goalValue}>
            {show(goalM)} {unit}
          </AppText>
          <StepButton icon="add" label="Ziel erhöhen" onPress={() => change(1)} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Wochenziel entfernen"
            hitSlop={8}
            onPress={() => {
              setGoal(null);
              setEditing(false);
            }}>
            <AppText variant="label" color="danger">
              Entfernen
            </AppText>
          </Pressable>
        </View>
      ) : null}
      {editing ? (
        <AppText variant="caption" color="textSecondary">
          Faustregel: den Umfang pro Woche um höchstens etwa 10 % steigern.
        </AppText>
      ) : null}
    </Card>
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
      <Ionicons name={icon} size={22} color={theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editor: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  goalValue: { minWidth: 72, textAlign: 'center' },
  stepButton: { width: 44, height: 44, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
});
