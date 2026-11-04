import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';
import { successFeedback } from '@/lib/haptics';
import { bestWeight, goalProgress, validateGoal, type StrengthGoal } from '@/lib/logic/goals';
import { displayToKg, formatWeight, kgToDisplay, parseNumber, weightUnitLabel } from '@/lib/logic/units';
import { useGoalsStore } from '@/lib/storage/goals-store';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';

/** Fortschritt zu einem Kraftziel: aktueller Bestwert, Balken vom Start bis zum Ziel, Rest. */
export function GoalCard({ goal, linked = true }: { goal: StrengthGoal; linked?: boolean }) {
  const router = useRouter();
  const theme = useTheme();
  const units = useSettings((state) => state.units);
  const history = useWorkouts((state) => state.history);
  const progress = goalProgress(goal, history);
  const name = getExercise(goal.exerciseId)?.name ?? goal.exerciseId;

  return (
    <Card
      onPress={linked ? () => router.push({ pathname: '/training/exercise/[id]', params: { id: goal.exerciseId } }) : undefined}
      accessibilityLabel={`Ziel ${name}: ${formatWeight(goal.targetKg, units)}`}>
      <View style={styles.head}>
        <Ionicons name={progress.achieved ? 'trophy' : 'flag-outline'} size={20} color={theme.accent} />
        <AppText variant="heading" style={styles.flex}>
          {name}
        </AppText>
        <AppText variant="label" color={progress.achieved ? 'accent' : 'textSecondary'}>
          {formatWeight(progress.currentKg, units)} / {formatWeight(goal.targetKg, units)}
        </AppText>
      </View>
      <ProgressBar progress={progress.ratio} minVisible={0.04} />
      <AppText variant="caption" color={progress.achieved ? 'accent' : 'textSecondary'}>
        {progress.achieved
          ? `Geschafft${progress.achievedAt ? ` am ${new Date(progress.achievedAt).toLocaleDateString('de-DE')}` : ''}! Zeit für das nächste Ziel.`
          : progress.ratio >= 0.9
            ? `Nur noch ${formatWeight(progress.remainingKg, units)}. Du bist fast da!`
            : `Noch ${formatWeight(progress.remainingKg, units)} bis zum Ziel.`}
      </AppText>
    </Card>
  );
}

/** Ziel für eine Übung setzen, ändern oder entfernen (in den Übungsdetails). */
export function GoalEditor({ exerciseId }: { exerciseId: string }) {
  const units = useSettings((state) => state.units);
  const history = useWorkouts((state) => state.history);
  const goal = useGoalsStore((state) => state.goals.find((g) => g.exerciseId === exerciseId));
  const setGoal = useGoalsStore((state) => state.setGoal);
  const removeGoal = useGoalsStore((state) => state.removeGoal);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const currentKg = bestWeight(history, exerciseId);

  function save() {
    const value = parseNumber(text);
    const targetKg = value === null ? null : displayToKg(value, units);
    const problem = validateGoal(targetKg, currentKg);
    if (problem || targetKg === null) {
      setError(problem);
      return;
    }
    setGoal(exerciseId, targetKg, currentKg);
    successFeedback();
    setEditing(false);
    setError(null);
    setText('');
  }

  if (goal && !editing) {
    return (
      <View style={styles.editor}>
        <GoalCard goal={goal} linked={false} />
        <View style={styles.actions}>
          <Button title="Ziel ändern" variant="secondary" onPress={() => setEditing(true)} style={styles.flex} />
          <Button title="Entfernen" variant="ghost" onPress={() => removeGoal(exerciseId)} />
        </View>
      </View>
    );
  }

  if (!editing) {
    return (
      <Card>
        <AppText variant="heading">Setz dir ein Ziel</AppText>
        <AppText variant="caption" color="textSecondary">
          {currentKg > 0
            ? `Dein Bestwert: ${formatWeight(currentKg, units)}. Ein konkretes Ziel mit sichtbarem Abstand motiviert nachweislich stärker als „mehr schaffen“.`
            : 'Ein konkretes Ziel mit sichtbarem Abstand motiviert nachweislich stärker als „mehr schaffen“.'}
        </AppText>
        <Button title="Ziel festlegen" variant="secondary" onPress={() => setEditing(true)} />
      </Card>
    );
  }

  return (
    <Card>
      <AppText variant="heading">Zielgewicht</AppText>
      <TextField
        label={`Ziel in ${weightUnitLabel(units)}${currentKg > 0 ? ` (Bestwert ${kgToDisplay(currentKg, units)})` : ''}`}
        value={text}
        onChangeText={(value) => {
          setText(value);
          setError(null);
        }}
        keyboardType="decimal-pad"
        placeholder={currentKg > 0 ? String(Math.ceil((kgToDisplay(currentKg, units) * 1.1) / 2.5) * 2.5) : 'z.B. 60'}
        error={error ?? undefined}
        autoFocus
      />
      <View style={styles.actions}>
        <Button title="Speichern" onPress={save} style={styles.flex} />
        <Button title="Abbrechen" variant="ghost" onPress={() => setEditing(false)} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
  editor: { gap: Spacing.two },
  actions: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
});
